'use client';

import { useCallback } from 'react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { cn } from '@/lib/utils';
import { Phone } from 'lucide-react';

type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  'aria-invalid'?: boolean;
  className?: string;
};

/**
 * Format raw digits into phone format: (XXX) XXX-XXXX
 */
function formatPhone(digits: string): string {
  const cleaned = digits.replace(/\D/g, '').slice(0, 10);
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 3) return `(${cleaned}`;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
}

/**
 * Extract raw digits from formatted phone
 */
function extractDigits(formatted: string): string {
  return formatted.replace(/\D/g, '').slice(0, 10);
}

export function PhoneInput({
  value,
  onChange,
  placeholder = '(555) 555-5555',
  id,
  disabled,
  'aria-invalid': ariaInvalid,
  className,
}: PhoneInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawDigits = extractDigits(e.target.value);
      onChange(rawDigits);
    },
    [onChange]
  );

  return (
    <InputGroup
      data-disabled={disabled || undefined}
      className={cn('transition-all duration-150', className)}
    >
      <InputGroupAddon align="inline-start">
        <Phone className="size-3.5 text-muted-foreground/70" />
      </InputGroupAddon>
      <InputGroupInput
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder={placeholder}
        value={formatPhone(value)}
        onChange={handleChange}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        maxLength={14} // (XXX) XXX-XXXX
      />
    </InputGroup>
  );
}
