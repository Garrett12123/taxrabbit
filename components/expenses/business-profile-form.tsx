'use client';

import { useCallback, useState, useTransition } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EinInput } from '@/components/ui/ein-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Field, FieldLabel, FieldError, FieldMessage } from '@/components/ui/field';
import { AddressFields } from '@/components/forms/common/address-fields';
import { saveBusinessProfileAction } from '@/app/(modules)/llc/actions';
import type { BusinessProfileDecrypted } from '@/server/db/dal/business-profiles';

const ENTITY_TYPES = [
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
  { value: 'single_member_llc', label: 'Single-Member LLC' },
  { value: 'multi_member_llc', label: 'Multi-Member LLC' },
  { value: 'partnership', label: 'Partnership' },
  { value: 's_corporation', label: 'S Corporation' },
  { value: 'c_corporation', label: 'C Corporation' },
];

const ACCOUNTING_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'accrual', label: 'Accrual' },
  { value: 'hybrid', label: 'Hybrid' },
];

type BusinessProfileFormProps = {
  year: number;
  profile?: BusinessProfileDecrypted | null;
};

type FieldErrors = {
  businessName?: string;
  ein?: string;
};

export function BusinessProfileForm({
  year,
  profile,
}: BusinessProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saved, setSaved] = useState(false);

  const [businessName, setBusinessName] = useState(
    profile?.payload.businessName ?? ''
  );
  const [ein, setEin] = useState(profile?.payload.ein?.replace(/\D/g, '') ?? '');
  const [address, setAddress] = useState(profile?.payload.address ?? '');
  const [address2, setAddress2] = useState(profile?.payload.address2 ?? '');
  const [city, setCity] = useState(profile?.payload.city ?? '');
  const [addrState, setAddrState] = useState(profile?.payload.state ?? '');
  const [zip, setZip] = useState(profile?.payload.zip ?? '');
  const [stateOfFormation, setStateOfFormation] = useState(
    profile?.payload.stateOfFormation ?? ''
  );
  const [entityType, setEntityType] = useState(
    profile?.payload.entityType ?? ''
  );
  const [accountingMethod, setAccountingMethod] = useState(
    profile?.payload.accountingMethod ?? ''
  );
  const [startDate, setStartDate] = useState(
    profile?.payload.startDate ?? ''
  );
  const [notes, setNotes] = useState(profile?.payload.notes ?? '');

  const validateFields = useCallback((): boolean => {
    const errors: FieldErrors = {};
    
    if (!businessName.trim()) {
      errors.businessName = 'Business name is required';
    }
    if (ein && ein.length !== 9) {
      errors.ein = 'EIN must be 9 digits';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [businessName, ein]);

  const handleSave = useCallback(() => {
    setError(null);
    setSaved(false);
    
    if (!validateFields()) {
      return;
    }

    startTransition(async () => {
      // Format EIN with dash for storage
      const formattedEin = ein 
        ? `${ein.slice(0, 2)}-${ein.slice(2)}`
        : undefined;

      const data = {
        year,
        businessName: businessName.trim(),
        ein: formattedEin,
        address: address.trim() || undefined,
        address2: address2.trim() || undefined,
        city: city.trim() || undefined,
        state: addrState.trim().toUpperCase() || undefined,
        zip: zip.trim() || undefined,
        stateOfFormation: stateOfFormation.trim() || undefined,
        entityType: entityType || undefined,
        accountingMethod: accountingMethod || undefined,
        startDate: startDate || undefined,
        notes: notes.trim() || undefined,
      };

      const result = await saveBusinessProfileAction(data);

      if (result?.error) {
        setError(result.error);
        return;
      }

      setSaved(true);
    });
  }, [
    year,
    businessName,
    ein,
    address,
    address2,
    city,
    addrState,
    zip,
    stateOfFormation,
    entityType,
    accountingMethod,
    startDate,
    notes,
    validateFields,
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Profile</CardTitle>
        <CardDescription>
          Enter your business details for the {year} tax year.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={!!fieldErrors.businessName}>
            <FieldLabel>Business Name *</FieldLabel>
            <Input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Your business name"
              aria-invalid={!!fieldErrors.businessName}
            />
            {fieldErrors.businessName && <FieldError>{fieldErrors.businessName}</FieldError>}
          </Field>
          <Field error={!!fieldErrors.ein}>
            <FieldLabel>EIN</FieldLabel>
            <EinInput
              value={ein}
              onChange={setEin}
              aria-invalid={!!fieldErrors.ein}
            />
            {fieldErrors.ein && <FieldError>{fieldErrors.ein}</FieldError>}
          </Field>
        </div>

        <AddressFields
          address={address}
          address2={address2}
          city={city}
          state={addrState}
          zip={zip}
          onChange={(field, value) => {
            switch (field) {
              case 'address': setAddress(value); break;
              case 'address2': setAddress2(value); break;
              case 'city': setCity(value); break;
              case 'state': setAddrState(value); break;
              case 'zip': setZip(value); break;
            }
          }}
          addressLabel="Business Address"
          addressPlaceholder="Business address"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>State of Formation</FieldLabel>
            <Input
              value={stateOfFormation}
              onChange={(e) => setStateOfFormation(e.target.value)}
              placeholder="e.g., Delaware"
            />
          </Field>
          <Field>
            <FieldLabel>Entity Type</FieldLabel>
            <Select value={entityType} onValueChange={setEntityType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Accounting Method</FieldLabel>
            <Select value={accountingMethod} onValueChange={setAccountingMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNTING_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Start Date</FieldLabel>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
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
        {saved && (
          <FieldMessage variant="success">Profile saved successfully.</FieldMessage>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? 'Saving...' : profile ? 'Update Profile' : 'Save Profile'}
        </Button>
      </CardFooter>
    </Card>
  );
}
