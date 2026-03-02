'use client';

import { useCallback, useState, useTransition } from 'react';
import { Spinner } from '@/components/ui/spinner';

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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { MoneyInput } from '@/components/forms/common/money-input';
import {
  createUtilityBillAction,
  updateUtilityBillAction,
} from '@/app/(modules)/utilities/actions';
import { UTILITY_TYPES, UTILITY_USAGE_UNITS, type UtilityType } from '@/lib/constants';
import type { UtilityBillDecrypted } from '@/server/db/dal/utility-bills';

type FieldErrors = {
  utilityType?: string;
  billDate?: string;
  provider?: string;
  amount?: string;
};

type UtilityFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  editBill?: UtilityBillDecrypted;
};

export function UtilityFormDialog({
  open,
  onOpenChange,
  year,
  editBill,
}: UtilityFormDialogProps) {
  const isEdit = !!editBill;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [utilityType, setUtilityType] = useState<UtilityType>(
    (editBill?.utilityType as UtilityType) ?? 'Electric'
  );
  const [billDate, setBillDate] = useState(editBill?.billDate ?? '');
  const [provider, setProvider] = useState(editBill?.payload.provider ?? '');
  const [amount, setAmount] = useState(editBill?.amount ?? 0);
  const [consumptionCharges, setConsumptionCharges] = useState(
    editBill?.payload.consumptionCharges ?? 0
  );
  const [otherCharges, setOtherCharges] = useState(
    editBill?.payload.otherCharges ?? 0
  );
  const [usage, setUsage] = useState(
    editBill?.payload.usage != null ? String(editBill.payload.usage) : ''
  );
  const [usageUnit, setUsageUnit] = useState(
    editBill?.payload.usageUnit ?? UTILITY_USAGE_UNITS[utilityType] ?? ''
  );
  const [notes, setNotes] = useState(editBill?.payload.notes ?? '');

  const handleUtilityTypeChange = (val: UtilityType) => {
    setUtilityType(val);
    setUsageUnit(UTILITY_USAGE_UNITS[val] ?? '');
  };

  const validateFields = useCallback((): boolean => {
    const errors: FieldErrors = {};

    if (!utilityType) {
      errors.utilityType = 'Utility type is required';
    }
    if (!billDate) {
      errors.billDate = 'Bill date is required';
    }
    if (!provider.trim()) {
      errors.provider = 'Provider is required';
    }
    if (amount <= 0) {
      errors.amount = 'Amount must be greater than zero';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [utilityType, billDate, provider, amount]);

  const handleSubmit = useCallback(() => {
    setError(null);

    if (!validateFields()) {
      return;
    }

    startTransition(async () => {
      const data = {
        year,
        utilityType,
        billDate,
        provider: provider.trim(),
        amount,
        consumptionCharges: consumptionCharges || undefined,
        otherCharges: otherCharges || undefined,
        usage: usage ? parseFloat(usage) : undefined,
        usageUnit: usageUnit || undefined,
        notes: notes.trim() || undefined,
      };

      const result = isEdit
        ? await updateUtilityBillAction(editBill!.id, data)
        : await createUtilityBillAction(data);

      if (result?.error) {
        setError(
          typeof result.error === 'string'
            ? result.error
            : 'Validation failed. Check your entries.'
        );
        return;
      }

      onOpenChange(false);
    });
  }, [
    year,
    utilityType,
    billDate,
    provider,
    amount,
    consumptionCharges,
    otherCharges,
    usage,
    usageUnit,
    notes,
    isEdit,
    editBill,
    onOpenChange,
    validateFields,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Utility Bill' : 'Add Utility Bill'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the utility bill details below.'
              : 'Enter the details for this utility bill.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-6 pb-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field error={!!fieldErrors.utilityType}>
                <FieldLabel>Utility Type *</FieldLabel>
                <Select value={utilityType} onValueChange={handleUtilityTypeChange}>
                  <SelectTrigger aria-invalid={!!fieldErrors.utilityType}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {UTILITY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.utilityType && <FieldError>{fieldErrors.utilityType}</FieldError>}
              </Field>
              <Field error={!!fieldErrors.billDate}>
                <FieldLabel>Bill Date *</FieldLabel>
                <Input
                  type="date"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  aria-invalid={!!fieldErrors.billDate}
                />
                {fieldErrors.billDate && <FieldError>{fieldErrors.billDate}</FieldError>}
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field error={!!fieldErrors.provider}>
                <FieldLabel>Provider *</FieldLabel>
                <Input
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  placeholder="e.g. Duke Energy, Spectrum"
                  aria-invalid={!!fieldErrors.provider}
                />
                {fieldErrors.provider && <FieldError>{fieldErrors.provider}</FieldError>}
              </Field>
              <Field error={!!fieldErrors.amount}>
                <FieldLabel>Total Amount *</FieldLabel>
                <MoneyInput
                  value={amount}
                  onChange={setAmount}
                  aria-invalid={!!fieldErrors.amount}
                />
                {fieldErrors.amount && <FieldError>{fieldErrors.amount}</FieldError>}
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Consumption Charges</FieldLabel>
                <MoneyInput
                  value={consumptionCharges}
                  onChange={setConsumptionCharges}
                />
              </Field>
              <Field>
                <FieldLabel>Other Charges</FieldLabel>
                <MoneyInput
                  value={otherCharges}
                  onChange={setOtherCharges}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Usage</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={usage}
                  onChange={(e) => setUsage(e.target.value)}
                  placeholder="e.g. 450"
                />
              </Field>
              <Field>
                <FieldLabel>Usage Unit</FieldLabel>
                <Input
                  value={usageUnit}
                  onChange={(e) => setUsageUnit(e.target.value)}
                  placeholder="e.g. kWh, gallons"
                />
              </Field>
            </div>

            <Field>
              <FieldLabel>Notes</FieldLabel>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
                rows={2}
              />
            </Field>

            {error && <FieldError>{error}</FieldError>}
          </div>
        </DialogBody>

        <DialogFooter className="flex-row gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Spinner className="size-4" />}
            {isPending
              ? 'Saving...'
              : isEdit
                ? 'Update'
                : 'Add Bill'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
