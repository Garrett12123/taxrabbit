'use client';

import { Field, FieldLabel } from '@/components/ui/field';
import { MoneyInput } from '@/components/forms/common/money-input';

type IntFormProps = {
  boxes: Record<string, number | string | boolean>;
  onChange: (boxes: Record<string, number | string | boolean>) => void;
};

export function IntForm({ boxes, onChange }: IntFormProps) {
  const updateBox = (key: string, value: number) => {
    onChange({ ...boxes, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="mb-3 text-sm font-medium">Federal</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Box 1 - Interest income *</FieldLabel>
            <MoneyInput
              value={(boxes.box1 as number) ?? 0}
              onChange={(v) => updateBox('box1', v)}
            />
          </Field>
          <Field>
            <FieldLabel>Box 2 - Early withdrawal penalty</FieldLabel>
            <MoneyInput
              value={(boxes.box2 as number) ?? 0}
              onChange={(v) => updateBox('box2', v)}
            />
          </Field>
          <Field>
            <FieldLabel>Box 3 - Interest on U.S. savings bonds</FieldLabel>
            <MoneyInput
              value={(boxes.box3 as number) ?? 0}
              onChange={(v) => updateBox('box3', v)}
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
