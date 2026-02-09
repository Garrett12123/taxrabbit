'use server';

import { revalidatePath } from 'next/cache';

import { documentFileSchema } from '@/lib/validation/document-file';
import { formatZodErrors, formatErrorForUser } from '@/lib/errors';
import type { ActionResult } from '@/lib/types';
import {
  uploadDocument,
  downloadDocument,
  removeDocument,
  updateDocumentMetadata,
  linkDocument,
  unlinkDocument,
} from '@/server/services/document-service';
import { getIncomeDocument } from '@/server/db/dal/income-documents';
import { getExpense } from '@/server/db/dal/expenses';

export async function uploadDocumentAction(
  formData: FormData
): Promise<ActionResult & { id?: string }> {
  const file = formData.get('file') as File | null;
  if (!file || !(file instanceof File)) {
    return { error: 'No file provided.' };
  }

  const year = formData.get('year');

  const parsed = documentFileSchema.safeParse({
    year,
    originalFilename: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  });

  if (!parsed.success) {
    return { error: `Validation failed: ${formatZodErrors(parsed.error)}` };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const id = await uploadDocument(parsed.data, buffer);
    revalidatePath('/documents');
    revalidatePath('/overview');
    return { success: true, id };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}

export async function deleteDocumentAction(
  id: string
): Promise<ActionResult> {
  if (!id || typeof id !== 'string') {
    return { error: 'Invalid document ID.' };
  }

  try {
    await removeDocument(id);
    revalidatePath('/documents');
    revalidatePath('/overview');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}

export async function updateDocumentMetadataAction(
  id: string,
  data: { description?: string; tags?: string[] }
): Promise<ActionResult> {
  if (!id || typeof id !== 'string') {
    return { error: 'Invalid document ID.' };
  }

  try {
    await updateDocumentMetadata(id, data);
    revalidatePath('/documents');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}

export async function linkDocumentAction(
  id: string,
  entityType: string,
  entityId: string
): Promise<ActionResult> {
  if (!id || !entityType || !entityId) {
    return { error: 'Invalid link parameters.' };
  }

  const validTypes = ['income', 'expense'];
  if (!validTypes.includes(entityType)) {
    return { error: 'Invalid entity type.' };
  }

  try {
    // Verify the target entity exists
    if (entityType === 'income') {
      const doc = await getIncomeDocument(entityId);
      if (!doc) return { error: 'Income document not found.' };
    } else if (entityType === 'expense') {
      const expense = await getExpense(entityId);
      if (!expense) return { error: 'Expense not found.' };
    }

    linkDocument(id, entityType, entityId);
    revalidatePath('/documents');
    revalidatePath('/expenses');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}

export async function unlinkDocumentAction(
  id: string
): Promise<ActionResult> {
  if (!id || typeof id !== 'string') {
    return { error: 'Invalid document ID.' };
  }

  try {
    unlinkDocument(id);
    revalidatePath('/documents');
    revalidatePath('/expenses');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}

export async function downloadDocumentAction(
  id: string
): Promise<ActionResult & { data?: { base64: string; mimeType: string; filename: string } }> {
  if (!id || typeof id !== 'string') {
    return { error: 'Invalid document ID.' };
  }

  try {
    const { buffer, mimeType, filename } = await downloadDocument(id);
    const base64 = buffer.toString('base64');
    return { success: true, data: { base64, mimeType, filename } };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}
