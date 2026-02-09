import 'server-only';

import { unlinkSync } from 'node:fs';
import { eq, and, isNull, sql } from 'drizzle-orm';

import { getDb } from '@/server/db';
import { documentFiles } from '@/server/db/schema';
import { nowISO, encrypt, decrypt, omitEncrypted } from './helpers';

export type DocumentPayload = {
  originalFilename: string;
  description?: string;
  tags?: string[];
  sha256Hash?: string;
};

export type DocumentFileRecord = typeof documentFiles.$inferSelect;

export type DocumentFileDecrypted = Omit<
  DocumentFileRecord,
  'payloadEncrypted'
> & {
  payload: DocumentPayload;
};

export async function createDocumentFile(data: {
  id: string;
  year: number;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  linkedEntityType?: string;
  linkedEntityId?: string;
  payload: DocumentPayload;
}): Promise<string> {
  const db = getDb();
  const id = data.id;
  const now = nowISO();
  const payloadEncrypted = await encrypt(data.payload);

  db.insert(documentFiles)
    .values({
      id,
      year: data.year,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
      storagePath: data.storagePath,
      linkedEntityType: data.linkedEntityType ?? null,
      linkedEntityId: data.linkedEntityId ?? null,
      payloadEncrypted,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  return id;
}

export async function getDocumentFile(
  id: string
): Promise<DocumentFileDecrypted | undefined> {
  const db = getDb();
  const row = db
    .select()
    .from(documentFiles)
    .where(eq(documentFiles.id, id))
    .get();

  if (!row) return undefined;

  const payload = await decrypt<DocumentPayload>(row.payloadEncrypted);
  return { ...omitEncrypted(row), payload };
}

export async function listDocumentFilesByYear(
  year: number
): Promise<DocumentFileDecrypted[]> {
  const db = getDb();
  const rows = db
    .select()
    .from(documentFiles)
    .where(eq(documentFiles.year, year))
    .all();

  return Promise.all(
    rows.map(async (row) => {
      const payload = await decrypt<DocumentPayload>(row.payloadEncrypted);
      return { ...omitEncrypted(row), payload };
    })
  );
}

export async function updateDocumentFile(
  id: string,
  payload: DocumentPayload
): Promise<void> {
  const db = getDb();
  const now = nowISO();
  const payloadEncrypted = await encrypt(payload);

  db.update(documentFiles)
    .set({ payloadEncrypted, updatedAt: now })
    .where(eq(documentFiles.id, id))
    .run();
}

export function deleteDocumentFile(id: string): void {
  const db = getDb();
  // Look up storagePath before deleting so we can clean up the vault file
  const row = db
    .select({ storagePath: documentFiles.storagePath })
    .from(documentFiles)
    .where(eq(documentFiles.id, id))
    .get();

  db.delete(documentFiles).where(eq(documentFiles.id, id)).run();

  // Clean up vault file on disk (defense-in-depth alongside service layer)
  if (row?.storagePath) {
    try {
      unlinkSync(row.storagePath);
    } catch {
      // File may already be deleted
    }
  }
}

export function linkDocument(
  id: string,
  entityType: string,
  entityId: string
): void {
  const db = getDb();
  const now = nowISO();
  db.update(documentFiles)
    .set({ linkedEntityType: entityType, linkedEntityId: entityId, updatedAt: now })
    .where(eq(documentFiles.id, id))
    .run();
}

export function unlinkDocument(id: string): void {
  const db = getDb();
  const now = nowISO();
  db.update(documentFiles)
    .set({ linkedEntityType: null, linkedEntityId: null, updatedAt: now })
    .where(eq(documentFiles.id, id))
    .run();
}

export function unlinkByEntity(entityType: string, entityId: string): void {
  const db = getDb();
  const now = nowISO();
  db.update(documentFiles)
    .set({ linkedEntityType: null, linkedEntityId: null, updatedAt: now })
    .where(
      and(
        eq(documentFiles.linkedEntityType, entityType),
        eq(documentFiles.linkedEntityId, entityId)
      )
    )
    .run();
}

export async function getDocumentsForEntity(
  entityType: string,
  entityId: string
): Promise<DocumentFileDecrypted[]> {
  const db = getDb();
  const rows = db
    .select()
    .from(documentFiles)
    .where(
      and(
        eq(documentFiles.linkedEntityType, entityType),
        eq(documentFiles.linkedEntityId, entityId)
      )
    )
    .all();

  return Promise.all(
    rows.map(async (row) => {
      const payload = await decrypt<DocumentPayload>(row.payloadEncrypted);
      return { ...omitEncrypted(row), payload };
    })
  );
}

export function getLinkedEntityIds(entityType: string): Set<string> {
  const db = getDb();
  const rows = db
    .select({ linkedEntityId: documentFiles.linkedEntityId })
    .from(documentFiles)
    .where(eq(documentFiles.linkedEntityType, entityType))
    .all();
  return new Set(
    rows.map((r) => r.linkedEntityId).filter(Boolean) as string[]
  );
}

export function getUnlinkedCount(year: number): number {
  const db = getDb();
  const row = db
    .select({ count: sql<number>`count(*)` })
    .from(documentFiles)
    .where(
      and(
        eq(documentFiles.year, year),
        isNull(documentFiles.linkedEntityType)
      )
    )
    .get();

  return row?.count ?? 0;
}
