import 'server-only';

import { randomUUID } from 'node:crypto';

import { encryptJSON, decryptJSON } from '@/server/security/crypto';
import { requireDek } from '@/server/security/session';

export function generateId(): string {
  return randomUUID();
}

export function nowISO(): string {
  return new Date().toISOString();
}

export async function encrypt(data: unknown): Promise<string> {
  const dek = await requireDek();
  return encryptJSON(data, dek);
}

export async function decrypt<T>(encrypted: string): Promise<T> {
  const dek = await requireDek();
  return decryptJSON<T>(encrypted, dek);
}

/**
 * Omit the payloadEncrypted field from a record.
 * Used when returning decrypted records to avoid exposing the encrypted blob.
 */
export function omitEncrypted<T extends { payloadEncrypted: string | null }>(
  record: T
): Omit<T, 'payloadEncrypted'> {
  const { payloadEncrypted, ...rest } = record;
  void payloadEncrypted; // explicitly mark as intentionally unused
  return rest;
}
