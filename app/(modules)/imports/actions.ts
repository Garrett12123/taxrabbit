'use server';

import { revalidatePath } from 'next/cache';

import { parseCSV } from '@/lib/csv/parse';
import { formatZodErrors, formatErrorForUser } from '@/lib/errors';
import { 
  previewImport, 
  commitImport,
  previewMileageImport,
  commitMileageImport,
} from '@/server/services/import-service';
import { createIncomeForm } from '@/server/services/income-service';
import { incomeFormInputSchema } from '@/lib/validation/income-forms';
import type { ColumnMapping, MileageColumnMapping } from '@/lib/csv/column-mapping';
import type { 
  CsvRowParsed, 
  ImportDefaults, 
  RowValidationResult,
  MileageRowParsed,
  MileageRowValidationResult,
  MileageImportDefaults,
} from '@/lib/validation/csv-import';
import type { ActionResult } from '@/lib/types';

export async function parseCsvAction(
  csvText: string
): Promise<{
  headers: string[];
  previewRows: string[][];
  totalRows: number;
  error?: string;
}> {
  if (!csvText || typeof csvText !== 'string') {
    return { headers: [], previewRows: [], totalRows: 0, error: 'No CSV data provided.' };
  }

  const result = parseCSV(csvText);

  if (result.headers.length === 0) {
    return { headers: [], previewRows: [], totalRows: 0, error: 'No headers found in CSV.' };
  }

  return {
    headers: result.headers,
    previewRows: result.rows.slice(0, 5),
    totalRows: result.rowCount,
  };
}

export async function validateImportAction(
  csvText: string,
  mappings: ColumnMapping[],
  defaults: ImportDefaults
): Promise<{
  totalRows: number;
  validRows: number;
  errorRows: number;
  validationResults: RowValidationResult[];
  validData: CsvRowParsed[];
  error?: string;
}> {
  if (!csvText || !mappings || !defaults) {
    return {
      totalRows: 0,
      validRows: 0,
      errorRows: 0,
      validationResults: [],
      validData: [],
      error: 'Missing required data.',
    };
  }

  const parsed = parseCSV(csvText);
  const result = previewImport(parsed.rows, mappings, defaults);

  return result;
}

export async function commitImportAction(
  validData: CsvRowParsed[],
  defaults: ImportDefaults
): Promise<{ success: boolean; insertedCount: number; error?: string }> {
  if (!validData || validData.length === 0) {
    return { success: false, insertedCount: 0, error: 'No valid data to import.' };
  }

  const result = await commitImport(validData, defaults);

  if (result.success) {
    revalidatePath('/expenses');
    revalidatePath('/imports');
  }

  return result;
}

export async function quickAddW2Action(
  data: unknown
): Promise<ActionResult & { documentId?: string }> {
  const parsed = incomeFormInputSchema.safeParse(data);
  if (!parsed.success) {
    return { error: `Validation failed: ${formatZodErrors(parsed.error)}` };
  }

  try {
    const documentId = await createIncomeForm(parsed.data);
    revalidatePath('/income');
    revalidatePath('/imports');
    return { success: true, documentId };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}

// ─── Mileage Import Actions ────────────────────────────────────

export async function validateMileageImportAction(
  csvText: string,
  mappings: MileageColumnMapping[],
  defaults: MileageImportDefaults
): Promise<{
  totalRows: number;
  validRows: number;
  errorRows: number;
  validationResults: MileageRowValidationResult[];
  validData: MileageRowParsed[];
  error?: string;
}> {
  if (!csvText || !mappings || !defaults) {
    return {
      totalRows: 0,
      validRows: 0,
      errorRows: 0,
      validationResults: [],
      validData: [],
      error: 'Missing required data.',
    };
  }

  const parsed = parseCSV(csvText);
  const result = previewMileageImport(parsed.rows, mappings, defaults);

  return result;
}

export async function commitMileageImportAction(
  validData: MileageRowParsed[],
  defaults: MileageImportDefaults
): Promise<{ success: boolean; insertedCount: number; error?: string }> {
  if (!validData || validData.length === 0) {
    return { success: false, insertedCount: 0, error: 'No valid data to import.' };
  }

  const result = await commitMileageImport(validData, defaults);

  if (result.success) {
    revalidatePath('/mileage');
    revalidatePath('/imports');
  }

  return result;
}
