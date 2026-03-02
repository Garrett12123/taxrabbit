'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { LoadingButton } from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { SsnInput } from '@/components/ui/ssn-input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Spinner } from '@/components/ui/spinner';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { AddressFields } from '@/components/forms/common/address-fields';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';
import { Button } from '@/components/ui/button';
import {
  savePersonProfileAction,
  getPersonProfilesForYear,
} from '@/app/(modules)/settings/actions';
import { TAX_YEARS } from '@/lib/constants';
import { useFormGuard } from '@/hooks/use-form-guard';
import { useSaveShortcut } from '@/hooks/use-save-shortcut';
import type { PersonProfileDecrypted } from '@/server/db/dal/person-profiles';

type PersonalTabProps = {
  defaultTaxYear: number;
  initialProfile?: PersonProfileDecrypted | null;
};

export function PersonalTab({ defaultTaxYear, initialProfile }: PersonalTabProps) {
  const [year, setYear] = useState(defaultTaxYear);
  const [profile, setProfile] = useState<PersonProfileDecrypted | null>(
    initialProfile ?? null
  );
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(!!initialProfile);

  useEffect(() => {
    if (year === defaultTaxYear && initialProfile !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfile(initialProfile ?? null);
      setShowForm(!!initialProfile);
      return;
    }

    setLoading(true);
    getPersonProfilesForYear(year)
      .then((profiles) => {
        const p = profiles[0] ?? null;
        setProfile(p);
        setShowForm(!!p);
      })
      .catch((err) => {
        console.error('Failed to load personal profile:', err);
        toast.error('Failed to load personal profile.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [year, defaultTaxYear, initialProfile]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center gap-2 text-muted-foreground">
          <Spinner className="size-4" />
          Loading...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Field>
        <FieldLabel>Tax Year</FieldLabel>
        <NativeSelect
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {TAX_YEARS.map((y) => (
            <NativeSelectOption key={y} value={y}>
              {y}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      {showForm ? (
        <PersonProfileForm
          year={year}
          profile={profile}
          onSaved={(p) => setProfile(p)}
        />
      ) : (
        <Card>
          <CardContent className="py-8">
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No personal profile for {year}</EmptyTitle>
                <EmptyDescription>
                  Create a profile to store your personal information for this
                  tax year.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
            <div className="mt-4 flex justify-center">
              <Button onClick={() => setShowForm(true)}>Create Profile</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

type FieldErrors = {
  firstName?: string;
  lastName?: string;
  ssn?: string;
  email?: string;
};

function PersonProfileForm({
  year,
  profile,
  onSaved,
}: {
  year: number;
  profile: PersonProfileDecrypted | null;
  onSaved: (profile: PersonProfileDecrypted) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState(false);

  const [firstName, setFirstName] = useState(profile?.payload.firstName ?? '');
  const [lastName, setLastName] = useState(profile?.payload.lastName ?? '');
  const [ssn, setSsn] = useState(profile?.payload.ssn?.replace(/\D/g, '') ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(
    profile?.payload.dateOfBirth ?? ''
  );
  const [address, setAddress] = useState(profile?.payload.address ?? '');
  const [address2, setAddress2] = useState(profile?.payload.address2 ?? '');
  const [city, setCity] = useState(profile?.payload.city ?? '');
  const [addrState, setAddrState] = useState(profile?.payload.state ?? '');
  const [zip, setZip] = useState(profile?.payload.zip ?? '');
  const [phone, setPhone] = useState(profile?.payload.phone?.replace(/\D/g, '') ?? '');
  const [email, setEmail] = useState(profile?.payload.email ?? '');

  // Form guard for unsaved changes
  const { markDirty, markClean } = useFormGuard();

  // Track dirty state
  const handleFieldChange = useCallback(
    <T,>(setter: React.Dispatch<React.SetStateAction<T>>, value: T) => {
      setter(value);
      markDirty();
    },
    [markDirty]
  );

  // Reset form when profile/year changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFirstName(profile?.payload.firstName ?? '');
    setLastName(profile?.payload.lastName ?? '');
    setSsn(profile?.payload.ssn?.replace(/\D/g, '') ?? '');
    setDateOfBirth(profile?.payload.dateOfBirth ?? '');
    setAddress(profile?.payload.address ?? '');
    setAddress2(profile?.payload.address2 ?? '');
    setCity(profile?.payload.city ?? '');
    setAddrState(profile?.payload.state ?? '');
    setZip(profile?.payload.zip ?? '');
    setPhone(profile?.payload.phone?.replace(/\D/g, '') ?? '');
    setEmail(profile?.payload.email ?? '');
    setError(null);
    setFieldErrors({});
    markClean();
  }, [profile, year, markClean]);

  const validateFields = useCallback((): boolean => {
    const errors: FieldErrors = {};
    
    if (!firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (ssn && ssn.length !== 9) {
      errors.ssn = 'SSN must be 9 digits';
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Invalid email address';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [firstName, lastName, ssn, email]);

  const handleSave = useCallback(() => {
    setError(null);
    
    if (!validateFields()) {
      return;
    }

    startTransition(async () => {
      const label = `${firstName.trim()} ${lastName.trim()}`.trim() || 'Personal';
      
      // Format SSN with dashes for storage
      const formattedSsn = ssn 
        ? `${ssn.slice(0, 3)}-${ssn.slice(3, 5)}-${ssn.slice(5)}`
        : undefined;
      
      // Format phone for storage
      const formattedPhone = phone
        ? `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`
        : undefined;

      const result = await savePersonProfileAction({
        year,
        label,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ssn: formattedSsn,
        dateOfBirth: dateOfBirth || undefined,
        address: address.trim() || undefined,
        address2: address2.trim() || undefined,
        city: city.trim() || undefined,
        state: addrState.trim().toUpperCase() || undefined,
        zip: zip.trim() || undefined,
        phone: formattedPhone,
        email: email.trim() || undefined,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Reload profile data
      const profiles = await getPersonProfilesForYear(year);
      if (profiles[0]) {
        onSaved(profiles[0]);
      }
      markClean();
      setSuccess(true);
      toast.success('Personal profile saved.');
    });
  }, [year, firstName, lastName, ssn, dateOfBirth, address, address2, city, addrState, zip, phone, email, onSaved, validateFields, markClean]);

  // Cmd+S to save
  useSaveShortcut(handleSave, !isPending);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Profile</CardTitle>
        <CardDescription>
          Your personal information for the {year} tax year.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={!!fieldErrors.firstName}>
            <FieldLabel>First Name *</FieldLabel>
            <Input
              value={firstName}
              onChange={(e) => handleFieldChange(setFirstName, e.target.value)}
              onBlur={() => {
                if (!firstName.trim()) {
                  setFieldErrors((prev) => ({ ...prev, firstName: 'First name is required' }));
                } else {
                  setFieldErrors((prev) => { const next = { ...prev }; delete next.firstName; return next; });
                }
              }}
              placeholder="First name"
              aria-invalid={!!fieldErrors.firstName}
            />
            {fieldErrors.firstName && <FieldError>{fieldErrors.firstName}</FieldError>}
          </Field>
          <Field error={!!fieldErrors.lastName}>
            <FieldLabel>Last Name *</FieldLabel>
            <Input
              value={lastName}
              onChange={(e) => handleFieldChange(setLastName, e.target.value)}
              onBlur={() => {
                if (!lastName.trim()) {
                  setFieldErrors((prev) => ({ ...prev, lastName: 'Last name is required' }));
                } else {
                  setFieldErrors((prev) => { const next = { ...prev }; delete next.lastName; return next; });
                }
              }}
              placeholder="Last name"
              aria-invalid={!!fieldErrors.lastName}
            />
            {fieldErrors.lastName && <FieldError>{fieldErrors.lastName}</FieldError>}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={!!fieldErrors.ssn}>
            <FieldLabel>SSN</FieldLabel>
            <SsnInput
              value={ssn}
              onChange={(v) => handleFieldChange(setSsn, v)}
              aria-invalid={!!fieldErrors.ssn}
            />
            {fieldErrors.ssn && <FieldError>{fieldErrors.ssn}</FieldError>}
          </Field>
          <Field>
            <FieldLabel>Date of Birth</FieldLabel>
            <Input
              type="date"
              value={dateOfBirth}
              onChange={(e) => handleFieldChange(setDateOfBirth, e.target.value)}
            />
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
              case 'address': handleFieldChange(setAddress, value); break;
              case 'address2': handleFieldChange(setAddress2, value); break;
              case 'city': handleFieldChange(setCity, value); break;
              case 'state': handleFieldChange(setAddrState, value); break;
              case 'zip': handleFieldChange(setZip, value); break;
            }
          }}
          addressLabel="Address"
          addressPlaceholder="Street address"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Phone</FieldLabel>
            <PhoneInput
              value={phone}
              onChange={(v) => handleFieldChange(setPhone, v)}
            />
          </Field>
          <Field error={!!fieldErrors.email}>
            <FieldLabel>Email</FieldLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => handleFieldChange(setEmail, e.target.value)}
              onBlur={() => {
                if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                  setFieldErrors((prev) => ({ ...prev, email: 'Invalid email address' }));
                } else {
                  setFieldErrors((prev) => { const next = { ...prev }; delete next.email; return next; });
                }
              }}
              placeholder="name@example.com"
              aria-invalid={!!fieldErrors.email}
            />
            {fieldErrors.email && <FieldError>{fieldErrors.email}</FieldError>}
          </Field>
        </div>

        {error && <FieldError>{error}</FieldError>}
      </CardContent>
      <CardFooter>
        <LoadingButton
          onClick={handleSave}
          loading={isPending}
          success={success}
          loadingText="Saving..."
          successText="Saved"
        >
          {profile ? 'Update Profile' : 'Save Profile'}
        </LoadingButton>
      </CardFooter>
    </Card>
  );
}
