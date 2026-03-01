'use client';

import { useCallback, useState, useTransition } from 'react';
import { AlertCircle, ClipboardPaste } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EinInput } from '@/components/ui/ein-input';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { SmartPasteDialog } from '@/components/forms/smart-paste-dialog';
import { FormTypeSelect } from '@/components/forms/common/form-type-select';
import { EntityTypeSelect } from '@/components/forms/common/entity-type-select';
import { CompletenessBadge } from '@/components/forms/common/completeness-badge';
import { IncomeFormFields } from '@/components/forms/income-form-fields';
import {
  createIncomeAction,
  updateIncomeAction,
} from '@/app/(modules)/income/actions';
import { computeCompleteness } from '@/lib/completeness';
import type { IncomeFormType } from '@/lib/constants';
import type { IncomeDocumentDecrypted } from '@/lib/types/income';
import type { SmartPasteResult } from '@/lib/smart-paste';

type FieldErrors = {
  issuerName?: string;
  issuerEin?: string;
};

type IncomeFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  editDocument?: IncomeDocumentDecrypted;
};

export function IncomeFormDialog({
  open,
  onOpenChange,
  year,
  editDocument,
}: IncomeFormDialogProps) {
  const isEdit = !!editDocument;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [formType, setFormType] = useState(
    editDocument?.formType ?? 'W-2'
  );
  const [entityType, setEntityType] = useState<'personal' | 'business'>(
    editDocument?.entityType ?? 'personal'
  );
  const [issuerName, setIssuerName] = useState(
    editDocument?.payload.issuerName ?? ''
  );
  const [issuerEin, setIssuerEin] = useState(
    editDocument?.payload.issuerEin?.replace(/\D/g, '') ?? ''
  );
  const [issuerAddress, setIssuerAddress] = useState(
    editDocument?.payload.issuerAddress ?? ''
  );
  const [issuerCity, setIssuerCity] = useState(
    editDocument?.payload.issuerCity ?? ''
  );
  const [issuerState, setIssuerState] = useState(
    editDocument?.payload.issuerState ?? ''
  );
  const [issuerZip, setIssuerZip] = useState(
    editDocument?.payload.issuerZip ?? ''
  );
  const [accountNumber, setAccountNumber] = useState(
    editDocument?.payload.accountNumber ?? ''
  );
  const [controlNumber, setControlNumber] = useState(
    editDocument?.payload.controlNumber ?? ''
  );
  const [notes, setNotes] = useState(editDocument?.payload.notes ?? '');
  const [boxes, setBoxes] = useState<Record<string, number | string | boolean>>(
    editDocument?.payload.boxes ?? {}
  );
  const [smartPasteOpen, setSmartPasteOpen] = useState(false);

  const handleSmartPasteApply = useCallback(
    (result: SmartPasteResult) => {
      setBoxes((prev) => ({ ...prev, ...result.boxes }));
      if (result.issuerName) setIssuerName(result.issuerName);
      if (result.issuerEin) setIssuerEin(result.issuerEin);
      if (result.issuerAddress) setIssuerAddress(result.issuerAddress);
      if (result.issuerState) setIssuerState(result.issuerState);
    },
    []
  );

  const completeness = computeCompleteness(
    formType as IncomeFormType,
    boxes,
    issuerName
  );

  const validateFields = useCallback((): boolean => {
    const errors: FieldErrors = {};
    
    if (!issuerName.trim()) {
      errors.issuerName = formType === 'W-2' ? 'Employer name is required' : 'Payer name is required';
    }
    if (issuerEin && issuerEin.length !== 9) {
      errors.issuerEin = 'EIN must be 9 digits';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [issuerName, issuerEin, formType]);

  const handleSubmit = useCallback(() => {
    setError(null);
    
    if (!validateFields()) {
      return;
    }

    startTransition(async () => {
      // Format EIN with dash for storage
      const formattedEin = issuerEin 
        ? `${issuerEin.slice(0, 2)}-${issuerEin.slice(2)}`
        : undefined;

      const data = {
        year,
        formType,
        entityType,
        issuerName: issuerName.trim(),
        issuerEin: formattedEin,
        issuerAddress: issuerAddress.trim() || undefined,
        issuerCity: issuerCity.trim() || undefined,
        issuerState: issuerState.trim().toUpperCase() || undefined,
        issuerZip: issuerZip.trim() || undefined,
        accountNumber: accountNumber.trim() || undefined,
        controlNumber: controlNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        boxes,
      };

      const result = isEdit
        ? await updateIncomeAction(editDocument!.id, data)
        : await createIncomeAction(data);

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
    formType,
    entityType,
    issuerName,
    issuerEin,
    issuerAddress,
    issuerCity,
    issuerState,
    issuerZip,
    accountNumber,
    controlNumber,
    notes,
    boxes,
    isEdit,
    editDocument,
    onOpenChange,
    validateFields,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Edit ${formType}` : 'Add Income Form'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the form details below.'
              : 'Enter the details from your tax form.'}
          </DialogDescription>
          <div className="flex items-center gap-3 pt-2">
            <CompletenessBadge completeness={completeness} showProgress />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSmartPasteOpen(true)}
              className="h-7 gap-1.5 text-xs"
            >
              <ClipboardPaste className="size-3.5" />
              Paste from PDF
            </Button>
          </div>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-6 pb-4">
            {/* Common Fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Form Type</FieldLabel>
                <FormTypeSelect
                  value={formType}
                  onChange={(v) => {
                    setFormType(v);
                    setBoxes({});
                  }}
                  disabled={isEdit}
                />
              </Field>
              <Field>
                <FieldLabel>Entity</FieldLabel>
                <EntityTypeSelect
                  value={entityType}
                  onChange={setEntityType}
                />
              </Field>
            </div>

            {/* Payer/Employer Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">
                {formType === 'W-2' ? 'Employer Information' : 'Payer Information'}
              </h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field error={!!fieldErrors.issuerName}>
                  <FieldLabel>
                    {formType === 'W-2' ? 'Employer Name *' : 'Payer Name *'}
                  </FieldLabel>
                  <Input
                    value={issuerName}
                    onChange={(e) => setIssuerName(e.target.value)}
                    placeholder={
                      formType === 'W-2' ? 'Employer name' : 'Payer name'
                    }
                    aria-invalid={!!fieldErrors.issuerName}
                  />
                  {fieldErrors.issuerName && <FieldError>{fieldErrors.issuerName}</FieldError>}
                </Field>
                <Field error={!!fieldErrors.issuerEin}>
                  <FieldLabel>EIN</FieldLabel>
                  <EinInput
                    value={issuerEin}
                    onChange={setIssuerEin}
                    aria-invalid={!!fieldErrors.issuerEin}
                  />
                  {fieldErrors.issuerEin && <FieldError>{fieldErrors.issuerEin}</FieldError>}
                </Field>
              </div>
              <Field>
                <FieldLabel>Street Address</FieldLabel>
                <Input
                  value={issuerAddress}
                  onChange={(e) => setIssuerAddress(e.target.value)}
                  placeholder="123 Main St, Suite 100"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-4">
                <Field className="sm:col-span-2">
                  <FieldLabel>City</FieldLabel>
                  <Input
                    value={issuerCity}
                    onChange={(e) => setIssuerCity(e.target.value)}
                    placeholder="City"
                  />
                </Field>
                <Field>
                  <FieldLabel>State</FieldLabel>
                  <Input
                    value={issuerState}
                    onChange={(e) => setIssuerState(e.target.value.toUpperCase().slice(0, 2))}
                    placeholder="CA"
                    maxLength={2}
                  />
                </Field>
                <Field>
                  <FieldLabel>ZIP</FieldLabel>
                  <Input
                    value={issuerZip}
                    onChange={(e) => setIssuerZip(e.target.value)}
                    placeholder="12345"
                    maxLength={10}
                  />
                </Field>
              </div>
              {/* Account/Control Number - show based on form type */}
              <div className="grid gap-4 sm:grid-cols-2">
                {formType === 'W-2' && (
                  <Field>
                    <FieldLabel>Control Number (Box d)</FieldLabel>
                    <Input
                      value={controlNumber}
                      onChange={(e) => setControlNumber(e.target.value)}
                      placeholder="Optional control number"
                    />
                  </Field>
                )}
                {formType !== 'W-2' && (
                  <Field>
                    <FieldLabel>Account Number</FieldLabel>
                    <Input
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Payer's account number"
                    />
                  </Field>
                )}
              </div>
            </div>

            {/* Form-Specific Fields */}
            <IncomeFormFields
              formType={formType}
              boxes={boxes}
              onChange={setBoxes}
            />

            {/* Notes */}
            <Field>
              <FieldLabel>Notes</FieldLabel>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
                rows={2}
              />
            </Field>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
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
                : 'Add Form'}
          </Button>
        </DialogFooter>
      </DialogContent>

      <SmartPasteDialog
        open={smartPasteOpen}
        onOpenChange={setSmartPasteOpen}
        formType={formType as IncomeFormType}
        onApply={handleSmartPasteApply}
      />
    </Dialog>
  );
}
