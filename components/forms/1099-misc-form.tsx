'use client';

import { Field, FieldLabel } from '@/components/ui/field';
import { MoneyInput } from '@/components/forms/common/money-input';

type MiscFormProps = {
  boxes: Record<string, number | string | boolean>;
  onChange: (boxes: Record<string, number | string | boolean>) => void;
};

export function MiscForm({ boxes, onChange }: MiscFormProps) {
  const updateBox = (key: string, value: number) => {
    onChange({ ...boxes, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="mb-3 text-sm font-medium">Federal</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Box 1 - Rents</FieldLabel>
            <MoneyInput
              value={(boxes.box1 as number) ?? 0}
              onChange={(v) => updateBox('box1', v)}
            />
          </Field>
          <Field>
            <FieldLabel>Box 2 - Royalties</FieldLabel>
            <MoneyInput
              value={(boxes.box2 as number) ?? 0}
              onChange={(v) => updateBox('box2', v)}
            />
          </Field>
          <Field>
            <FieldLabel>Box 3 - Other income</FieldLabel>
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
          <Field>
            <FieldLabel>Box 6 - Medical and health care payments</FieldLabel>
            <MoneyInput
              value={(boxes.box6 as number) ?? 0}
              onChange={(v) => updateBox('box6', v)}
            />
          </Field>
          <Field>
            <FieldLabel>Box 10 - Gross proceeds to attorney</FieldLabel>
            <MoneyInput
              value={(boxes.box10 as number) ?? 0}
              onChange={(v) => updateBox('box10', v)}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}
