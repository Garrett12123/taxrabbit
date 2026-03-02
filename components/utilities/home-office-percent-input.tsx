'use client';

import { useState, useTransition } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { updateHomeOfficePercentAction } from '@/app/(modules)/utilities/actions';

type HomeOfficePercentInputProps = {
  year: number;
  currentPercent: number;
  hasBusinessProfile: boolean;
};

export function HomeOfficePercentInput({
  year,
  currentPercent,
  hasBusinessProfile,
}: HomeOfficePercentInputProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(currentPercent));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!hasBusinessProfile) {
    return (
      <Link href="/llc" className="text-sm text-primary hover:underline">
        Set up LLC profile
      </Link>
    );
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setValue(String(currentPercent));
          setEditing(true);
          setError(null);
        }}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <span className="text-2xl font-bold tabular-nums text-foreground">
          {currentPercent}%
        </span>
        <Pencil className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  }

  const handleSave = () => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0 || num > 100) {
      setError('Enter a value between 0 and 100');
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await updateHomeOfficePercentAction(year, num);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
    });
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-8 w-20 text-sm"
          disabled={isPending}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') setEditing(false);
          }}
          autoFocus
        />
        <span className="text-sm text-muted-foreground">%</span>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={handleSave}
          disabled={isPending}
        >
          {isPending ? <Spinner className="size-3.5" /> : <Check className="size-3.5" />}
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => setEditing(false)}
          disabled={isPending}
        >
          <X className="size-3.5" />
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
