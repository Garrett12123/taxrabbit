import 'server-only';

import type { IncomeFormType } from '@/lib/constants';
import {
  createIncomeDocument,
  updateIncomeDocument,
  getIncomeDocument,
  listIncomeDocumentsByYear,
  deleteIncomeDocument,
  getIncomeSummaryByType,
  getTotalIncome,
  getTotalWithholding,
  getTotalStateWithholding,
  type IncomePayload,
  type IncomeDocumentDecrypted,
} from '@/server/db/dal/income-documents';
import type { IncomeFormInput } from '@/lib/validation/income-forms';

// Re-export from lib so server pages can import from one place
export { computeCompleteness, type CompletenessResult } from '@/lib/completeness';

export function extractPrimaryAmount(
  formType: IncomeFormType,
  boxes: Record<string, number | string | boolean>
): number {
  switch (formType) {
    case 'W-2':
      return typeof boxes.box1 === 'number' ? boxes.box1 : 0;
    case '1099-NEC':
      return typeof boxes.box1 === 'number' ? boxes.box1 : 0;
    case 'Other':
      return typeof boxes.box1 === 'number' ? boxes.box1 : 0;
    case '1099-INT':
      return typeof boxes.box1 === 'number' ? boxes.box1 : 0;
    case '1099-DIV':
      return typeof boxes.box1a === 'number' ? boxes.box1a : 0;
    case '1099-MISC': {
      const miscKeys = ['box1', 'box2', 'box3', 'box6', 'box10'];
      return miscKeys.reduce((sum, key) => {
        const val = boxes[key];
        return sum + (typeof val === 'number' ? val : 0);
      }, 0);
    }
    case '1099-K':
      // Box 1a is the gross amount of payment card/third-party transactions
      return typeof boxes.box1a === 'number' ? boxes.box1a : 0;
    default:
      return 0;
  }
}

export function extractFedWithholding(
  formType: IncomeFormType,
  boxes: Record<string, number | string | boolean>
): number {
  switch (formType) {
    case 'W-2':
      return typeof boxes.box2 === 'number' ? boxes.box2 : 0;
    case '1099-NEC':
    case '1099-INT':
    case '1099-DIV':
    case '1099-MISC':
    case '1099-K':
    case 'Other':
      return typeof boxes.box4 === 'number' ? boxes.box4 : 0;
    default:
      return 0;
  }
}

function buildIncomePayload(input: IncomeFormInput): {
  amount: number;
  fedWithholding: number;
  stateWithholding: number;
  payload: IncomePayload;
} {
  const amount = extractPrimaryAmount(
    input.formType as IncomeFormType,
    input.boxes
  );
  const fedWithholding = extractFedWithholding(
    input.formType as IncomeFormType,
    input.boxes
  );

  const stateWages = typeof input.boxes.box16 === 'number'
    ? input.boxes.box16
    : typeof input.boxes.state_income === 'number'
      ? input.boxes.state_income
      : undefined;

  const stateWithholding = typeof input.boxes.box17 === 'number'
    ? input.boxes.box17
    : typeof input.boxes.state_tax === 'number'
      ? input.boxes.state_tax
      : undefined;

  const localWages = typeof input.boxes.box18 === 'number' ? input.boxes.box18 : undefined;
  const localWithholding = typeof input.boxes.box19 === 'number' ? input.boxes.box19 : undefined;

  const payload: IncomePayload = {
    issuerName: input.issuerName,
    issuerEin: input.issuerEin,
    issuerAddress: input.issuerAddress,
    issuerAddress2: input.issuerAddress2,
    issuerCity: input.issuerCity,
    issuerState: input.issuerState,
    issuerZip: input.issuerZip,
    accountNumber: input.accountNumber,
    controlNumber: input.controlNumber,
    boxes: input.boxes,
    stateWages,
    stateWithholding,
    localWages,
    localWithholding,
    notes: input.notes,
  };

  return { amount, fedWithholding, stateWithholding: stateWithholding ?? 0, payload };
}

export async function createIncomeForm(input: IncomeFormInput): Promise<string> {
  const { amount, fedWithholding, stateWithholding, payload } = buildIncomePayload(input);

  return createIncomeDocument({
    year: input.year,
    formType: input.formType,
    entityType: input.entityType,
    amount,
    fedWithholding,
    stateWithholding,
    incomeDate: input.incomeDate,
    payload,
  });
}

export async function updateIncomeForm(
  id: string,
  input: IncomeFormInput
): Promise<void> {
  const { amount, fedWithholding, stateWithholding, payload } = buildIncomePayload(input);

  return updateIncomeDocument(id, {
    formType: input.formType,
    entityType: input.entityType,
    amount,
    fedWithholding,
    stateWithholding,
    incomeDate: input.incomeDate ?? null,
    payload,
  });
}

// Re-export DAL query functions
export {
  getIncomeDocument,
  listIncomeDocumentsByYear,
  deleteIncomeDocument,
  getIncomeSummaryByType,
  getTotalIncome,
  getTotalWithholding,
  getTotalStateWithholding,
};
export type { IncomeDocumentDecrypted };
