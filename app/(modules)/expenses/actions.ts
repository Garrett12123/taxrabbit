'use server';

import { revalidatePath } from 'next/cache';

import { expenseSchema } from '@/lib/validation/expense';
import { formatZodErrors, formatErrorForUser } from '@/lib/errors';
import type { ActionResult } from '@/lib/types';
import {
  createExpenseFromInput,
  updateExpenseFromInput,
} from '@/server/services/expense-service';
import { deleteExpense, bulkDeleteExpenses } from '@/server/db/dal/expenses';
import { unlinkByEntity } from '@/server/db/dal/document-files';
import { getDb } from '@/server/db';

export async function createExpenseAction(
  data: unknown
): Promise<ActionResult> {
  const parsed = expenseSchema.safeParse(data);
  if (!parsed.success) {
    return { error: `Validation failed: ${formatZodErrors(parsed.error)}` };
  }

  try {
    await createExpenseFromInput(parsed.data);
    revalidatePath('/expenses');
    revalidatePath('/llc');
    revalidatePath('/overview');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}

export async function updateExpenseAction(
  id: string,
  data: unknown
): Promise<ActionResult> {
  if (!id || typeof id !== 'string') {
    return { error: 'Invalid expense ID.' };
  }

  const parsed = expenseSchema.safeParse(data);
  if (!parsed.success) {
    return { error: `Validation failed: ${formatZodErrors(parsed.error)}` };
  }

  try {
    await updateExpenseFromInput(id, parsed.data);
    revalidatePath('/expenses');
    revalidatePath('/llc');
    revalidatePath('/overview');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}

export async function deleteExpenseAction(
  id: string
): Promise<ActionResult> {
  if (!id || typeof id !== 'string') {
    return { error: 'Invalid expense ID.' };
  }

  try {
    const db = getDb();
    db.transaction(() => {
      unlinkByEntity('expense', id);
      deleteExpense(id);
    });
    revalidatePath('/expenses');
    revalidatePath('/llc');
    revalidatePath('/overview');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}

export async function bulkDeleteExpensesAction(
  ids: string[]
): Promise<ActionResult & { deletedCount?: number }> {
  if (!Array.isArray(ids) || ids.length === 0) {
    return { error: 'No expenses selected.' };
  }
  if (ids.some((id) => typeof id !== 'string')) {
    return { error: 'Invalid expense IDs.' };
  }

  try {
    const db = getDb();
    db.transaction(() => {
      for (const id of ids) {
        unlinkByEntity('expense', id);
      }
      bulkDeleteExpenses(ids);
    });
    revalidatePath('/expenses');
    revalidatePath('/llc');
    revalidatePath('/overview');
    return { success: true, deletedCount: ids.length };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}
