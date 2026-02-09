'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { updateFilingStatusAction } from '@/app/(modules)/overview/actions';
import type { FilingStatus } from '@/server/db/dal/tax-years';

type Props = {
  year: number;
  currentStatus: FilingStatus;
};

const statusOptions: { value: FilingStatus; label: string; description: string }[] = [
  { value: 'single', label: 'Single', description: 'Unmarried or legally separated' },
  { value: 'mfj', label: 'Married Filing Jointly', description: 'Married, filing together' },
  { value: 'mfs', label: 'Married Filing Separately', description: 'Married, filing apart' },
  { value: 'hoh', label: 'Head of Household', description: 'Unmarried with dependent' },
];

export function FilingStatusSelect({ year, currentStatus }: Props) {
  const [status, setStatus] = useState<FilingStatus>(currentStatus);
  const [isPending, startTransition] = useTransition();

  const handleChange = (newStatus: FilingStatus) => {
    setStatus(newStatus);
    startTransition(async () => {
      const result = await updateFilingStatusAction(year, newStatus);
      if (result.error) {
        toast.error(result.error);
        setStatus(currentStatus);
      } else {
        toast.success('Filing status updated');
      }
    });
  };

  const currentOption = statusOptions.find(o => o.value === status);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">Filing Status</Label>
      <Select value={status} onValueChange={handleChange} disabled={isPending}>
        <SelectTrigger className="w-full">
          <SelectValue>{currentOption?.label}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex flex-col">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
