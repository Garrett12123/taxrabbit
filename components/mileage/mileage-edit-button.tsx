'use client';

import { useState, useTransition } from 'react';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { updateMileageAction } from '@/app/(modules)/mileage/actions';

type Props = {
  id: string;
  year: number;
  date: string;
  miles: number; // miles * 100 (already doubled if round trip)
  destination?: string;
  purpose?: string;
  isRoundTrip?: boolean;
};

export function MileageEditButton({ id, year, date, miles, destination, purpose, isRoundTrip }: Props) {
  const [open, setOpen] = useState(false);
  const [editDate, setEditDate] = useState(date);
  // If round trip, display the one-way miles (stored miles / 2)
  const displayMiles = isRoundTrip ? miles / 200 : miles / 100;
  const [editMiles, setEditMiles] = useState(String(displayMiles));
  const [editDestination, setEditDestination] = useState(destination || '');
  const [editPurpose, setEditPurpose] = useState(purpose || '');
  const [editIsRoundTrip, setEditIsRoundTrip] = useState(isRoundTrip ?? false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setError('');
    const milesNum = parseFloat(editMiles);
    if (!milesNum || milesNum <= 0) {
      setError('Enter a valid number of miles.');
      return;
    }

    startTransition(async () => {
      const result = await updateMileageAction(id, {
        year,
        date: editDate,
        miles: milesNum,
        isRoundTrip: editIsRoundTrip,
        purpose: editPurpose || undefined,
        destination: editDestination || undefined,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        toast.success('Trip updated.');
      }
    });
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
      >
        <Pencil className="size-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Trip</DialogTitle>
            <DialogDescription>
              Update the mileage log details.
            </DialogDescription>
          </DialogHeader>

          <DialogBody>
            <div className="space-y-4 pb-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Date</FieldLabel>
                  <Input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                  />
                </Field>
                <Field error={!!error && error.includes('miles')}>
                  <FieldLabel>Miles (one-way)</FieldLabel>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="e.g. 24.5"
                    value={editMiles}
                    onChange={(e) => setEditMiles(e.target.value)}
                  />
                </Field>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-round-trip"
                  checked={editIsRoundTrip}
                  onCheckedChange={(checked) => setEditIsRoundTrip(checked === true)}
                />
                <Label htmlFor="edit-round-trip" className="text-sm cursor-pointer">
                  Round trip (doubles miles)
                </Label>
                {editIsRoundTrip && editMiles && (
                  <span className="text-sm text-muted-foreground">
                    Total: {(parseFloat(editMiles) * 2).toFixed(1)} miles
                  </span>
                )}
              </div>

              <Field>
                <FieldLabel>Destination</FieldLabel>
                <Input
                  type="text"
                  placeholder="e.g. Client office"
                  value={editDestination}
                  onChange={(e) => setEditDestination(e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel>Purpose</FieldLabel>
                <Input
                  type="text"
                  placeholder="e.g. Client meeting"
                  value={editPurpose}
                  onChange={(e) => setEditPurpose(e.target.value)}
                />
              </Field>

              {error && <FieldError>{error}</FieldError>}
            </div>
          </DialogBody>

          <DialogFooter className="flex-row gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending && <Spinner className="size-4" />}
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
