import 'server-only';

import { eq, sql, asc } from 'drizzle-orm';

import { getDb } from '@/server/db';
import { checklistItems } from '@/server/db/schema';
import { generateId, nowISO, encrypt, decrypt, omitEncrypted } from './helpers';

export type ChecklistPayload = {
  content?: string;
  notes?: string;
};

export type ChecklistItemRecord = typeof checklistItems.$inferSelect;

export type ChecklistItemDecrypted = Omit<
  ChecklistItemRecord,
  'payloadEncrypted'
> & {
  payload: ChecklistPayload | null;
};

export async function createChecklistItem(data: {
  year: number;
  title: string;
  sortOrder?: number;
  payload?: ChecklistPayload;
}): Promise<string> {
  const db = getDb();
  const id = generateId();
  const now = nowISO();
  const payloadEncrypted = data.payload
    ? await encrypt(data.payload)
    : null;

  db.insert(checklistItems)
    .values({
      id,
      year: data.year,
      title: data.title,
      completed: false,
      sortOrder: data.sortOrder ?? 0,
      payloadEncrypted,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  return id;
}

export async function getChecklistItem(
  id: string
): Promise<ChecklistItemDecrypted | undefined> {
  const db = getDb();
  const row = db
    .select()
    .from(checklistItems)
    .where(eq(checklistItems.id, id))
    .get();

  if (!row) return undefined;

  const payload = row.payloadEncrypted
    ? await decrypt<ChecklistPayload>(row.payloadEncrypted)
    : null;
  return { ...omitEncrypted(row), payload };
}

export async function listChecklistItemsByYear(
  year: number
): Promise<ChecklistItemDecrypted[]> {
  const db = getDb();
  const rows = db
    .select()
    .from(checklistItems)
    .where(eq(checklistItems.year, year))
    .orderBy(asc(checklistItems.sortOrder))
    .all();

  return Promise.all(
    rows.map(async (row) => {
      const payload = row.payloadEncrypted
        ? await decrypt<ChecklistPayload>(row.payloadEncrypted)
        : null;
      return { ...omitEncrypted(row), payload };
    })
  );
}

export async function updateChecklistItem(
  id: string,
  data: {
    title?: string;
    sortOrder?: number;
    payload?: ChecklistPayload | null;
  }
): Promise<void> {
  const db = getDb();
  const now = nowISO();

  const updates: Record<string, unknown> = { updatedAt: now };
  if (data.title !== undefined) updates.title = data.title;
  if (data.sortOrder !== undefined) updates.sortOrder = data.sortOrder;
  if (data.payload !== undefined) {
    updates.payloadEncrypted = data.payload
      ? await encrypt(data.payload)
      : null;
  }

  db.update(checklistItems)
    .set(updates)
    .where(eq(checklistItems.id, id))
    .run();
}

export function toggleChecklistItem(id: string): void {
  const db = getDb();
  const now = nowISO();

  db.update(checklistItems)
    .set({
      completed: sql`NOT ${checklistItems.completed}`,
      updatedAt: now,
    })
    .where(eq(checklistItems.id, id))
    .run();
}

export function deleteChecklistItem(id: string): void {
  const db = getDb();
  db.delete(checklistItems).where(eq(checklistItems.id, id)).run();
}

export function reorderChecklistItems(
  items: { id: string; sortOrder: number }[]
): void {
  const db = getDb();
  const now = nowISO();

  db.transaction((tx) => {
    for (const item of items) {
      tx.update(checklistItems)
        .set({ sortOrder: item.sortOrder, updatedAt: now })
        .where(eq(checklistItems.id, item.id))
        .run();
    }
  });
}

export function getCompletionStats(
  year: number
): { total: number; completed: number } {
  const db = getDb();
  const row = db
    .select({
      total: sql<number>`count(*)`,
      completed: sql<number>`sum(case when ${checklistItems.completed} then 1 else 0 end)`,
    })
    .from(checklistItems)
    .where(eq(checklistItems.year, year))
    .get();

  return {
    total: row?.total ?? 0,
    completed: row?.completed ?? 0,
  };
}
