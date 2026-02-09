'use client';

import { useCallback, useRef } from 'react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { cn } from '@/lib/utils';
import { Calendar } from 'lucide-react';

type DateInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  'aria-invalid'?: boolean;
  className?: string;
};

/**
 * Format raw digits into date format: YYYY-MM-DD
 * Auto-inserts hyphens after positions 4 and 6.
 */
function formatDate(digits: string): string {
  const cleaned = digits.replace(/\D/g, '').slice(0, 8);
  if (cleaned.length <= 4) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6)}`;
}

/**
 * Extract raw digits from formatted date
 */
function extractDigits(formatted: string): string {
  return formatted.replace(/\D/g, '').slice(0, 8);
}

export function DateInput({
  value,
  onChange,
  placeholder = 'YYYY-MM-DD',
  id,
  disabled,
  'aria-invalid': ariaInvalid,
  className,
}: DateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawDigits = extractDigits(e.target.value);
      const formatted = formatDate(rawDigits);
      onChange(formatted);

      // Auto-advance cursor past auto-inserted hyphens
      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (!el) return;
        const pos = el.selectionStart ?? 0;
        // If cursor is right before a hyphen, advance past it
        if (formatted[pos] === '-') {
          el.setSelectionRange(pos + 1, pos + 1);
        }
      });
    },
    [onChange]
  );

  return (
    <InputGroup
      data-disabled={disabled || undefined}
      className={cn('transition-all duration-150', className)}
    >
      <InputGroupAddon align="inline-start">
        <Calendar className="size-3.5 text-muted-foreground/70" />
      </InputGroupAddon>
      <InputGroupInput
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={formatDate(value.replace(/\D/g, ''))}
        onChange={handleChange}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        maxLength={10} // YYYY-MM-DD
        className="tabular-nums"
      />
    </InputGroup>
  );
}
