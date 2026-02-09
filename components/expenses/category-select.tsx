'use client';

import { useMemo } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { EXPENSE_CATEGORIES } from '@/lib/constants';

type CategorySelectProps = {
  value: string;
  onChange: (value: string) => void;
  customCategories?: string[];
  disabled?: boolean;
};

export function CategorySelect({
  value,
  onChange,
  customCategories = [],
  disabled,
}: CategorySelectProps) {
  const uniqueCustom = useMemo(
    () =>
      customCategories.filter(
        (c) => !(EXPENSE_CATEGORIES as readonly string[]).includes(c)
      ),
    [customCategories]
  );

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>IRS Categories</SelectLabel>
          {EXPENSE_CATEGORIES.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectGroup>
        {uniqueCustom.length > 0 && (
          <SelectGroup>
            <SelectLabel>Custom</SelectLabel>
            {uniqueCustom.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}
