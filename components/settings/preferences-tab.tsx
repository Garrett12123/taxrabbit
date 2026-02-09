'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { updateDefaultYearAction } from '@/app/(modules)/settings/actions';
import { TAX_YEARS } from '@/lib/constants';

type PreferencesTabProps = {
  defaultTaxYear: number;
};

export function PreferencesTab({ defaultTaxYear }: PreferencesTabProps) {
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    startTransition(async () => {
      const result = await updateDefaultYearAction({
        defaultTaxYear: Number(e.target.value),
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Default tax year updated.');
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Default Tax Year</CardTitle>
        <CardDescription>
          Choose which tax year to display by default across the application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Field>
          <FieldLabel>Tax Year</FieldLabel>
          <NativeSelect
            defaultValue={defaultTaxYear}
            onChange={handleChange}
            disabled={isPending}
          >
            {TAX_YEARS.map((year) => (
              <NativeSelectOption key={year} value={year}>
                {year}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      </CardContent>
    </Card>
  );
}
