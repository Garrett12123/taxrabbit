import 'server-only';

import { eq, and } from 'drizzle-orm';

import {
  validateCsvRows,
  validateMileageCsvRows,
  type CsvRowParsed,
  type RowValidationResult,
  type ImportDefaults,
  type MileageRowParsed,
  type MileageRowValidationResult,
  type MileageImportDefaults,
} from '@/lib/validation/csv-import';
import type { ColumnMapping, MileageColumnMapping } from '@/lib/csv/column-mapping';
import { bulkCreateExpenses, type ExpensePayload } from '@/server/db/dal/expenses';
import { bulkCreateMileageLogs, type MileagePayload } from '@/server/db/dal/mileage-logs';
import { getDb } from '@/server/db';
import { expenses, mileageLogs } from '@/server/db/schema';

export type ImportPreviewResult = {
  totalRows: number;
  validRows: number;
  errorRows: number;
  validationResults: RowValidationResult[];
  validData: CsvRowParsed[];
};

export type ImportCommitResult = {
  success: boolean;
  insertedCount: number;
  skippedDuplicates: number;
  error?: string;
};

export function previewImport(
  rawRows: string[][],
  mappings: ColumnMapping[],
  defaults: ImportDefaults
): ImportPreviewResult {
  const validationResults = validateCsvRows(rawRows, mappings, defaults);

  const validData = validationResults
    .filter((r): r is RowValidationResult & { data: CsvRowParsed } => r.status === 'valid')
    .map((r) => r.data);

  return {
    totalRows: validationResults.length,
    validRows: validData.length,
    errorRows: validationResults.length - validData.length,
    validationResults,
    validData,
  };
}

export async function commitImport(
  validRows: CsvRowParsed[],
  defaults: ImportDefaults
): Promise<ImportCommitResult> {
  if (validRows.length === 0) {
    return { success: false, insertedCount: 0, skippedDuplicates: 0, error: 'No valid rows to import.' };
  }

  // Deduplicate: skip rows where date + amount + category already exists for this year.
  // Track in-batch duplicates to allow distinct same-day/same-amount rows from the CSV.
  const db = getDb();
  const dedupedRows: CsvRowParsed[] = [];
  let skippedDuplicates = 0;
  const seenInBatch = new Set<string>();

  for (const row of validRows) {
    const category = row.category || 'Other';
    // Include vendor in dedup key to avoid false positives (e.g., two different $15 lunches)
    const vendor = (row.vendor || '').toLowerCase().trim();
    const dedupKey = `${defaults.year}|${row.date}|${row.amount}|${category}|${vendor}`;

    // Check in-batch duplicates first
    if (seenInBatch.has(dedupKey)) {
      skippedDuplicates++;
      continue;
    }

    // DB dedup check must match in-batch dedup criteria (includes vendor via payload)
    const existingCandidates = db
      .select({ id: expenses.id, payloadEncrypted: expenses.payloadEncrypted })
      .from(expenses)
      .where(
        and(
          eq(expenses.year, defaults.year),
          eq(expenses.date, row.date),
          eq(expenses.amount, row.amount),
          eq(expenses.category, category)
        )
      )
      .all();
    // Narrow match: only treat as duplicate if same date+amount+category exists
    // (vendor check would require decryption, so we accept category-level dedup for DB)
    const existing = existingCandidates.length > 0 ? existingCandidates[0] : undefined;

    if (existing) {
      skippedDuplicates++;
    } else {
      seenInBatch.add(dedupKey);
      dedupedRows.push(row);
    }
  }

  if (dedupedRows.length === 0) {
    return {
      success: true,
      insertedCount: 0,
      skippedDuplicates,
      error: skippedDuplicates > 0
        ? `All ${skippedDuplicates} rows were duplicates of existing expenses.`
        : undefined,
    };
  }

  const items = dedupedRows.map((row) => {
    const payload: ExpensePayload = {
      vendor: row.vendor,
      description: row.description,
      notes: row.notes,
      paymentMethod: row.paymentMethod,
    };

    return {
      year: defaults.year,
      date: row.date,
      amount: row.amount,
      category: row.category || 'Other',
      entityType: row.entityType || 'personal',
      payload,
    };
  });

  const result = await bulkCreateExpenses(items);
  return { success: true, insertedCount: result.insertedCount, skippedDuplicates };
}

// ─── Mileage Import ────────────────────────────────────────────

export type MileageImportPreviewResult = {
  totalRows: number;
  validRows: number;
  errorRows: number;
  validationResults: MileageRowValidationResult[];
  validData: MileageRowParsed[];
};

export function previewMileageImport(
  rawRows: string[][],
  mappings: MileageColumnMapping[],
  defaults: MileageImportDefaults
): MileageImportPreviewResult {
  const validationResults = validateMileageCsvRows(rawRows, mappings, defaults);

  const validData = validationResults
    .filter((r): r is MileageRowValidationResult & { data: MileageRowParsed } => r.status === 'valid')
    .map((r) => r.data);

  return {
    totalRows: validationResults.length,
    validRows: validData.length,
    errorRows: validationResults.length - validData.length,
    validationResults,
    validData,
  };
}

export async function commitMileageImport(
  validRows: MileageRowParsed[],
  defaults: MileageImportDefaults
): Promise<ImportCommitResult> {
  if (validRows.length === 0) {
    return { success: false, insertedCount: 0, skippedDuplicates: 0, error: 'No valid rows to import.' };
  }

  // Deduplicate: skip rows where date + miles already exists for this year
  const db = getDb();
  const dedupedRows: MileageRowParsed[] = [];
  let skippedDuplicates = 0;
  const seenInBatch = new Set<string>();

  for (const row of validRows) {
    // For round trips, the actual stored miles is doubled
    const actualMiles = row.isRoundTrip ? row.miles * 2 : row.miles;
    
    const existing = db
      .select({ id: mileageLogs.id })
      .from(mileageLogs)
      .where(
        and(
          eq(mileageLogs.year, defaults.year),
          eq(mileageLogs.date, row.date),
          eq(mileageLogs.miles, actualMiles)
        )
      )
      .get();

    // Check in-batch duplicates first
    const dedupKey = `${defaults.year}|${row.date}|${actualMiles}`;
    if (seenInBatch.has(dedupKey)) {
      skippedDuplicates++;
      continue;
    }

    if (existing) {
      skippedDuplicates++;
    } else {
      seenInBatch.add(dedupKey);
      dedupedRows.push(row);
    }
  }

  if (dedupedRows.length === 0) {
    return {
      success: true,
      insertedCount: 0,
      skippedDuplicates,
      error: skippedDuplicates > 0
        ? `All ${skippedDuplicates} rows were duplicates of existing mileage logs.`
        : undefined,
    };
  }

  // Build all items first, then insert atomically in a transaction
  const items = dedupedRows.map((row) => {
    const actualMiles = row.isRoundTrip ? row.miles * 2 : row.miles;
    const payload: MileagePayload = {
      purpose: row.purpose,
      destination: row.destination,
      notes: row.notes,
      isRoundTrip: row.isRoundTrip,
    };
    return {
      year: defaults.year,
      date: row.date,
      miles: actualMiles,
      payload,
    };
  });

  const result = await bulkCreateMileageLogs(items);
  return { success: true, insertedCount: result.insertedCount, skippedDuplicates };
}
