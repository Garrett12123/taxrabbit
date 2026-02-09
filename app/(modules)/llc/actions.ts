'use server';

import { revalidatePath } from 'next/cache';

import { businessProfileSchema } from '@/lib/validation/business-profile';
import { formatZodErrors, formatErrorForUser } from '@/lib/errors';
import type { ActionResult } from '@/lib/types';
import {
  saveBusinessProfile,
  getBusinessProfileForYear,
  copyBusinessProfileToYear,
} from '@/server/services/business-service';

export async function saveBusinessProfileAction(
  data: unknown
): Promise<ActionResult> {
  const parsed = businessProfileSchema.safeParse(data);
  if (!parsed.success) {
    return { error: `Validation failed: ${formatZodErrors(parsed.error)}` };
  }

  try {
    await saveBusinessProfile(parsed.data.year, parsed.data);
    revalidatePath('/llc');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}

export async function copyProfileForwardAction(
  targetYear: number
): Promise<ActionResult> {
  const previousYear = targetYear - 1;

  try {
    const source = await getBusinessProfileForYear(previousYear);

    if (!source) {
      return { error: `No business profile found for ${previousYear}.` };
    }

    await copyBusinessProfileToYear(source.id, targetYear);
    revalidatePath('/llc');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}
