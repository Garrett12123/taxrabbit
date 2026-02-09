'use client';

import { cn } from '@/lib/utils';
import type { TaxYearStatus } from '@/server/db/dal/tax-years';

type Props = {
  status: TaxYearStatus;
  className?: string;
};

const statusConfig: Record<TaxYearStatus, { label: string; className: string }> = {
  open: {
    label: 'Open',
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  },
  filed: {
    label: 'Filed',
    className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  },
  amended: {
    label: 'Amended',
    className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
};

export function TaxYearStatusBadge({ status, className }: Props) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
