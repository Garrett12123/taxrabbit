import 'server-only';

import { eq } from 'drizzle-orm';

import { getDb } from '@/server/db';
import { incomeDocuments, expenses, documentFiles } from '@/server/db/schema';
import { decrypt } from '@/server/db/dal/helpers';
import type { IncomePayload } from '@/server/db/dal/income-documents';
import type { ExpensePayload } from '@/server/db/dal/expenses';
import type { DocumentPayload } from '@/server/db/dal/document-files';

export type SearchResult = {
  type: 'income' | 'expense' | 'document';
  id: string;
  label: string;
  sublabel?: string;
  amount?: number;
  href: string;
};

const MAX_RESULTS = 20;

export async function searchAll(
  year: number,
  query: string
): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  const q = query.toLowerCase().trim();
  const results: SearchResult[] = [];

  // Search income — decrypt in parallel then filter
  const db = getDb();
  const incomeRows = db
    .select()
    .from(incomeDocuments)
    .where(eq(incomeDocuments.year, year))
    .limit(100)
    .all();

  const incomeDecrypted = await Promise.all(
    incomeRows.map(async (row) => ({
      row,
      payload: await decrypt<IncomePayload>(row.payloadEncrypted),
    }))
  );

  for (const { row, payload } of incomeDecrypted) {
    if (results.length >= MAX_RESULTS) break;
    const formType = row.formType || '';
    const issuerName = payload.issuerName || '';
    if (formType.toLowerCase().includes(q) || issuerName.toLowerCase().includes(q)) {
      results.push({
        type: 'income',
        id: row.id,
        label: `${formType} — ${issuerName || 'Unknown'}`,
        amount: row.amount,
        href: `/income/${row.id}`,
      });
    }
  }

  // Search expenses — decrypt in parallel then filter
  if (results.length < MAX_RESULTS) {
    const expenseRows = db
      .select()
      .from(expenses)
      .where(eq(expenses.year, year))
      .limit(100)
      .all();

    const expenseDecrypted = await Promise.all(
      expenseRows.map(async (row) => ({
        row,
        payload: await decrypt<ExpensePayload>(row.payloadEncrypted),
      }))
    );

    for (const { row, payload } of expenseDecrypted) {
      if (results.length >= MAX_RESULTS) break;
      const category = row.category || '';
      const vendor = payload.vendor || '';
      const description = payload.description || '';
      const tags = (payload.tags || []).join(' ');
      const searchable = `${category} ${vendor} ${description} ${tags}`.toLowerCase();
      if (searchable.includes(q)) {
        results.push({
          type: 'expense',
          id: row.id,
          label: `${vendor || category}`,
          sublabel: description || category,
          amount: row.amount,
          href: `/expenses`,
        });
      }
    }
  }

  // Search documents — decrypt in parallel then filter
  if (results.length < MAX_RESULTS) {
    const docRows = db
      .select()
      .from(documentFiles)
      .where(eq(documentFiles.year, year))
      .limit(100)
      .all();

    const docDecrypted = await Promise.all(
      docRows.map(async (row) => ({
        row,
        payload: await decrypt<DocumentPayload>(row.payloadEncrypted),
      }))
    );

    for (const { row, payload } of docDecrypted) {
      if (results.length >= MAX_RESULTS) break;
      const filename = payload.originalFilename || '';
      const description = payload.description || '';
      const tags = (payload.tags || []).join(' ');
      const searchable = `${filename} ${description} ${tags}`.toLowerCase();
      if (searchable.includes(q)) {
        results.push({
          type: 'document',
          id: row.id,
          label: filename || 'Unnamed document',
          sublabel: description,
          href: `/documents`,
        });
      }
    }
  }

  return results;
}
