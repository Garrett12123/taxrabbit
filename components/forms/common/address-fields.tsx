'use client';

import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

type AddressFieldsProps = {
  address: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  onChange: (field: 'address' | 'address2' | 'city' | 'state' | 'zip', value: string) => void;
  addressLabel?: string;
  addressPlaceholder?: string;
};

export function AddressFields({
  address,
  address2,
  city,
  state,
  zip,
  onChange,
  addressLabel = 'Street Address',
  addressPlaceholder = '123 Main St',
}: AddressFieldsProps) {
  return (
    <>
      <Field>
        <FieldLabel>{addressLabel}</FieldLabel>
        <Input
          value={address}
          onChange={(e) => onChange('address', e.target.value)}
          placeholder={addressPlaceholder}
        />
      </Field>
      <Field>
        <FieldLabel>Address Line 2</FieldLabel>
        <Input
          value={address2}
          onChange={(e) => onChange('address2', e.target.value)}
          placeholder="Suite, unit, apt, etc."
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-4">
        <Field className="sm:col-span-2">
          <FieldLabel>City</FieldLabel>
          <Input
            value={city}
            onChange={(e) => onChange('city', e.target.value)}
            placeholder="City"
          />
        </Field>
        <Field>
          <FieldLabel>State</FieldLabel>
          <Input
            value={state}
            onChange={(e) => onChange('state', e.target.value.toUpperCase().slice(0, 2))}
            placeholder="CA"
            maxLength={2}
          />
        </Field>
        <Field>
          <FieldLabel>ZIP</FieldLabel>
          <Input
            value={zip}
            onChange={(e) => onChange('zip', e.target.value)}
            placeholder="12345"
            maxLength={10}
          />
        </Field>
      </div>
    </>
  );
}
