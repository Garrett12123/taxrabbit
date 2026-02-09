'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

import {
  createCustomCategory,
  deleteCustomCategory,
} from '@/server/db/dal/custom-categories';
import { formatErrorForUser } from '@/lib/errors';

const addCategorySchema = z.object({
  year: z.coerce.number().int(),
  name: z.string().min(1).max(100),
});

export async function addCustomCategoryAction(
  data: unknown
): Promise<{ success?: boolean; error?: string }> {
  const parsed = addCategorySchema.safeParse(data);
  if (!parsed.success) {
    return { error: 'Invalid category name.' };
  }

  try {
    createCustomCategory(parsed.data.year, parsed.data.name);
    revalidatePath('/expenses');
    revalidatePath('/llc');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}

export async function deleteCustomCategoryAction(
  id: string
): Promise<{ success?: boolean; error?: string }> {
  if (!id || typeof id !== 'string') {
    return { error: 'Invalid category ID.' };
  }

  try {
    deleteCustomCategory(id);
    revalidatePath('/expenses');
    revalidatePath('/llc');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}
