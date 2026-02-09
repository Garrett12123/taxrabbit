import 'server-only';

import { eq, and, sql, between } from 'drizzle-orm';

import { getDb } from '@/server/db';
import { expenses } from '@/server/db/schema';
import { generateId, nowISO, encrypt, decrypt, omitEncrypted } from './helpers';
import { ValidationError } from '@/lib/errors';

export type ExpensePayload = {
  vendor: string;
  description?: string;
  notes?: string;
  paymentMethod?: string;
  tags?: string[];
  receiptRef?: string;
};

export type ExpenseRecord = typeof expenses.$inferSelect;

export type ExpenseDecrypted = Omit<ExpenseRecord, 'payloadEncrypted'> & {
  payload: ExpensePayload;
};

export async function createExpense(data: {
  year: number;
  date: string;
  amount: number;
  category: string;
  entityType: 'personal' | 'business';
  payload: ExpensePayload;
}): Promise<string> {
  if (data.amount < 0) {
    throw new ValidationError('Amount must not be negative');
  }
  const db = getDb();
  const id = generateId();
  const now = nowISO();
  const payloadEncrypted = await encrypt(data.payload);

  db.insert(expenses)
    .values({
      id,
      year: data.year,
      date: data.date,
      amount: data.amount,
      category: data.category,
      entityType: data.entityType,
      payloadEncrypted,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  return id;
}

export async function getExpense(
  id: string
): Promise<ExpenseDecrypted | undefined> {
  const db = getDb();
  const row = db.select().from(expenses).where(eq(expenses.id, id)).get();

  if (!row) return undefined;

  const payload = await decrypt<ExpensePayload>(row.payloadEncrypted);
  return { ...omitEncrypted(row), payload };
}

export async function listExpensesByYear(
  year: number,
  filters?: {
    category?: string;
    entityType?: 'personal' | 'business';
    startDate?: string;
    endDate?: string;
  }
): Promise<ExpenseDecrypted[]> {
  const db = getDb();
  const conditions = [eq(expenses.year, year)];

  if (filters?.category) {
    conditions.push(eq(expenses.category, filters.category));
  }
  if (filters?.entityType) {
    conditions.push(eq(expenses.entityType, filters.entityType));
  }
  if (filters?.startDate && filters?.endDate) {
    conditions.push(between(expenses.date, filters.startDate, filters.endDate));
  }

  const rows = db
    .select()
    .from(expenses)
    .where(and(...conditions))
    .all();

  return Promise.all(
    rows.map(async (row) => {
      const payload = await decrypt<ExpensePayload>(row.payloadEncrypted);
      return { ...omitEncrypted(row), payload };
    })
  );
}

export async function searchExpenses(
  year: number,
  query: string
): Promise<ExpenseDecrypted[]> {
  const all = await listExpensesByYear(year);
  const lower = query.toLowerCase();
  return all.filter(
    (e) =>
      e.payload.vendor.toLowerCase().includes(lower) ||
      e.payload.description?.toLowerCase().includes(lower) ||
      e.payload.notes?.toLowerCase().includes(lower)
  );
}

export async function updateExpense(
  id: string,
  data: {
    date?: string;
    amount?: number;
    category?: string;
    entityType?: 'personal' | 'business';
    payload: ExpensePayload;
  }
): Promise<void> {
  if (data.amount !== undefined && data.amount < 0) {
    throw new ValidationError('Amount must not be negative');
  }
  const db = getDb();
  const now = nowISO();
  const payloadEncrypted = await encrypt(data.payload);

  db.update(expenses)
    .set({
      ...(data.date !== undefined ? { date: data.date } : {}),
      ...(data.amount !== undefined ? { amount: data.amount } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.entityType !== undefined ? { entityType: data.entityType } : {}),
      payloadEncrypted,
      updatedAt: now,
    })
    .where(eq(expenses.id, id))
    .run();
}

export function deleteExpense(id: string): void {
  const db = getDb();
  db.delete(expenses).where(eq(expenses.id, id)).run();
}

export function bulkDeleteExpenses(ids: string[]): number {
  if (ids.length === 0) return 0;
  const db = getDb();
  let deleted = 0;
  db.transaction(() => {
    for (const id of ids) {
      const result = db.delete(expenses).where(eq(expenses.id, id)).run();
      deleted += result.changes;
    }
  });
  return deleted;
}

export async function listRecentExpenses(
  year: number,
  limit: number
): Promise<ExpenseDecrypted[]> {
  const db = getDb();
  const rows = db
    .select()
    .from(expenses)
    .where(eq(expenses.year, year))
    .orderBy(sql`${expenses.createdAt} desc`)
    .limit(limit)
    .all();

  return Promise.all(
    rows.map(async (row) => {
      const payload = await decrypt<ExpensePayload>(row.payloadEncrypted);
      return { ...omitEncrypted(row), payload };
    })
  );
}

export function getMonthlyTotals(
  year: number,
  entityType?: 'personal' | 'business'
): { month: string; total: number }[] {
  const db = getDb();
  const conditions = [eq(expenses.year, year)];
  if (entityType) {
    conditions.push(eq(expenses.entityType, entityType));
  }

  const rows = db
    .select({
      month: sql<string>`substr(${expenses.date}, 1, 7)`,
      total: sql<number>`sum(${expenses.amount})`,
    })
    .from(expenses)
    .where(and(...conditions))
    .groupBy(sql`substr(${expenses.date}, 1, 7)`)
    .orderBy(sql`substr(${expenses.date}, 1, 7)`)
    .all();

  return rows;
}

export async function bulkCreateExpenses(
  items: Array<{
    year: number;
    date: string;
    amount: number;
    category: string;
    entityType: 'personal' | 'business';
    payload: ExpensePayload;
  }>
): Promise<{ insertedCount: number; ids: string[] }> {
  // Validate amounts before inserting (same check as createExpense)
  for (const item of items) {
    if (item.amount < 0) {
      throw new ValidationError('Amount must not be negative');
    }
  }

  const db = getDb();
  const now = nowISO();

  // Pre-encrypt all payloads (async) before the sync transaction
  const prepared = await Promise.all(
    items.map(async (item) => ({
      id: generateId(),
      year: item.year,
      date: item.date,
      amount: item.amount,
      category: item.category,
      entityType: item.entityType,
      payloadEncrypted: await encrypt(item.payload),
      createdAt: now,
      updatedAt: now,
    }))
  );

  // Sync transaction — atomic insert
  const ids: string[] = [];
  db.transaction((tx) => {
    for (const row of prepared) {
      tx.insert(expenses).values(row).run();
      ids.push(row.id);
    }
  });

  return { insertedCount: ids.length, ids };
}

export function getCategoryTotals(
  year: number,
  entityType?: 'personal' | 'business'
): { category: string; total: number; count: number }[] {
  const db = getDb();
  const conditions = [eq(expenses.year, year)];
  if (entityType) {
    conditions.push(eq(expenses.entityType, entityType));
  }

  const rows = db
    .select({
      category: expenses.category,
      total: sql<number>`sum(${expenses.amount})`,
      count: sql<number>`count(*)`,
    })
    .from(expenses)
    .where(and(...conditions))
    .groupBy(expenses.category)
    .orderBy(sql`sum(${expenses.amount}) desc`)
    .all();

  return rows;
}
