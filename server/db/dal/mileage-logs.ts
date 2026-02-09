import 'server-only';

import { eq, sql, desc } from 'drizzle-orm';

import { getDb } from '@/server/db';
import { mileageLogs } from '@/server/db/schema';
import { generateId, nowISO, encrypt, decrypt, omitEncrypted } from './helpers';

export type MileagePayload = {
  purpose?: string;
  destination?: string;
  notes?: string;
  isRoundTrip?: boolean;
};

export type MileageLogRecord = typeof mileageLogs.$inferSelect;

export type MileageLogDecrypted = Omit<
  MileageLogRecord,
  'payloadEncrypted'
> & {
  payload: MileagePayload | null;
};

export async function createMileageLog(data: {
  year: number;
  date: string;
  miles: number;
  payload?: MileagePayload;
}): Promise<string> {
  const db = getDb();
  const id = generateId();
  const now = nowISO();
  const payloadEncrypted = data.payload
    ? await encrypt(data.payload)
    : null;

  db.insert(mileageLogs)
    .values({
      id,
      year: data.year,
      date: data.date,
      miles: data.miles,
      payloadEncrypted,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  return id;
}

export async function updateMileageLog(
  id: string,
  data: {
    date?: string;
    miles?: number;
    payload?: MileagePayload | null;
  }
): Promise<void> {
  const db = getDb();
  const now = nowISO();

  const updates: Record<string, unknown> = { updatedAt: now };
  if (data.date !== undefined) updates.date = data.date;
  if (data.miles !== undefined) updates.miles = data.miles;
  if (data.payload !== undefined) {
    updates.payloadEncrypted = data.payload
      ? await encrypt(data.payload)
      : null;
  }

  db.update(mileageLogs)
    .set(updates)
    .where(eq(mileageLogs.id, id))
    .run();
}

export async function listMileageLogsByYear(
  year: number
): Promise<MileageLogDecrypted[]> {
  const db = getDb();
  const rows = db
    .select()
    .from(mileageLogs)
    .where(eq(mileageLogs.year, year))
    .orderBy(desc(mileageLogs.date))
    .all();

  return Promise.all(
    rows.map(async (row) => {
      const payload = row.payloadEncrypted
        ? await decrypt<MileagePayload>(row.payloadEncrypted)
        : null;
      return { ...omitEncrypted(row), payload };
    })
  );
}

export async function getMileageLog(
  id: string
): Promise<MileageLogDecrypted | undefined> {
  const db = getDb();
  const row = db
    .select()
    .from(mileageLogs)
    .where(eq(mileageLogs.id, id))
    .get();

  if (!row) return undefined;

  const payload = row.payloadEncrypted
    ? await decrypt<MileagePayload>(row.payloadEncrypted)
    : null;
  return { ...omitEncrypted(row), payload };
}

export function deleteMileageLog(id: string): void {
  const db = getDb();
  db.delete(mileageLogs).where(eq(mileageLogs.id, id)).run();
}

export function getTotalMiles(year: number): number {
  const db = getDb();
  const row = db
    .select({
      total: sql<number>`coalesce(sum(${mileageLogs.miles}), 0)`,
    })
    .from(mileageLogs)
    .where(eq(mileageLogs.year, year))
    .get();

  return row?.total ?? 0;
}

export function getMileageLogCount(year: number): number {
  const db = getDb();
  const row = db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(mileageLogs)
    .where(eq(mileageLogs.year, year))
    .get();

  return row?.count ?? 0;
}

export async function bulkCreateMileageLogs(
  items: Array<{
    year: number;
    date: string;
    miles: number;
    payload?: MileagePayload;
  }>
): Promise<{ insertedCount: number }> {
  const db = getDb();
  const now = nowISO();

  // Pre-encrypt all payloads (async) before the sync transaction
  const prepared = await Promise.all(
    items.map(async (item) => ({
      id: generateId(),
      year: item.year,
      date: item.date,
      miles: item.miles,
      payloadEncrypted: item.payload ? await encrypt(item.payload) : null,
      createdAt: now,
      updatedAt: now,
    }))
  );

  // Sync transaction — atomic insert
  db.transaction((tx) => {
    for (const row of prepared) {
      tx.insert(mileageLogs).values(row).run();
    }
  });

  return { insertedCount: prepared.length };
}

export function getMonthlyMileage(
  year: number
): { month: string; totalMiles: number; tripCount: number }[] {
  const db = getDb();
  return db
    .select({
      month: sql<string>`substr(${mileageLogs.date}, 1, 7)`,
      totalMiles: sql<number>`sum(${mileageLogs.miles})`,
      tripCount: sql<number>`count(*)`,
    })
    .from(mileageLogs)
    .where(eq(mileageLogs.year, year))
    .groupBy(sql`substr(${mileageLogs.date}, 1, 7)`)
    .orderBy(sql`substr(${mileageLogs.date}, 1, 7)`)
    .all();
}
