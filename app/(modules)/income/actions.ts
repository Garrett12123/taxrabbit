'use server';

import { revalidatePath } from 'next/cache';

import { incomeFormInputSchema } from '@/lib/validation/income-forms';
import { formatZodErrors, formatErrorForUser } from '@/lib/errors';
import type { ActionResult } from '@/lib/types';
import {
  createIncomeForm,
  updateIncomeForm,
} from '@/server/services/income-service';
import { deleteIncomeDocument } from '@/server/db/dal/income-documents';
import { unlinkByEntity } from '@/server/db/dal/document-files';
import { getDb } from '@/server/db';

export async function createIncomeAction(
  data: unknown
): Promise<ActionResult> {
  const parsed = incomeFormInputSchema.safeParse(data);
  if (!parsed.success) {
    const details = formatZodErrors(parsed.error);
    return { error: `Validation failed: ${details}` };
  }

  try {
    await createIncomeForm(parsed.data);
    revalidatePath('/income');
    revalidatePath('/overview');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}

export async function updateIncomeAction(
  id: string,
  data: unknown
): Promise<ActionResult> {
  if (!id || typeof id !== 'string') {
    return { error: 'Invalid document ID.' };
  }

  const parsed = incomeFormInputSchema.safeParse(data);
  if (!parsed.success) {
    const details = formatZodErrors(parsed.error);
    return { error: `Validation failed: ${details}` };
  }

  try {
    await updateIncomeForm(id, parsed.data);
    revalidatePath('/income');
    revalidatePath('/overview');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}

export async function deleteIncomeAction(
  id: string
): Promise<ActionResult> {
  if (!id || typeof id !== 'string') {
    return { error: 'Invalid document ID.' };
  }

  try {
    const db = getDb();
    db.transaction(() => {
      unlinkByEntity('income', id);
      deleteIncomeDocument(id);
    });
    revalidatePath('/income');
    revalidatePath('/overview');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}
