'use client';

import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/forms/common/money-input';

type NecFormProps = {
  boxes: Record<string, number | string | boolean>;
  onChange: (boxes: Record<string, number | string | boolean>) => void;
};

export function NecForm({ boxes, onChange }: NecFormProps) {
  const updateBox = (key: string, value: number | string) => {
    onChange({ ...boxes, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="mb-3 text-sm font-medium">Federal</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Box 1 - Nonemployee compensation *</FieldLabel>
            <MoneyInput
              value={(boxes.box1 as number) ?? 0}
              onChange={(v) => updateBox('box1', v)}
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

      <div>
        <h4 className="mb-3 text-sm font-medium">State</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>State / Payer state no.</FieldLabel>
            <Input
              value={(boxes.state_id as string) ?? ''}
              onChange={(e) => updateBox('state_id', e.target.value)}
              placeholder="State ID"
            />
          </Field>
          <Field>
            <FieldLabel>State income</FieldLabel>
            <MoneyInput
              value={(boxes.state_income as number) ?? 0}
              onChange={(v) => updateBox('state_income', v)}
            />
          </Field>
          <Field>
            <FieldLabel>State tax withheld</FieldLabel>
            <MoneyInput
              value={(boxes.state_tax as number) ?? 0}
              onChange={(v) => updateBox('state_tax', v)}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}
