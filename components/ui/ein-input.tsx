'use client';

import { useCallback } from 'react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { cn } from '@/lib/utils';
import { Building2 } from 'lucide-react';

type EinInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  'aria-invalid'?: boolean;
  className?: string;
};

/**
 * Format raw digits into EIN format: XX-XXXXXXX
 */
function formatEin(digits: string): string {
  const cleaned = digits.replace(/\D/g, '').slice(0, 9);
  if (cleaned.length <= 2) return cleaned;
  return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
}

/**
 * Extract raw digits from formatted EIN
 */
function extractDigits(formatted: string): string {
  return formatted.replace(/\D/g, '').slice(0, 9);
}

export function EinInput({
  value,
  onChange,
  placeholder = '00-0000000',
  id,
  disabled,
  'aria-invalid': ariaInvalid,
  className,
}: EinInputProps) {
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
        <Building2 className="size-3.5 text-muted-foreground/70" />
      </InputGroupAddon>
      <InputGroupInput
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={formatEin(value)}
        onChange={handleChange}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        maxLength={10} // XX-XXXXXXX
      />
    </InputGroup>
  );
}
