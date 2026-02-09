'use client';

import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type CopyButtonProps = {
  value: string;
  label?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'xs' | 'icon' | 'icon-sm';
  onCopied?: () => void;
};

/**
 * Copy button with icon crossfade feedback.
 * Copy icon → Check icon with smooth transition + success glow.
 */
export function CopyButton({
  value,
  label = 'Copy',
  className,
  variant = 'outline',
  size = 'sm',
  onCopied,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopied?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      onCopied?.();
      setTimeout(() => setCopied(false), 2000);
    }
  }, [value, onCopied]);

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn(
        'relative overflow-hidden',
        'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
        copied && 'success-glow border-positive/30 text-positive',
        className,
      )}
    >
      {/* Copy icon/text */}
      <span
        className={cn(
          'flex items-center gap-1.5',
          'transition-all duration-200 ease-out',
          copied && 'opacity-0 scale-90',
        )}
      >
        <Copy className="size-4" />
        {label}
      </span>

      {/* Success state — crossfade in */}
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center gap-1.5',
          'transition-all duration-200 ease-out',
          copied
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-90 pointer-events-none',
        )}
      >
        <Check className="size-4" />
        Copied
      </span>
    </Button>
  );
}
