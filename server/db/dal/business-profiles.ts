import 'server-only';

import { eq } from 'drizzle-orm';

import { getDb } from '@/server/db';
import { businessProfiles } from '@/server/db/schema';
import { generateId, nowISO, encrypt, decrypt, omitEncrypted } from './helpers';

export type BusinessPayload = {
  businessName: string;
  ein?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  stateOfFormation?: string;
  entityType?: string;
  accountingMethod?: string;
  startDate?: string;
  notes?: string;
  homeOfficePercent?: number;
};

export type BusinessProfileRecord = typeof businessProfiles.$inferSelect;

export type BusinessProfileDecrypted = Omit<
  BusinessProfileRecord,
  'payloadEncrypted'
> & {
  payload: BusinessPayload;
};

export async function createBusinessProfile(
  year: number,
  payload: BusinessPayload
): Promise<string> {
  const db = getDb();
  const id = generateId();
  const now = nowISO();
  const payloadEncrypted = await encrypt(payload);

  db.insert(businessProfiles)
    .values({ id, year, payloadEncrypted, createdAt: now, updatedAt: now })
    .run();

  return id;
}

export async function getBusinessProfile(
  id: string
): Promise<BusinessProfileDecrypted | undefined> {
  const db = getDb();
  const row = db
    .select()
    .from(businessProfiles)
    .where(eq(businessProfiles.id, id))
    .get();

  if (!row) return undefined;

  const payload = await decrypt<BusinessPayload>(row.payloadEncrypted);
  return { ...omitEncrypted(row), payload };
}

export async function listBusinessProfilesByYear(
  year: number
): Promise<BusinessProfileDecrypted[]> {
  const db = getDb();
  const rows = db
    .select()
    .from(businessProfiles)
    .where(eq(businessProfiles.year, year))
    .all();

  return Promise.all(
    rows.map(async (row) => {
      const payload = await decrypt<BusinessPayload>(row.payloadEncrypted);
      return { ...omitEncrypted(row), payload };
    })
  );
}

export async function updateBusinessProfile(
  id: string,
  payload: BusinessPayload
): Promise<void> {
  const db = getDb();
  const now = nowISO();
  const payloadEncrypted = await encrypt(payload);

  db.update(businessProfiles)
    .set({ payloadEncrypted, updatedAt: now })
    .where(eq(businessProfiles.id, id))
    .run();
}

export function deleteBusinessProfile(id: string): void {
  const db = getDb();
  db.delete(businessProfiles).where(eq(businessProfiles.id, id)).run();
}

export async function copyBusinessProfileToYear(
  id: string,
  targetYear: number
): Promise<string> {
  const source = await getBusinessProfile(id);
  if (!source) throw new Error('Business profile not found');

  return createBusinessProfile(targetYear, source.payload);
}
