import 'server-only';

import { eq, and, sql } from 'drizzle-orm';

import { getDb } from '@/server/db';
import { utilityBills } from '@/server/db/schema';
import { generateId, nowISO, encrypt, decrypt, omitEncrypted } from './helpers';
import { ValidationError } from '@/lib/errors';

export type UtilityBillPayload = {
  provider: string;
  usage?: number;
  usageUnit?: string;
  consumptionCharges?: number;
  otherCharges?: number;
  notes?: string;
};

export type UtilityBillRecord = typeof utilityBills.$inferSelect;

export type UtilityBillDecrypted = Omit<UtilityBillRecord, 'payloadEncrypted'> & {
  payload: UtilityBillPayload;
};

export async function createUtilityBill(data: {
  year: number;
  utilityType: string;
  billDate: string;
  amount: number;
  payload: UtilityBillPayload;
}): Promise<string> {
  if (data.amount < 0) {
    throw new ValidationError('Amount must not be negative');
  }
  const db = getDb();
  const id = generateId();
  const now = nowISO();
  const payloadEncrypted = await encrypt(data.payload);

  db.insert(utilityBills)
    .values({
      id,
      year: data.year,
      utilityType: data.utilityType,
      billDate: data.billDate,
      amount: data.amount,
      payloadEncrypted,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  return id;
}

export async function getUtilityBill(
  id: string
): Promise<UtilityBillDecrypted | undefined> {
  const db = getDb();
  const row = db.select().from(utilityBills).where(eq(utilityBills.id, id)).get();

  if (!row) return undefined;

  const payload = await decrypt<UtilityBillPayload>(row.payloadEncrypted);
  return { ...omitEncrypted(row), payload };
}

export async function listUtilityBillsByYear(
  year: number,
  filters?: {
    utilityType?: string;
  }
): Promise<UtilityBillDecrypted[]> {
  const db = getDb();
  const conditions = [eq(utilityBills.year, year)];

  if (filters?.utilityType) {
    conditions.push(eq(utilityBills.utilityType, filters.utilityType));
  }

  const rows = db
    .select()
    .from(utilityBills)
    .where(and(...conditions))
    .orderBy(sql`${utilityBills.billDate} desc`)
    .all();

  return Promise.all(
    rows.map(async (row) => {
      const payload = await decrypt<UtilityBillPayload>(row.payloadEncrypted);
      return { ...omitEncrypted(row), payload };
    })
  );
}

export async function updateUtilityBill(
  id: string,
  data: {
    utilityType?: string;
    billDate?: string;
    amount?: number;
    payload: UtilityBillPayload;
  }
): Promise<void> {
  if (data.amount !== undefined && data.amount < 0) {
    throw new ValidationError('Amount must not be negative');
  }
  const db = getDb();
  const now = nowISO();
  const payloadEncrypted = await encrypt(data.payload);

  db.update(utilityBills)
    .set({
      ...(data.utilityType !== undefined ? { utilityType: data.utilityType } : {}),
      ...(data.billDate !== undefined ? { billDate: data.billDate } : {}),
      ...(data.amount !== undefined ? { amount: data.amount } : {}),
      payloadEncrypted,
      updatedAt: now,
    })
    .where(eq(utilityBills.id, id))
    .run();
}

export function deleteUtilityBill(id: string): void {
  const db = getDb();
  db.delete(utilityBills).where(eq(utilityBills.id, id)).run();
}

export async function bulkCreateUtilityBills(
  items: Array<{
    year: number;
    utilityType: string;
    billDate: string;
    amount: number;
    payload: UtilityBillPayload;
  }>
): Promise<{ insertedCount: number; ids: string[] }> {
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
      utilityType: item.utilityType,
      billDate: item.billDate,
      amount: item.amount,
      payloadEncrypted: await encrypt(item.payload),
      createdAt: now,
      updatedAt: now,
    }))
  );

  const ids: string[] = [];
  db.transaction((tx) => {
    for (const row of prepared) {
      tx.insert(utilityBills).values(row).run();
      ids.push(row.id);
    }
  });

  return { insertedCount: ids.length, ids };
}

export function getTotalUtilityCost(year: number): number {
  const db = getDb();
  const row = db
    .select({
      total: sql<number>`coalesce(sum(${utilityBills.amount}), 0)`,
    })
    .from(utilityBills)
    .where(eq(utilityBills.year, year))
    .get();

  return row?.total ?? 0;
}

export function getUtilityBillCount(year: number): number {
  const db = getDb();
  const row = db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(utilityBills)
    .where(eq(utilityBills.year, year))
    .get();

  return row?.count ?? 0;
}

export function getMonthlyUtilityTotals(
  year: number
): { month: string; utilityType: string; total: number }[] {
  const db = getDb();

  return db
    .select({
      month: sql<string>`substr(${utilityBills.billDate}, 1, 7)`,
      utilityType: utilityBills.utilityType,
      total: sql<number>`sum(${utilityBills.amount})`,
    })
    .from(utilityBills)
    .where(eq(utilityBills.year, year))
    .groupBy(sql`substr(${utilityBills.billDate}, 1, 7)`, utilityBills.utilityType)
    .orderBy(sql`substr(${utilityBills.billDate}, 1, 7)`)
    .all();
}

export function getUtilityTotalsByType(
  year: number
): { utilityType: string; total: number; count: number }[] {
  const db = getDb();

  return db
    .select({
      utilityType: utilityBills.utilityType,
      total: sql<number>`sum(${utilityBills.amount})`,
      count: sql<number>`count(*)`,
    })
    .from(utilityBills)
    .where(eq(utilityBills.year, year))
    .groupBy(utilityBills.utilityType)
    .orderBy(sql`sum(${utilityBills.amount}) desc`)
    .all();
}
