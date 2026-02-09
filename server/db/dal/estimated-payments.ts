import 'server-only';

import { eq, asc } from 'drizzle-orm';

import { getDb } from '@/server/db';
import { estimatedPayments } from '@/server/db/schema';
import { generateId, nowISO, encrypt, decrypt, omitEncrypted } from './helpers';

export type EstimatedPaymentPayload = {
  confirmationNumber?: string;
  paymentMethod?: string;
  notes?: string;
};

export type EstimatedPaymentRecord = typeof estimatedPayments.$inferSelect;

export type EstimatedPaymentDecrypted = Omit<
  EstimatedPaymentRecord,
  'payloadEncrypted'
> & {
  payload: EstimatedPaymentPayload | null;
};

export async function createEstimatedPayment(data: {
  year: number;
  quarter: number;
  dueDate: string;
  amountDue: number;
  amountPaid?: number;
  datePaid?: string;
  payload?: EstimatedPaymentPayload;
}): Promise<string> {
  const db = getDb();
  const id = generateId();
  const now = nowISO();
  const payloadEncrypted = data.payload
    ? await encrypt(data.payload)
    : null;

  db.insert(estimatedPayments)
    .values({
      id,
      year: data.year,
      quarter: data.quarter,
      dueDate: data.dueDate,
      amountDue: data.amountDue,
      amountPaid: data.amountPaid ?? 0,
      datePaid: data.datePaid ?? null,
      payloadEncrypted,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  return id;
}

export async function updateEstimatedPayment(
  id: string,
  data: {
    amountDue?: number;
    amountPaid?: number;
    datePaid?: string | null;
    payload?: EstimatedPaymentPayload | null;
  }
): Promise<void> {
  const db = getDb();
  const now = nowISO();

  const updates: Record<string, unknown> = { updatedAt: now };
  if (data.amountDue !== undefined) updates.amountDue = data.amountDue;
  if (data.amountPaid !== undefined) updates.amountPaid = data.amountPaid;
  if (data.datePaid !== undefined) updates.datePaid = data.datePaid;
  if (data.payload !== undefined) {
    updates.payloadEncrypted = data.payload
      ? await encrypt(data.payload)
      : null;
  }

  db.update(estimatedPayments)
    .set(updates)
    .where(eq(estimatedPayments.id, id))
    .run();
}

export async function listEstimatedPaymentsByYear(
  year: number
): Promise<EstimatedPaymentDecrypted[]> {
  const db = getDb();
  const rows = db
    .select()
    .from(estimatedPayments)
    .where(eq(estimatedPayments.year, year))
    .orderBy(asc(estimatedPayments.quarter))
    .all();

  return Promise.all(
    rows.map(async (row) => {
      const payload = row.payloadEncrypted
        ? await decrypt<EstimatedPaymentPayload>(row.payloadEncrypted)
        : null;
      return { ...omitEncrypted(row), payload };
    })
  );
}

export async function getEstimatedPayment(
  id: string
): Promise<EstimatedPaymentDecrypted | undefined> {
  const db = getDb();
  const row = db
    .select()
    .from(estimatedPayments)
    .where(eq(estimatedPayments.id, id))
    .get();

  if (!row) return undefined;

  const payload = row.payloadEncrypted
    ? await decrypt<EstimatedPaymentPayload>(row.payloadEncrypted)
    : null;
  return { ...omitEncrypted(row), payload };
}

export function deleteEstimatedPayment(id: string): void {
  const db = getDb();
  db.delete(estimatedPayments).where(eq(estimatedPayments.id, id)).run();
}
