'use client';

import { useCallback, useState, useTransition } from 'react';
import { CheckCircle2 } from 'lucide-react';

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { MoneyInput } from '@/components/forms/common/money-input';
import { EntityTypeSelect } from '@/components/forms/common/entity-type-select';
import { quickAddW2Action } from '@/app/(modules)/imports/actions';

type QuickAddW2DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
};

export function QuickAddW2Dialog({
  open,
  onOpenChange,
  year,
}: QuickAddW2DialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [employerName, setEmployerName] = useState('');
  const [entityType, setEntityType] = useState<'personal' | 'business'>(
    'personal'
  );
  const [box1, setBox1] = useState(0);
  const [box2, setBox2] = useState(0);

  const resetForm = useCallback(() => {
    setEmployerName('');
    setEntityType('personal');
    setBox1(0);
    setBox2(0);
    setError(null);
    setSuccess(false);
  }, []);

  const handleSubmit = useCallback(() => {
    setError(null);

    if (!employerName.trim()) {
      setError('Employer name is required.');
      return;
    }

    startTransition(async () => {
      const data = {
        year,
        formType: 'W-2',
        entityType,
        issuerName: employerName.trim(),
        boxes: {
          box1,
          box2,
        },
      };

      const result = await quickAddW2Action(data);

      if (result?.error) {
        setError(result.error);
        return;
      }

      setSuccess(true);
    });
  }, [year, employerName, entityType, box1, box2]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) resetForm();
      onOpenChange(open);
    },
    [onOpenChange, resetForm]
  );

  if (success) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center gap-4 py-6">
            <div className="rounded-full bg-green-500/10 p-4">
              <CheckCircle2 className="size-10 text-green-600" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium">W-2 Added</p>
              <p className="text-sm text-muted-foreground">
                {employerName} has been saved. You can edit all fields in the
                Income module.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => resetForm()}>
                Add Another
              </Button>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Add W-2</DialogTitle>
          <DialogDescription>
            Enter the key fields from your W-2. You can add more details later
            in the Income module.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-4">
            <Field>
              <FieldLabel>Employer Name *</FieldLabel>
              <Input
                value={employerName}
                onChange={(e) => setEmployerName(e.target.value)}
                placeholder="Employer name"
              />
            </Field>

            <Field>
              <FieldLabel>Entity</FieldLabel>
              <EntityTypeSelect value={entityType} onChange={setEntityType} />
            </Field>

            <Field>
              <FieldLabel>Box 1 - Wages *</FieldLabel>
              <MoneyInput
                value={box1}
                onChange={setBox1}
                placeholder="0.00"
              />
            </Field>

            <Field>
              <FieldLabel>Box 2 - Federal Tax Withheld</FieldLabel>
              <MoneyInput
                value={box2}
                onChange={setBox2}
                placeholder="0.00"
              />
            </Field>

            {error && <FieldError>{error}</FieldError>}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Saving...' : 'Add W-2'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
