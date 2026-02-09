'use client';

import { useState, useTransition } from 'react';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { recordPaymentAction } from '@/app/(modules)/estimated-payments/actions';
import { parseDollarsToCents } from '@/lib/utils';

type Props = {
  year: number;
  quarter: number;
};

export function EstimatedPaymentForm({ year, quarter }: Props) {
  const [amount, setAmount] = useState('');
  // Use local date instead of UTC to avoid off-by-one in US timezones
  const [datePaid, setDatePaid] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountCents = parseDollarsToCents(amount);
    if (amountCents === null || amountCents <= 0) {
      setError('Enter a valid amount.');
      return;
    }

    startTransition(async () => {
      const result = await recordPaymentAction({
        year,
        quarter,
        amountPaid: amountCents,
        datePaid,
        confirmationNumber: confirmation || undefined,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setAmount('');
        setConfirmation('');
        toast.success('Payment recorded.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`amount-${quarter}`} className="text-xs">
            Amount Paid
          </Label>
          <Input
            id={`amount-${quarter}`}
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`date-${quarter}`} className="text-xs">
            Date Paid
          </Label>
          <Input
            id={`date-${quarter}`}
            type="date"
            value={datePaid}
            onChange={(e) => setDatePaid(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`conf-${quarter}`} className="text-xs">
          Confirmation # (optional)
        </Label>
        <Input
          id={`conf-${quarter}`}
          type="text"
          placeholder="e.g. IRS-12345"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
        />
      </div>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? 'Saving...' : 'Record Payment'}
      </Button>
    </form>
  );
}
