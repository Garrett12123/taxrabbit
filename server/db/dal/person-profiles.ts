import 'server-only';

import { eq } from 'drizzle-orm';

import { getDb } from '@/server/db';
import { personProfiles } from '@/server/db/schema';
import { generateId, nowISO, encrypt, decrypt, omitEncrypted } from './helpers';

export type PersonPayload = {
  firstName: string;
  lastName: string;
  ssn?: string;
  dateOfBirth?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  email?: string;
};

export type PersonProfileRecord = typeof personProfiles.$inferSelect;

export type PersonProfileDecrypted = Omit<
  PersonProfileRecord,
  'payloadEncrypted'
> & {
  payload: PersonPayload;
};

export async function createPersonProfile(
  year: number,
  label: string,
  payload: PersonPayload
): Promise<string> {
  const db = getDb();
  const id = generateId();
  const now = nowISO();
  const payloadEncrypted = await encrypt(payload);

  db.insert(personProfiles)
    .values({ id, year, label, payloadEncrypted, createdAt: now, updatedAt: now })
    .run();

  return id;
}

export async function getPersonProfile(
  id: string
): Promise<PersonProfileDecrypted | undefined> {
  const db = getDb();
  const row = db
    .select()
    .from(personProfiles)
    .where(eq(personProfiles.id, id))
    .get();

  if (!row) return undefined;

  const payload = await decrypt<PersonPayload>(row.payloadEncrypted);
  return { ...omitEncrypted(row), payload };
}

export async function listPersonProfilesByYear(
  year: number
): Promise<PersonProfileDecrypted[]> {
  const db = getDb();
  const rows = db
    .select()
    .from(personProfiles)
    .where(eq(personProfiles.year, year))
    .all();

  return Promise.all(
    rows.map(async (row) => {
      const payload = await decrypt<PersonPayload>(row.payloadEncrypted);
      return { ...omitEncrypted(row), payload };
    })
  );
}

export async function updatePersonProfile(
  id: string,
  label: string,
  payload: PersonPayload
): Promise<void> {
  const db = getDb();
  const now = nowISO();
  const payloadEncrypted = await encrypt(payload);

  db.update(personProfiles)
    .set({ label, payloadEncrypted, updatedAt: now })
    .where(eq(personProfiles.id, id))
    .run();
}

export function deletePersonProfile(id: string): void {
  const db = getDb();
  db.delete(personProfiles).where(eq(personProfiles.id, id)).run();
}

export async function copyPersonProfileToYear(
  id: string,
  targetYear: number
): Promise<string> {
  const source = await getPersonProfile(id);
  if (!source) throw new Error('Person profile not found');

  return createPersonProfile(targetYear, source.label, source.payload);
}
