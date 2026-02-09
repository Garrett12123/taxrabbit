'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PAYMENT_METHODS } from '@/lib/constants';

type PaymentMethodSelectProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function PaymentMethodSelect({
  value,
  onChange,
  disabled,
}: PaymentMethodSelectProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Select method" />
      </SelectTrigger>
      <SelectContent>
        {PAYMENT_METHODS.map((method) => (
          <SelectItem key={method} value={method}>
            {method}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
