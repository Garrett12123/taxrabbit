'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { INCOME_FORM_TYPES, type IncomeFormType } from '@/lib/constants';

const FORM_TYPE_LABELS: Partial<Record<IncomeFormType, string>> = {
  'Other': 'Other / No 1099',
};

type FormTypeSelectProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function FormTypeSelect({
  value,
  onChange,
  disabled,
}: FormTypeSelectProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Select form type" />
      </SelectTrigger>
      <SelectContent>
        {INCOME_FORM_TYPES.map((type) => (
          <SelectItem key={type} value={type}>
            {FORM_TYPE_LABELS[type] ?? type}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
