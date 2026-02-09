'use server';

import { revalidatePath } from 'next/cache';

import { estimatedPaymentSchema, estimatedPaymentUpdateSchema } from '@/lib/validation/estimated-payment';
import { formatZodErrors, formatErrorForUser } from '@/lib/errors';
import type { ActionResult } from '@/lib/types';
import {
  recordPayment,
  deleteEstimatedPayment,
} from '@/server/services/estimated-payments-service';
import { updateEstimatedPayment } from '@/server/db/dal/estimated-payments';

export async function recordPaymentAction(
  data: unknown
): Promise<ActionResult> {
  const parsed = estimatedPaymentSchema.safeParse(data);
  if (!parsed.success) {
    return { error: `Validation failed: ${formatZodErrors(parsed.error)}` };
  }

  try {
    await recordPayment({
      year: parsed.data.year,
      quarter: parsed.data.quarter,
      amountPaid: parsed.data.amountPaid,
      datePaid: parsed.data.datePaid,
      payload: {
        confirmationNumber: parsed.data.confirmationNumber,
        paymentMethod: parsed.data.paymentMethod,
        notes: parsed.data.notes,
      },
    });
    revalidatePath('/estimated-payments');
    revalidatePath('/overview');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}

export async function updatePaymentAction(
  id: string,
  data: unknown
): Promise<ActionResult> {
  if (!id || typeof id !== 'string') {
    return { error: 'Invalid payment ID.' };
  }

  const parsed = estimatedPaymentUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return { error: `Validation failed: ${formatZodErrors(parsed.error)}` };
  }

  try {
    // Merge payload fields instead of overwriting (preserves existing notes/paymentMethod)
    await updateEstimatedPayment(id, {
      amountPaid: parsed.data.amountPaid,
      datePaid: parsed.data.datePaid,
      payload: {
        ...(parsed.data.confirmationNumber !== undefined
          ? { confirmationNumber: parsed.data.confirmationNumber }
          : {}),
        ...(parsed.data.paymentMethod !== undefined
          ? { paymentMethod: parsed.data.paymentMethod }
          : {}),
        ...(parsed.data.notes !== undefined
          ? { notes: parsed.data.notes }
          : {}),
      },
    });
    revalidatePath('/estimated-payments');
    revalidatePath('/overview');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}

export async function deletePaymentAction(
  id: string
): Promise<ActionResult> {
  if (!id || typeof id !== 'string') {
    return { error: 'Invalid payment ID.' };
  }

  try {
    deleteEstimatedPayment(id);
    revalidatePath('/estimated-payments');
    revalidatePath('/overview');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}
