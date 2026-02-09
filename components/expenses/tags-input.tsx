'use client';

import { useState, useCallback } from 'react';
import { X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

type TagsInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  disabled?: boolean;
};

export function TagsInput({
  value,
  onChange,
  maxTags = 10,
  disabled,
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim();
      if (!trimmed) return;
      if (value.length >= maxTags) return;
      if (value.includes(trimmed)) return;
      onChange([...value, trimmed]);
      setInputValue('');
    },
    [value, onChange, maxTags]
  );

  const removeTag = useCallback(
    (tag: string) => {
      onChange(value.filter((t) => t !== tag));
    },
    [value, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    }
    if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-0.5 rounded-sm hover:bg-muted"
                >
                  <X className="size-3" />
                  <span className="sr-only">Remove {tag}</span>
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          value.length >= maxTags
            ? `Max ${maxTags} tags`
            : 'Add tag, press Enter...'
        }
        disabled={disabled || value.length >= maxTags}
      />
    </div>
  );
}
