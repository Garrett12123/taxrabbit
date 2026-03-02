import 'server-only';

import { eq, and, sql } from 'drizzle-orm';

import { getDb } from '@/server/db';
import { incomeDocuments } from '@/server/db/schema';
import { generateId, nowISO, encrypt, decrypt, omitEncrypted } from './helpers';
import { ValidationError } from '@/lib/errors';

export type IncomePayload = {
  issuerName: string;
  issuerEin?: string;
  // Payer/employer address
  issuerAddress?: string;
  issuerAddress2?: string;
  issuerCity?: string;
  issuerState?: string;
  issuerZip?: string;
  // Account/control numbers
  accountNumber?: string;
  controlNumber?: string;
  recipientProfileId?: string;
  boxes?: Record<string, number | string | boolean>;
  stateWages?: number;
  stateWithholding?: number;
  localWages?: number;
  localWithholding?: number;
  notes?: string;
};

export type IncomeDocumentRecord = typeof incomeDocuments.$inferSelect;

export type IncomeDocumentDecrypted = Omit<
  IncomeDocumentRecord,
  'payloadEncrypted'
> & {
  payload: IncomePayload;
};

export async function createIncomeDocument(data: {
  year: number;
  formType: string;
  entityType: 'personal' | 'business';
  amount: number;
  fedWithholding?: number;
  stateWithholding?: number;
  incomeDate?: string;
  payload: IncomePayload;
}): Promise<string> {
  if (data.amount < 0) {
    throw new ValidationError('Amount must not be negative');
  }
  const db = getDb();
  const id = generateId();
  const now = nowISO();
  const payloadEncrypted = await encrypt(data.payload);

  db.insert(incomeDocuments)
    .values({
      id,
      year: data.year,
      formType: data.formType,
      entityType: data.entityType,
      amount: data.amount,
      fedWithholding: data.fedWithholding ?? 0,
      stateWithholding: data.stateWithholding ?? 0,
      incomeDate: data.incomeDate ?? null,
      payloadEncrypted,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  return id;
}

export async function getIncomeDocument(
  id: string
): Promise<IncomeDocumentDecrypted | undefined> {
  const db = getDb();
  const row = db
    .select()
    .from(incomeDocuments)
    .where(eq(incomeDocuments.id, id))
    .get();

  if (!row) return undefined;

  const payload = await decrypt<IncomePayload>(row.payloadEncrypted);
  return { ...omitEncrypted(row), payload };
}

export async function listIncomeDocumentsByYear(
  year: number,
  filters?: { formType?: string; entityType?: 'personal' | 'business' }
): Promise<IncomeDocumentDecrypted[]> {
  const db = getDb();
  const conditions = [eq(incomeDocuments.year, year)];

  if (filters?.formType) {
    conditions.push(eq(incomeDocuments.formType, filters.formType));
  }
  if (filters?.entityType) {
    conditions.push(eq(incomeDocuments.entityType, filters.entityType));
  }

  const rows = db
    .select()
    .from(incomeDocuments)
    .where(and(...conditions))
    .all();

  return Promise.all(
    rows.map(async (row) => {
      const payload = await decrypt<IncomePayload>(row.payloadEncrypted);
      return { ...omitEncrypted(row), payload };
    })
  );
}

export async function updateIncomeDocument(
  id: string,
  data: {
    formType?: string;
    entityType?: 'personal' | 'business';
    amount?: number;
    fedWithholding?: number;
    stateWithholding?: number;
    incomeDate?: string | null;
    payload: IncomePayload;
  }
): Promise<void> {
  if (data.amount !== undefined && data.amount < 0) {
    throw new ValidationError('Amount must not be negative');
  }
  const db = getDb();
  const now = nowISO();
  const payloadEncrypted = await encrypt(data.payload);

  db.update(incomeDocuments)
    .set({
      ...(data.formType !== undefined ? { formType: data.formType } : {}),
      ...(data.entityType !== undefined ? { entityType: data.entityType } : {}),
      ...(data.amount !== undefined ? { amount: data.amount } : {}),
      ...(data.fedWithholding !== undefined
        ? { fedWithholding: data.fedWithholding }
        : {}),
      ...(data.stateWithholding !== undefined
        ? { stateWithholding: data.stateWithholding }
        : {}),
      ...(data.incomeDate !== undefined ? { incomeDate: data.incomeDate } : {}),
      payloadEncrypted,
      updatedAt: now,
    })
    .where(eq(incomeDocuments.id, id))
    .run();
}

export function deleteIncomeDocument(id: string): void {
  const db = getDb();
  db.delete(incomeDocuments).where(eq(incomeDocuments.id, id)).run();
}

export function getIncomeSummaryByType(
  year: number
): { formType: string; totalAmount: number; count: number }[] {
  const db = getDb();
  const rows = db
    .select({
      formType: incomeDocuments.formType,
      totalAmount: sql<number>`sum(${incomeDocuments.amount})`,
      count: sql<number>`count(*)`,
    })
    .from(incomeDocuments)
    .where(eq(incomeDocuments.year, year))
    .groupBy(incomeDocuments.formType)
    .all();

  return rows;
}

export function getIncomeSummaryByTypeAndEntity(
  year: number
): { formType: string; entityType: string; totalAmount: number; count: number }[] {
  const db = getDb();
  const rows = db
    .select({
      formType: incomeDocuments.formType,
      entityType: incomeDocuments.entityType,
      totalAmount: sql<number>`sum(${incomeDocuments.amount})`,
      count: sql<number>`count(*)`,
    })
    .from(incomeDocuments)
    .where(eq(incomeDocuments.year, year))
    .groupBy(incomeDocuments.formType, incomeDocuments.entityType)
    .all();

  return rows;
}

export function getTotalIncome(year: number): number {
  const db = getDb();
  const row = db
    .select({
      total: sql<number>`coalesce(sum(${incomeDocuments.amount}), 0)`,
    })
    .from(incomeDocuments)
    .where(eq(incomeDocuments.year, year))
    .get();

  return row?.total ?? 0;
}

export function getTotalWithholding(year: number): number {
  const db = getDb();
  const row = db
    .select({
      total: sql<number>`coalesce(sum(${incomeDocuments.fedWithholding}), 0)`,
    })
    .from(incomeDocuments)
    .where(eq(incomeDocuments.year, year))
    .get();

  return row?.total ?? 0;
}

/**
 * Groups by income_date when available, falling back to createdAt.
 */
export function getIncomeMonthlyTotals(
  year: number
): { month: string; total: number }[] {
  const db = getDb();
  const dateExpr = sql`coalesce(${incomeDocuments.incomeDate}, ${incomeDocuments.createdAt})`;
  const rows = db
    .select({
      month: sql<string>`substr(${dateExpr}, 1, 7)`,
      total: sql<number>`sum(${incomeDocuments.amount})`,
    })
    .from(incomeDocuments)
    .where(eq(incomeDocuments.year, year))
    .groupBy(sql`substr(${dateExpr}, 1, 7)`)
    .orderBy(sql`substr(${dateExpr}, 1, 7)`)
    .all();

  return rows;
}

export function getTotalStateWithholding(year: number): number {
  const db = getDb();
  const row = db
    .select({
      total: sql<number>`coalesce(sum(${incomeDocuments.stateWithholding}), 0)`,
    })
    .from(incomeDocuments)
    .where(eq(incomeDocuments.year, year))
    .get();

  return row?.total ?? 0;
}

export async function listRecentIncomeDocuments(
  year: number,
  limit: number
): Promise<IncomeDocumentDecrypted[]> {
  const db = getDb();
  const rows = db
    .select()
    .from(incomeDocuments)
    .where(eq(incomeDocuments.year, year))
    .orderBy(sql`${incomeDocuments.createdAt} desc`)
    .limit(limit)
    .all();

  return Promise.all(
    rows.map(async (row) => {
      const payload = await decrypt<IncomePayload>(row.payloadEncrypted);
      return { ...omitEncrypted(row), payload };
    })
  );
}

export function getWithholdingMonthlyTotals(
  year: number
): { month: string; fedWithholding: number; stateWithholding: number }[] {
  const db = getDb();
  const dateExpr = sql`coalesce(${incomeDocuments.incomeDate}, ${incomeDocuments.createdAt})`;
  const rows = db
    .select({
      month: sql<string>`substr(${dateExpr}, 1, 7)`,
      fedWithholding: sql<number>`sum(${incomeDocuments.fedWithholding})`,
      stateWithholding: sql<number>`sum(${incomeDocuments.stateWithholding})`,
    })
    .from(incomeDocuments)
    .where(eq(incomeDocuments.year, year))
    .groupBy(sql`substr(${dateExpr}, 1, 7)`)
    .orderBy(sql`substr(${dateExpr}, 1, 7)`)
    .all();

  return rows;
}

export function getIncomeByEntityType(
  year: number
): { entityType: string; totalAmount: number; count: number }[] {
  const db = getDb();
  const rows = db
    .select({
      entityType: incomeDocuments.entityType,
      totalAmount: sql<number>`sum(${incomeDocuments.amount})`,
      count: sql<number>`count(*)`,
    })
    .from(incomeDocuments)
    .where(eq(incomeDocuments.year, year))
    .groupBy(incomeDocuments.entityType)
    .all();

  return rows;
}

export function getIncomeDocumentCount(year: number): number {
  const db = getDb();
  const row = db
    .select({ count: sql<number>`count(*)` })
    .from(incomeDocuments)
    .where(eq(incomeDocuments.year, year))
    .get();

  return row?.count ?? 0;
}
