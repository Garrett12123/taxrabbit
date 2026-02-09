'use client';

import { W2Form } from '@/components/forms/w2-form';
import { NecForm } from '@/components/forms/1099-nec-form';
import { IntForm } from '@/components/forms/1099-int-form';
import { DivForm } from '@/components/forms/1099-div-form';
import { MiscForm } from '@/components/forms/1099-misc-form';

type IncomeFormFieldsProps = {
  formType: string;
  boxes: Record<string, number | string | boolean>;
  onChange: (boxes: Record<string, number | string | boolean>) => void;
};

export function IncomeFormFields({
  formType,
  boxes,
  onChange,
}: IncomeFormFieldsProps) {
  switch (formType) {
    case 'W-2':
      return <W2Form boxes={boxes} onChange={onChange} />;
    case '1099-NEC':
      return <NecForm boxes={boxes} onChange={onChange} />;
    case '1099-INT':
      return <IntForm boxes={boxes} onChange={onChange} />;
    case '1099-DIV':
      return <DivForm boxes={boxes} onChange={onChange} />;
    case '1099-MISC':
      return <MiscForm boxes={boxes} onChange={onChange} />;
    default:
      return <p className="text-muted-foreground text-sm">Select a form type to see fields.</p>;
  }
}
