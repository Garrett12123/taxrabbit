'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { Field, FieldLabel } from '@/components/ui/field';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/forms/common/money-input';
import { W2_BOX12_CODES } from '@/lib/constants';

type W2FormProps = {
  boxes: Record<string, number | string | boolean>;
  onChange: (boxes: Record<string, number | string | boolean>) => void;
};

export function W2Form({ boxes, onChange }: W2FormProps) {
  const [additionalOpen, setAdditionalOpen] = useState(false);
  const [box12Open, setBox12Open] = useState(false);
  const [box14Open, setBox14Open] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);

  const updateBox = (key: string, value: number | string | boolean) => {
    onChange({ ...boxes, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Federal Section */}
      <div>
        <h4 className="mb-3 text-sm font-medium">Federal</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Box 1 - Wages, tips, other comp *</FieldLabel>
            <MoneyInput
              value={(boxes.box1 as number) ?? 0}
              onChange={(v) => updateBox('box1', v)}
            />
          </Field>
          <Field>
            <FieldLabel>Box 2 - Federal tax withheld *</FieldLabel>
            <MoneyInput
              value={(boxes.box2 as number) ?? 0}
              onChange={(v) => updateBox('box2', v)}
            />
          </Field>
          <Field>
            <FieldLabel>Box 3 - Social security wages</FieldLabel>
            <MoneyInput
              value={(boxes.box3 as number) ?? 0}
              onChange={(v) => updateBox('box3', v)}
            />
          </Field>
          <Field>
            <FieldLabel>Box 4 - Social security tax withheld</FieldLabel>
            <MoneyInput
              value={(boxes.box4 as number) ?? 0}
              onChange={(v) => updateBox('box4', v)}
            />
          </Field>
          <Field>
            <FieldLabel>Box 5 - Medicare wages and tips</FieldLabel>
            <MoneyInput
              value={(boxes.box5 as number) ?? 0}
              onChange={(v) => updateBox('box5', v)}
            />
          </Field>
          <Field>
            <FieldLabel>Box 6 - Medicare tax withheld</FieldLabel>
            <MoneyInput
              value={(boxes.box6 as number) ?? 0}
              onChange={(v) => updateBox('box6', v)}
            />
          </Field>
        </div>
      </div>

      {/* Box 13 Checkboxes */}
      <div>
        <h4 className="mb-3 text-sm font-medium">Box 13</h4>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={!!boxes.box13_statutory}
              onCheckedChange={(checked) => updateBox('box13_statutory', !!checked)}
            />
            Statutory employee
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={!!boxes.box13_retirement}
              onCheckedChange={(checked) => updateBox('box13_retirement', !!checked)}
            />
            Retirement plan
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={!!boxes.box13_sick_pay}
              onCheckedChange={(checked) => updateBox('box13_sick_pay', !!checked)}
            />
            Third-party sick pay
          </label>
        </div>
      </div>

      {/* Additional Wage Fields - Collapsible */}
      <Collapsible open={additionalOpen} onOpenChange={setAdditionalOpen}>
        <CollapsibleTrigger className="flex w-full items-center gap-2 text-sm font-medium">
          <ChevronDown
            className={`size-4 transition-transform ${additionalOpen ? 'rotate-0' : '-rotate-90'}`}
          />
          Tips & Benefits (Boxes 7, 8, 10, 11)
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Box 7 - Social security tips</FieldLabel>
              <MoneyInput
                value={(boxes.box7 as number) ?? 0}
                onChange={(v) => updateBox('box7', v)}
              />
            </Field>
            <Field>
              <FieldLabel>Box 8 - Allocated tips</FieldLabel>
              <MoneyInput
                value={(boxes.box8 as number) ?? 0}
                onChange={(v) => updateBox('box8', v)}
              />
            </Field>
            <Field>
              <FieldLabel>Box 10 - Dependent care benefits</FieldLabel>
              <MoneyInput
                value={(boxes.box10 as number) ?? 0}
                onChange={(v) => updateBox('box10', v)}
              />
            </Field>
            <Field>
              <FieldLabel>Box 11 - Nonqualified plans</FieldLabel>
              <MoneyInput
                value={(boxes.box11 as number) ?? 0}
                onChange={(v) => updateBox('box11', v)}
              />
            </Field>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Box 12 - Collapsible */}
      <Collapsible open={box12Open} onOpenChange={setBox12Open}>
        <CollapsibleTrigger className="flex w-full items-center gap-2 text-sm font-medium">
          <ChevronDown
            className={`size-4 transition-transform ${box12Open ? 'rotate-0' : '-rotate-90'}`}
          />
          Box 12 - Codes
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-3 space-y-3">
            {(['a', 'b', 'c', 'd'] as const).map((letter) => (
              <div key={letter} className="grid gap-2 sm:grid-cols-2">
                <Field>
                  <FieldLabel>12{letter} - Code</FieldLabel>
                  <Select
                    value={(boxes[`box12${letter}_code`] as string) ?? ''}
                    onValueChange={(v) => updateBox(`box12${letter}_code`, v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select code" />
                    </SelectTrigger>
                    <SelectContent>
                      {W2_BOX12_CODES.map((item) => (
                        <SelectItem key={item.code} value={item.code}>
                          {item.code} - {item.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>12{letter} - Amount</FieldLabel>
                  <MoneyInput
                    value={(boxes[`box12${letter}_amount`] as number) ?? 0}
                    onChange={(v) => updateBox(`box12${letter}_amount`, v)}
                  />
                </Field>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Box 14 - Collapsible */}
      <Collapsible open={box14Open} onOpenChange={setBox14Open}>
        <CollapsibleTrigger className="flex w-full items-center gap-2 text-sm font-medium">
          <ChevronDown
            className={`size-4 transition-transform ${box14Open ? 'rotate-0' : '-rotate-90'}`}
          />
          Box 14 - Other
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Field>
              <FieldLabel>Description</FieldLabel>
              <Input
                value={(boxes.box14_desc as string) ?? ''}
                onChange={(e) => updateBox('box14_desc', e.target.value)}
                placeholder="e.g., Union dues"
              />
            </Field>
            <Field>
              <FieldLabel>Amount</FieldLabel>
              <MoneyInput
                value={(boxes.box14_amount as number) ?? 0}
                onChange={(v) => updateBox('box14_amount', v)}
              />
            </Field>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* State/Local - Collapsible */}
      <Collapsible open={stateOpen} onOpenChange={setStateOpen}>
        <CollapsibleTrigger className="flex w-full items-center gap-2 text-sm font-medium">
          <ChevronDown
            className={`size-4 transition-transform ${stateOpen ? 'rotate-0' : '-rotate-90'}`}
          />
          State / Local
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-3 space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <Field>
                <FieldLabel>Box 15 - State</FieldLabel>
                <Input
                  value={(boxes.box15_state as string) ?? ''}
                  onChange={(e) =>
                    updateBox('box15_state', e.target.value.toUpperCase().slice(0, 2))
                  }
                  placeholder="e.g., CA"
                  maxLength={2}
                />
              </Field>
              <Field>
                <FieldLabel>Box 15 - Employer state ID</FieldLabel>
                <Input
                  value={(boxes.box15_ein as string) ?? ''}
                  onChange={(e) => updateBox('box15_ein', e.target.value)}
                  placeholder="State ID number"
                />
              </Field>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Field>
                <FieldLabel>Box 16 - State wages</FieldLabel>
                <MoneyInput
                  value={(boxes.box16 as number) ?? 0}
                  onChange={(v) => updateBox('box16', v)}
                />
              </Field>
              <Field>
                <FieldLabel>Box 17 - State income tax</FieldLabel>
                <MoneyInput
                  value={(boxes.box17 as number) ?? 0}
                  onChange={(v) => updateBox('box17', v)}
                />
              </Field>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Field>
                <FieldLabel>Box 18 - Local wages</FieldLabel>
                <MoneyInput
                  value={(boxes.box18 as number) ?? 0}
                  onChange={(v) => updateBox('box18', v)}
                />
              </Field>
              <Field>
                <FieldLabel>Box 19 - Local income tax</FieldLabel>
                <MoneyInput
                  value={(boxes.box19 as number) ?? 0}
                  onChange={(v) => updateBox('box19', v)}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel>Box 20 - Locality name</FieldLabel>
              <Input
                value={(boxes.box20 as string) ?? ''}
                onChange={(e) => updateBox('box20', e.target.value)}
                placeholder="Locality name"
              />
            </Field>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
