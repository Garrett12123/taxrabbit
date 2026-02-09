'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type EntityTypeSelectProps = {
  value: 'personal' | 'business';
  onChange: (value: 'personal' | 'business') => void;
  disabled?: boolean;
};

export function EntityTypeSelect({
  value,
  onChange,
  disabled,
}: EntityTypeSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as 'personal' | 'business')}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="personal">Personal</SelectItem>
        <SelectItem value="business">Business / LLC</SelectItem>
      </SelectContent>
    </Select>
  );
}
