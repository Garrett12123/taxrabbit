'use client';

import { Field, FieldLabel } from '@/components/ui/field';
import { MoneyInput } from '@/components/forms/common/money-input';

type DivFormProps = {
  boxes: Record<string, number | string | boolean>;
  onChange: (boxes: Record<string, number | string | boolean>) => void;
};

export function DivForm({ boxes, onChange }: DivFormProps) {
  const updateBox = (key: string, value: number) => {
    onChange({ ...boxes, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="mb-3 text-sm font-medium">Federal</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Box 1a - Total ordinary dividends *</FieldLabel>
            <MoneyInput
              value={(boxes.box1a as number) ?? 0}
              onChange={(v) => updateBox('box1a', v)}
            />
          </Field>
          <Field>
            <FieldLabel>Box 1b - Qualified dividends</FieldLabel>
            <MoneyInput
              value={(boxes.box1b as number) ?? 0}
              onChange={(v) => updateBox('box1b', v)}
            />
          </Field>
          <Field>
            <FieldLabel>Box 2a - Total capital gain distr.</FieldLabel>
            <MoneyInput
              value={(boxes.box2a as number) ?? 0}
              onChange={(v) => updateBox('box2a', v)}
            />
          </Field>
          <Field>
            <FieldLabel>Box 4 - Federal tax withheld</FieldLabel>
            <MoneyInput
              value={(boxes.box4 as number) ?? 0}
              onChange={(v) => updateBox('box4', v)}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}
