import 'server-only';

import { createHash } from 'node:crypto';

import {
  createDocumentFile,
  getDocumentFile,
  listDocumentFilesByYear,
  updateDocumentFile,
  deleteDocumentFile,
  linkDocument,
  unlinkDocument,
  getDocumentsForEntity,
  getUnlinkedCount,
  type DocumentPayload,
  type DocumentFileDecrypted,
} from '@/server/db/dal/document-files';
import { writeVaultFile, readVaultFile, deleteVaultFile } from '@/server/storage/vault';
import { requireDek } from '@/server/security/session';
import { generateId } from '@/server/db/dal/helpers';
import type { DocumentFileInput } from '@/lib/validation/document-file';

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export type DocumentSummary = {
  totalCount: number;
  totalSize: number;
  linkedCount: number;
  unlinkedCount: number;
};

export async function uploadDocument(
  input: DocumentFileInput,
  fileBuffer: Buffer
): Promise<string> {
  if (!ALLOWED_MIME_TYPES.includes(input.mimeType as typeof ALLOWED_MIME_TYPES[number])) {
    throw new Error(`Unsupported file type: ${input.mimeType}`);
  }

  if (fileBuffer.length > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size is 50MB.`);
  }

  const sha256Hash = createHash('sha256').update(fileBuffer).digest('hex');
  const id = generateId();
  const dek = await requireDek();
  // Use actual buffer length, not client-provided sizeBytes
  const actualSize = fileBuffer.length;

  const storagePath = writeVaultFile(id, fileBuffer, dek);

  const payload: DocumentPayload = {
    originalFilename: input.originalFilename,
    description: input.description,
    tags: input.tags,
    sha256Hash,
  };

  try {
    await createDocumentFile({
      id,
      year: input.year,
      mimeType: input.mimeType,
      sizeBytes: actualSize,
      storagePath,
      payload,
    });
  } catch (err) {
    // Clean up orphaned vault file if DB insert fails
    try {
      deleteVaultFile(id);
    } catch {
      // Best-effort cleanup
    }
    throw err;
  }

  return id;
}

export async function downloadDocument(
  id: string
): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
  const doc = await getDocumentFile(id);
  if (!doc) {
    throw new Error('Document not found');
  }

  const dek = await requireDek();
  const buffer = readVaultFile(id, dek);

  return {
    buffer,
    mimeType: doc.mimeType,
    filename: doc.payload.originalFilename,
  };
}

export async function removeDocument(id: string): Promise<void> {
  const doc = await getDocumentFile(id);
  if (!doc) {
    throw new Error('Document not found');
  }

  // Delete DB record first, then vault file — if vault file delete fails,
  // the orphaned file is harmless (no DB record points to it)
  deleteDocumentFile(id);
  try {
    deleteVaultFile(id);
  } catch {
    // Best-effort: orphaned vault file is harmless without a DB record
  }
}

export async function updateDocumentMetadata(
  id: string,
  data: { description?: string; tags?: string[] }
): Promise<void> {
  const doc = await getDocumentFile(id);
  if (!doc) {
    throw new Error('Document not found');
  }

  const updatedPayload: DocumentPayload = {
    ...doc.payload,
    ...(data.description !== undefined ? { description: data.description } : {}),
    ...(data.tags !== undefined ? { tags: data.tags } : {}),
  };

  await updateDocumentFile(id, updatedPayload);
}

export async function getDocumentSummary(
  year: number
): Promise<DocumentSummary> {
  const docs = await listDocumentFilesByYear(year);
  const unlinkedCount = getUnlinkedCount(year);

  const totalCount = docs.length;
  const totalSize = docs.reduce((sum, d) => sum + d.sizeBytes, 0);
  const linkedCount = totalCount - unlinkedCount;

  return { totalCount, totalSize, linkedCount, unlinkedCount };
}

// Re-export DAL functions
export {
  getDocumentFile,
  listDocumentFilesByYear,
  linkDocument,
  unlinkDocument,
  getDocumentsForEntity,
  getUnlinkedCount,
};
export type { DocumentFileDecrypted };
