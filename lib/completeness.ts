import {
  type IncomeFormType,
  FORM_BOX_DEFINITIONS,
} from '@/lib/constants';

export type CompletenessResult = {
  percentage: number;
  missingRequired: string[];
  status: 'complete' | 'needs-review' | 'minimal';
};

export function computeCompleteness(
  formType: IncomeFormType,
  boxes: Record<string, number | string | boolean>,
  issuerName: string
): CompletenessResult {
  const definitions = FORM_BOX_DEFINITIONS[formType] ?? [];
  const requiredDefs = definitions.filter((d) => d.required);
  const allDefs = definitions;

  const missingRequired: string[] = [];

  if (!issuerName) {
    missingRequired.push('Payer/Employer name');
  }

  for (const def of requiredDefs) {
    const val = boxes[def.key];
    // For money fields, 0 is a valid value (e.g., $0 withholding)
    if (def.type === 'money') {
      if (val === undefined || val === '') {
        missingRequired.push(def.label);
      }
    } else if (val === undefined || val === '' || val === 0) {
      missingRequired.push(def.label);
    }
  }

  const filledCount = allDefs.filter((d) => {
    const val = boxes[d.key];
    // For checkbox fields, any boolean value (true or false) counts as filled
    if (d.type === 'checkbox') {
      return typeof val === 'boolean';
    }
    // For money fields, 0 is a valid filled value
    if (d.type === 'money') {
      return val !== undefined && val !== '';
    }
    return val !== undefined && val !== '' && val !== 0;
  }).length;

  const totalFields = allDefs.length + 1; // +1 for issuer name
  const filledTotal = filledCount + (issuerName ? 1 : 0);
  const percentage = totalFields > 0 ? Math.round((filledTotal / totalFields) * 100) : 0;

  let status: CompletenessResult['status'];
  if (missingRequired.length === 0) {
    status = 'complete';
  } else if (totalFields > 0 && filledTotal / totalFields >= 0.2) {
    status = 'needs-review';
  } else {
    status = 'minimal';
  }

  return { percentage, missingRequired, status };
}
