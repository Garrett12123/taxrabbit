'use client';

import { useState, useTransition } from 'react';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TaxYearStatusBadge } from './tax-year-status-badge';
import { updateTaxYearStatusAction } from '@/app/(modules)/overview/actions';
import type { TaxYearStatus } from '@/server/db/dal/tax-years';
import { cn } from '@/lib/utils';

type Props = {
  year: number;
  currentStatus: TaxYearStatus;
};

const statusOptions: { value: TaxYearStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'filed', label: 'Filed' },
  { value: 'amended', label: 'Amended' },
];

export function TaxYearStatusSelect({ year, currentStatus }: Props) {
  const [status, setStatus] = useState<TaxYearStatus>(currentStatus);
  const [isPending, startTransition] = useTransition();

  const handleChange = (newStatus: TaxYearStatus) => {
    if (newStatus === status) return;
    setStatus(newStatus);
    startTransition(async () => {
      const result = await updateTaxYearStatusAction(year, newStatus);
      if (result.error) {
        toast.error(result.error);
        setStatus(currentStatus); // Revert on error
      } else {
        toast.success(`Tax year status updated to ${statusOptions.find(o => o.value === newStatus)?.label}`);
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isPending}
        className={cn(
          'inline-flex items-center gap-1 rounded-full outline-none',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'transition-opacity',
          isPending && 'opacity-50'
        )}
      >
        <TaxYearStatusBadge status={status} />
        <ChevronDown className="size-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {statusOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleChange(option.value)}
            className={cn(status === option.value && 'bg-muted')}
          >
            <TaxYearStatusBadge status={option.value} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
