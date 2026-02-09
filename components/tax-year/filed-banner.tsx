'use client';

import { AlertTriangle, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TaxYearStatus } from '@/server/db/dal/tax-years';

type Props = {
  status: TaxYearStatus;
  year: number;
  className?: string;
};

export function FiledBanner({ status, year, className }: Props) {
  if (status !== 'filed' && status !== 'amended') {
    return null;
  }

  const isFiled = status === 'filed';

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border px-4 py-3',
        isFiled
          ? 'border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-400'
          : 'border-purple-500/30 bg-purple-500/5 text-purple-700 dark:text-purple-400',
        className
      )}
    >
      {isFiled ? (
        <Lock className="size-4 shrink-0" />
      ) : (
        <AlertTriangle className="size-4 shrink-0" />
      )}
      <div className="flex-1 text-sm">
        <strong className="font-medium">
          {isFiled ? 'Tax year filed' : 'Tax year amended'}
        </strong>
        <span className="text-muted-foreground ml-1">
          — Your {year} return has been {isFiled ? 'filed' : 'amended'}. 
          Changes made here won&apos;t affect your filed return.
        </span>
      </div>
    </div>
  );
}
