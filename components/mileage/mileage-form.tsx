'use client';

import { useState, useTransition, useCallback } from 'react';

import { toast } from 'sonner';

import { LoadingButton } from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldError } from '@/components/ui/field';
import { addMileageAction } from '@/app/(modules)/mileage/actions';
import { useSaveShortcut } from '@/hooks/use-save-shortcut';

type Props = {
  year: number;
};

export function MileageForm({ year }: Props) {
  // Use local date instead of UTC to avoid off-by-one in US timezones
  const [date, setDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [miles, setMiles] = useState('');
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [destination, setDestination] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');

    const milesNum = parseFloat(miles);
    if (!milesNum || milesNum <= 0) {
      setError('Enter a valid number of miles.');
      return;
    }

    startTransition(async () => {
      const result = await addMileageAction({
        year,
        date,
        miles: milesNum,
        isRoundTrip,
        purpose: purpose || undefined,
        destination: destination || undefined,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        setMiles('');
        setIsRoundTrip(false);
        setPurpose('');
        setDestination('');
        setSuccess(true);
        toast.success('Trip logged successfully.');
      }
    });
  }, [year, date, miles, isRoundTrip, purpose, destination]);

  // Cmd+S to save
  useSaveShortcut(handleSubmit, !isPending);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Date + Miles row */}
      <div className="grid gap-4 grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="mileage-date">Date</Label>
          <Input
            id="mileage-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <Field error={!!error && !miles}>
          <div className="space-y-1.5">
            <Label htmlFor="mileage-miles">Miles</Label>
            <Input
              id="mileage-miles"
              type="text"
              inputMode="decimal"
              placeholder="24.5"
              value={miles}
              onChange={(e) => {
                setMiles(e.target.value);
                if (error) setError('');
              }}
              aria-invalid={!!error && !miles ? true : undefined}
            />
          </div>
          {error && <FieldError>{error}</FieldError>}
        </Field>
      </div>

      {/* Round trip toggle */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="mileage-round-trip"
          checked={isRoundTrip}
          onCheckedChange={(checked) => setIsRoundTrip(checked === true)}
        />
        <Label htmlFor="mileage-round-trip" className="text-sm cursor-pointer">
          Round trip
        </Label>
        {isRoundTrip && miles && !isNaN(parseFloat(miles)) && parseFloat(miles) > 0 && (
          <span className="text-xs text-muted-foreground ml-auto">
            = {(parseFloat(miles) * 2).toFixed(1)} mi total
          </span>
        )}
      </div>

      {/* Destination */}
      <div className="space-y-1.5">
        <Label htmlFor="mileage-destination">Destination <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Input
          id="mileage-destination"
          type="text"
          placeholder="Client office"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
      </div>

      {/* Purpose */}
      <div className="space-y-1.5">
        <Label htmlFor="mileage-purpose">Purpose <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Input
          id="mileage-purpose"
          type="text"
          placeholder="Client meeting"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        />
      </div>

      <LoadingButton
        type="submit"
        className="w-full"
        loading={isPending}
        success={success}
        loadingText="Saving..."
        successText="Logged"
      >
        Add Trip
      </LoadingButton>
    </form>
  );
}
