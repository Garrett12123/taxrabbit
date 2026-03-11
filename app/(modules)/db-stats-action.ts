'use server';

import { statSync } from 'node:fs';
import { join } from 'node:path';
import { getDb } from '@/server/db';

export type DbStats = {
  fileSizeBytes: number;
  walSizeBytes: number;
  tables: {
    name: string;
    rowCount: number;
  }[];
  totalRows: number;
  journalMode: string;
  pageSize: number;
  pageCount: number;
  freelistCount: number;
};

const TABLE_LABELS: Record<string, string> = {
  tax_years: 'Tax Years',
  person_profiles: 'Person Profiles',
  business_profiles: 'Business Profiles',
  income_documents: 'Income Documents',
  expenses: 'Expenses',
  document_files: 'Documents',
  custom_categories: 'Custom Categories',
  estimated_payments: 'Est. Payments',
  mileage_logs: 'Mileage Logs',
  utility_bills: 'Utility Bills',
  checklist_items: 'Checklist Items',
};

export async function getDbStats(): Promise<DbStats> {
  const db = getDb();
  const sqlite = (db as unknown as { $client: import('better-sqlite3').Database }).$client;

  // File sizes
  const dataDir = join(process.cwd(), 'data');
  const dbPath = join(dataDir, 'taxrabbit.db');
  const walPath = join(dataDir, 'taxrabbit.db-wal');

  let fileSizeBytes = 0;
  let walSizeBytes = 0;
  try { fileSizeBytes = statSync(dbPath).size; } catch { /* empty */ }
  try { walSizeBytes = statSync(walPath).size; } catch { /* empty */ }

  // Pragmas
  const journalMode = (sqlite.pragma('journal_mode') as { journal_mode: string }[])[0]?.journal_mode ?? 'unknown';
  const pageSize = (sqlite.pragma('page_size') as { page_size: number }[])[0]?.page_size ?? 0;
  const pageCount = (sqlite.pragma('page_count') as { page_count: number }[])[0]?.page_count ?? 0;
  const freelistCount = (sqlite.pragma('freelist_count') as { freelist_count: number }[])[0]?.freelist_count ?? 0;

  // Table row counts
  const tableNames = Object.keys(TABLE_LABELS);
  const tables: DbStats['tables'] = [];
  let totalRows = 0;

  for (const name of tableNames) {
    try {
      const row = sqlite.prepare(`SELECT COUNT(*) as n FROM ${name}`).get() as { n: number };
      tables.push({ name, rowCount: row.n });
      totalRows += row.n;
    } catch {
      /* table might not exist yet */
    }
  }

  return {
    fileSizeBytes,
    walSizeBytes,
    tables,
    totalRows,
    journalMode,
    pageSize,
    pageCount,
    freelistCount,
  };
}
