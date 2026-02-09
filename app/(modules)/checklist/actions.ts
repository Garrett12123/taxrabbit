'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

import {
  createChecklistItem,
  updateChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
} from '@/server/db/dal/checklist-items';
import { formatErrorForUser } from '@/lib/errors';
import type { ActionResult } from '@/lib/types';

const addItemSchema = z.object({
  year: z.coerce.number().int(),
  title: z.string().min(1, 'Title is required').max(200),
});

export async function addChecklistItemAction(
  data: unknown
): Promise<ActionResult & { id?: string }> {
  const parsed = addItemSchema.safeParse(data);
  if (!parsed.success) {
    return { error: 'Title is required.' };
  }

  try {
    const id = await createChecklistItem({
      year: parsed.data.year,
      title: parsed.data.title,
    });
    revalidatePath('/checklist');
    revalidatePath('/overview');
    return { success: true, id };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}

export async function toggleChecklistItemAction(
  id: string
): Promise<ActionResult> {
  if (!id || typeof id !== 'string') {
    return { error: 'Invalid item ID.' };
  }

  try {
    toggleChecklistItem(id);
    revalidatePath('/checklist');
    revalidatePath('/overview');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}

export async function updateChecklistItemAction(
  id: string,
  title: string
): Promise<ActionResult> {
  if (!id || typeof id !== 'string') {
    return { error: 'Invalid item ID.' };
  }
  if (!title?.trim() || title.length > 200) {
    return { error: 'Title is required (max 200 chars).' };
  }

  try {
    await updateChecklistItem(id, { title });
    revalidatePath('/checklist');
    revalidatePath('/overview');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}

export async function deleteChecklistItemAction(
  id: string
): Promise<ActionResult> {
  if (!id || typeof id !== 'string') {
    return { error: 'Invalid item ID.' };
  }

  try {
    deleteChecklistItem(id);
    revalidatePath('/checklist');
    revalidatePath('/overview');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}
