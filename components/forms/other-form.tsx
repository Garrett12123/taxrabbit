'use client';

import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/forms/common/money-input';

type OtherFormProps = {
  boxes: Record<string, number | string | boolean>;
  onChange: (boxes: Record<string, number | string | boolean>) => void;
};

export function OtherForm({ boxes, onChange }: OtherFormProps) {
  const updateBox = (key: string, value: number | string) => {
    onChange({ ...boxes, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="mb-3 text-sm font-medium">Income Details</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Gross Income *</FieldLabel>
            <MoneyInput
              value={(boxes.box1 as number) ?? 0}
              onChange={(v) => updateBox('box1', v)}
            />
          </Field>
          <Field>
            <FieldLabel>Federal tax withheld</FieldLabel>
            <MoneyInput
              value={(boxes.box4 as number) ?? 0}
              onChange={(v) => updateBox('box4', v)}
            />
          </Field>
        </div>
        <div className="mt-4">
          <Field>
            <FieldLabel>Description / Source</FieldLabel>
            <Input
              value={(boxes.description as string) ?? ''}
              onChange={(e) => updateBox('description', e.target.value)}
              placeholder="e.g., freelance web development, consulting"
            />
          </Field>
        </div>
      </div>
    </div>
  );
}
