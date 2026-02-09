'use client';

import { useCallback, useState, useTransition, useMemo } from 'react';
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
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { EntityTypeSelect } from '@/components/forms/common/entity-type-select';
import { MoneyInput } from '@/components/forms/common/money-input';
import { CategorySelect } from '@/components/expenses/category-select';
import { PaymentMethodSelect } from '@/components/expenses/payment-method-select';
import { TagsInput } from '@/components/expenses/tags-input';
import { AuditWarnings } from '@/components/expenses/audit-warnings';
import {
  createExpenseAction,
  updateExpenseAction,
} from '@/app/(modules)/expenses/actions';
import { computeAuditFlags } from '@/lib/audit';
import type { ExpenseDecrypted } from '@/server/db/dal/expenses';

type FieldErrors = {
  date?: string;
  vendor?: string;
  amount?: string;
  category?: string;
};

type ExpenseFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  editExpense?: ExpenseDecrypted;
  customCategories?: string[];
  defaultEntityType?: 'personal' | 'business';
};

export function ExpenseFormDialog({
  open,
  onOpenChange,
  year,
  editExpense,
  customCategories = [],
  defaultEntityType,
}: ExpenseFormDialogProps) {
  const isEdit = !!editExpense;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [date, setDate] = useState(editExpense?.date ?? '');
  const [vendor, setVendor] = useState(editExpense?.payload.vendor ?? '');
  const [amount, setAmount] = useState(editExpense?.amount ?? 0);
  const [category, setCategory] = useState(editExpense?.category ?? '');
  const [entityType, setEntityType] = useState<'personal' | 'business'>(
    editExpense?.entityType ?? defaultEntityType ?? 'personal'
  );
  const [paymentMethod, setPaymentMethod] = useState(
    editExpense?.payload.paymentMethod ?? ''
  );
  const [description, setDescription] = useState(
    editExpense?.payload.description ?? ''
  );
  const [notes, setNotes] = useState(editExpense?.payload.notes ?? '');
  const [tags, setTags] = useState<string[]>(editExpense?.payload.tags ?? []);

  const auditFlags = useMemo(
    () =>
      computeAuditFlags({
        category,
        receiptRef: editExpense?.payload.receiptRef,
        notes,
      }),
    [category, editExpense?.payload.receiptRef, notes]
  );

  const validateFields = useCallback((): boolean => {
    const errors: FieldErrors = {};
    
    if (!date) {
      errors.date = 'Date is required';
    }
    if (!vendor.trim()) {
      errors.vendor = 'Vendor name is required';
    }
    if (amount <= 0) {
      errors.amount = 'Amount must be greater than zero';
    }
    if (!category) {
      errors.category = 'Category is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [date, vendor, amount, category]);

  const handleSubmit = useCallback(() => {
    setError(null);
    
    if (!validateFields()) {
      return;
    }

    startTransition(async () => {
      const data = {
        year,
        date,
        vendor: vendor.trim(),
        amount,
        category,
        entityType,
        paymentMethod: paymentMethod || undefined,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        receiptRef: editExpense?.payload.receiptRef,
      };

      const result = isEdit
        ? await updateExpenseAction(editExpense!.id, data)
        : await createExpenseAction(data);

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
    date,
    vendor,
    amount,
    category,
    entityType,
    paymentMethod,
    description,
    notes,
    tags,
    isEdit,
    editExpense,
    onOpenChange,
    validateFields,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Expense' : 'Add Expense'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the expense details below.'
              : 'Enter the details for this expense.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-6 pb-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field error={!!fieldErrors.date}>
                <FieldLabel>Date *</FieldLabel>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  aria-invalid={!!fieldErrors.date}
                />
                {fieldErrors.date && <FieldError>{fieldErrors.date}</FieldError>}
              </Field>
              <Field error={!!fieldErrors.vendor}>
                <FieldLabel>Vendor *</FieldLabel>
                <Input
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="Vendor or payee name"
                  aria-invalid={!!fieldErrors.vendor}
                />
                {fieldErrors.vendor && <FieldError>{fieldErrors.vendor}</FieldError>}
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field error={!!fieldErrors.amount}>
                <FieldLabel>Amount *</FieldLabel>
                <MoneyInput 
                  value={amount} 
                  onChange={setAmount}
                  aria-invalid={!!fieldErrors.amount}
                />
                {fieldErrors.amount && <FieldError>{fieldErrors.amount}</FieldError>}
              </Field>
              <Field error={!!fieldErrors.category}>
                <FieldLabel>Category *</FieldLabel>
                <CategorySelect
                  value={category}
                  onChange={setCategory}
                  customCategories={customCategories}
                />
                {fieldErrors.category && <FieldError>{fieldErrors.category}</FieldError>}
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Entity</FieldLabel>
                <EntityTypeSelect
                  value={entityType}
                  onChange={setEntityType}
                />
              </Field>
              <Field>
                <FieldLabel>Payment Method</FieldLabel>
                <PaymentMethodSelect
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel>Description</FieldLabel>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description..."
              />
            </Field>

            <Field>
              <FieldLabel>Notes</FieldLabel>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes (recommended for meals and travel)..."
                rows={2}
              />
            </Field>

            <Field>
              <FieldLabel>Tags</FieldLabel>
              <TagsInput value={tags} onChange={setTags} />
            </Field>

            {auditFlags.length > 0 && <AuditWarnings flags={auditFlags} />}

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
                : 'Add Expense'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
