'use client';

import { useCallback, useState, useRef } from 'react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';

type SsnInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  'aria-invalid'?: boolean;
  className?: string;
  /** Mask middle digits when not focused (show •••-••-1234) */
  maskOnBlur?: boolean;
};

/**
 * Format raw digits into SSN format: XXX-XX-XXXX
 */
function formatSsn(digits: string): string {
  const cleaned = digits.replace(/\D/g, '').slice(0, 9);
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 5) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
}

/**
 * Create masked display: •••-••-1234
 */
function maskSsn(digits: string): string {
  const cleaned = digits.replace(/\D/g, '');
  if (cleaned.length < 5) return formatSsn(cleaned);
  const lastFour = cleaned.slice(-4);
  return `•••-••-${lastFour}`;
}

/**
 * Extract raw digits from formatted SSN
 */
function extractDigits(formatted: string): string {
  return formatted.replace(/\D/g, '').slice(0, 9);
}

export function SsnInput({
  value,
  onChange,
  placeholder = '000-00-0000',
  id,
  disabled,
  'aria-invalid': ariaInvalid,
  className,
  maskOnBlur = true,
}: SsnInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Display value: show formatted when focused, masked when blurred
  const displayValue = isFocused
    ? formatSsn(value)
    : maskOnBlur && value.length >= 5
      ? maskSsn(value)
      : formatSsn(value);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawDigits = extractDigits(e.target.value);
      onChange(rawDigits);
    },
    [onChange]
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  return (
    <InputGroup
      data-disabled={disabled || undefined}
      className={cn('transition-all duration-150', className)}
    >
      <InputGroupAddon align="inline-start">
        <Lock className="size-3.5 text-muted-foreground/70" />
      </InputGroupAddon>
      <InputGroupInput
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        maxLength={11} // XXX-XX-XXXX
      />
    </InputGroup>
  );
}
