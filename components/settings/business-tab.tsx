'use client';

import { useEffect, useState } from 'react';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
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
import { BusinessProfileForm } from '@/components/expenses/business-profile-form';
import { getBusinessProfileForYearAction } from '@/app/(modules)/settings/actions';
import { TAX_YEARS } from '@/lib/constants';
import type { BusinessProfileDecrypted } from '@/server/db/dal/business-profiles';

type BusinessTabProps = {
  defaultTaxYear: number;
  initialProfile?: BusinessProfileDecrypted | null;
};

export function BusinessTab({ defaultTaxYear, initialProfile }: BusinessTabProps) {
  const [year, setYear] = useState(defaultTaxYear);
  const [profile, setProfile] = useState<BusinessProfileDecrypted | null>(
    initialProfile ?? null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (year === defaultTaxYear && initialProfile !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfile(initialProfile ?? null);
      return;
    }

    setLoading(true);
    getBusinessProfileForYearAction(year)
      .then((p) => {
        setProfile(p);
        setLoading(false);
      })
      .catch(() => {
        setProfile(null);
        setLoading(false);
      });
  }, [year, defaultTaxYear, initialProfile]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
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

      {profile ? (
        <BusinessProfileForm year={year} profile={profile} />
      ) : (
        <Card>
          <CardContent className="py-8">
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No business profile for {year}</EmptyTitle>
                <EmptyDescription>
                  Create a business profile for this tax year below.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
          <CardContent>
            <BusinessProfileForm year={year} profile={null} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
