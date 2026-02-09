'use server';

import { revalidatePath } from 'next/cache';

import { mileageLogSchema } from '@/lib/validation/mileage-log';
import { formatZodErrors, formatErrorForUser } from '@/lib/errors';
import type { ActionResult } from '@/lib/types';
import {
  addMileageLog,
  editMileageLog,
  deleteMileageLog,
} from '@/server/services/mileage-service';

export async function addMileageAction(
  data: unknown
): Promise<ActionResult> {
  const parsed = mileageLogSchema.safeParse(data);
  if (!parsed.success) {
    return { error: `Validation failed: ${formatZodErrors(parsed.error)}` };
  }

  try {
    // Convert miles to miles * 100 for storage precision
    const milesStored = Math.round(parsed.data.miles * 100);

    await addMileageLog({
      year: parsed.data.year,
      date: parsed.data.date,
      miles: milesStored,
      isRoundTrip: parsed.data.isRoundTrip,
      purpose: parsed.data.purpose,
      destination: parsed.data.destination,
      notes: parsed.data.notes,
    });
    revalidatePath('/mileage');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}

export async function updateMileageAction(
  id: string,
  data: unknown
): Promise<ActionResult> {
  if (!id || typeof id !== 'string') {
    return { error: 'Invalid mileage log ID.' };
  }

  const parsed = mileageLogSchema.safeParse(data);
  if (!parsed.success) {
    return { error: `Validation failed: ${formatZodErrors(parsed.error)}` };
  }

  try {
    const milesStored = Math.round(parsed.data.miles * 100);

    // Use editMileageLog which handles round-trip doubling consistently
    await editMileageLog(id, {
      date: parsed.data.date,
      miles: milesStored,
      isRoundTrip: parsed.data.isRoundTrip,
      purpose: parsed.data.purpose,
      destination: parsed.data.destination,
      notes: parsed.data.notes,
    });
    revalidatePath('/mileage');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}

export async function deleteMileageAction(
  id: string
): Promise<ActionResult> {
  if (!id || typeof id !== 'string') {
    return { error: 'Invalid mileage log ID.' };
  }

  try {
    deleteMileageLog(id);
    revalidatePath('/mileage');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}
