'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

type TextareaWithCountProps = React.ComponentProps<'textarea'> & {
  maxLength?: number;
  showCount?: boolean;
};

/**
 * Textarea with character count indicator.
 * Automatically shows remaining characters when approaching limit.
 */
function TextareaWithCount({
  className,
  maxLength,
  showCount = true,
  value,
  defaultValue,
  onChange,
  ...props
}: TextareaWithCountProps) {
  const [internalValue, setInternalValue] = React.useState(
    (defaultValue as string) ?? ''
  );
  
  const currentValue = value !== undefined ? String(value) : internalValue;
  const charCount = currentValue.length;
  const isNearLimit = maxLength ? charCount >= maxLength * 0.8 : false;
  const isAtLimit = maxLength ? charCount >= maxLength : false;

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (value === undefined) {
        setInternalValue(e.target.value);
      }
      onChange?.(e);
    },
    [onChange, value]
  );

  return (
    <div className="relative">
      <Textarea
        className={cn(
          showCount && maxLength && 'pb-6',
          className
        )}
        value={currentValue}
        onChange={handleChange}
        maxLength={maxLength}
        {...props}
      />
      {showCount && maxLength && (
        <div
          className={cn(
            'absolute bottom-2 right-2.5 text-xs tabular-nums transition-colors duration-150',
            isAtLimit && 'text-destructive font-medium',
            isNearLimit && !isAtLimit && 'text-warning-foreground',
            !isNearLimit && 'text-muted-foreground'
          )}
        >
          {charCount}/{maxLength}
        </div>
      )}
    </div>
  );
}

export { TextareaWithCount };
