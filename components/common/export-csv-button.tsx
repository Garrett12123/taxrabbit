'use client';

import { useState, useCallback } from 'react';
import { Download, Check } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type ExportCsvButtonProps = {
  module: 'expenses' | 'income' | 'mileage';
  year: number;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
};

export function ExportCsvButton({
  module,
  year,
  variant = 'outline',
  size = 'default',
}: ExportCsvButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleExport = useCallback(async () => {
    setState('loading');

    try {
      const response = await fetch(`/api/export/${module}?year=${year}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Export failed (${response.status})`);
      }

      // Get the blob and trigger download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${module}-${year}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setState('success');
      setTimeout(() => setState('idle'), 2000);
    } catch (err) {
      setState('idle');
      toast.error(err instanceof Error ? err.message : 'Export failed. Please try again.');
    }
  }, [module, year]);

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={state === 'loading'}
      className={cn(
        'relative overflow-hidden',
        'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
        state === 'success' && 'border-positive/30 text-positive',
        state === 'loading' && 'shimmer-premium',
      )}
    >
      {/* Idle state */}
      <span
        className={cn(
          'flex items-center gap-2',
          'transition-all duration-200 ease-out',
          state !== 'idle' && 'opacity-0 scale-95',
        )}
      >
        <Download className="size-4" />
        Export CSV
      </span>

      {/* Loading state */}
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center gap-2',
          'transition-all duration-200 ease-out',
          state === 'loading' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none',
        )}
      >
        <Spinner className="size-4" />
        Exporting...
      </span>

      {/* Success state */}
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center gap-2',
          'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          state === 'success' ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none',
        )}
      >
        <Check className="size-4" />
        Exported
      </span>
    </Button>
  );
}
