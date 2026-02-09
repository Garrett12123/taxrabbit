'use client';

import { useCallback, useState } from 'react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { cn, parseDollarsToCents } from '@/lib/utils';

type MoneyInputProps = {
  value: number;
  onChange: (cents: number) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  'aria-invalid'?: boolean;
  className?: string;
};

/**
 * Format cents to display with thousands separator: 1234.56 -> "1,234.56"
 */
function formatWithCommas(cents: number): string {
  if (cents === 0) return '';
  const dollars = cents / 100;
  return dollars.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format raw input (strip commas for editing)
 */
function centsToDollarsRaw(cents: number): string {
  if (cents === 0) return '';
  return (cents / 100).toFixed(2);
}

export function MoneyInput({
  value,
  onChange,
  placeholder = '0.00',
  id,
  disabled,
  'aria-invalid': ariaInvalid,
  className,
}: MoneyInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState(
    value ? centsToDollarsRaw(value) : ''
  );

  // Show formatted with commas when blurred, raw when focused
  const shownValue = isFocused ? displayValue : (value ? formatWithCommas(value) : '');

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // Allow digits, one decimal point, commas (stripped), and empty
      const cleaned = raw.replace(/,/g, '');
      if (cleaned !== '' && !/^\d*\.?\d{0,2}$/.test(cleaned)) return;
      setDisplayValue(cleaned);
      onChange(parseDollarsToCents(cleaned) ?? 0);
    },
    [onChange]
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    // Show raw value when focused for easy editing
    setDisplayValue(value ? centsToDollarsRaw(value) : '');
  }, [value]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    if (displayValue) {
      const cents = parseDollarsToCents(displayValue) ?? 0;
      setDisplayValue(centsToDollarsRaw(cents));
    }
  }, [displayValue]);

  return (
    <InputGroup
      data-disabled={disabled || undefined}
      className={cn('transition-all duration-150', className)}
    >
      <InputGroupAddon align="inline-start">$</InputGroupAddon>
      <InputGroupInput
        id={id}
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        value={shownValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        className="tabular-nums"
      />
    </InputGroup>
  );
}
