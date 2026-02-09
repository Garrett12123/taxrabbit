'use server';

import { revalidatePath } from 'next/cache';

import { changePasswordSchema, lockTimeoutSchema, defaultYearSchema } from '@/lib/validation/settings';
import { personProfileSchema } from '@/lib/validation/person-profile';
import { businessProfileSchema } from '@/lib/validation/business-profile';
import { addCategorySchema } from '@/lib/validation/custom-category';
import {
  changePassword,
  updateLockTimeout,
  updateDefaultYear,
  revealRecoveryKey,
} from '@/server/services/settings-service';
import {
  saveBusinessProfile,
  getBusinessProfileForYear,
} from '@/server/services/business-service';
import {
  createPersonProfile,
  updatePersonProfile,
  listPersonProfilesByYear,
  type PersonPayload,
} from '@/server/db/dal/person-profiles';
import {
  createCustomCategory,
  deleteCustomCategory,
  listCustomCategories,
} from '@/server/db/dal/custom-categories';
import { formatErrorForUser, formatZodErrors } from '@/lib/errors';
import type { ActionResult } from '@/lib/types';

export async function changePasswordAction(
  data: unknown
): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse(data);
  if (!parsed.success) {
    return { error: `Validation failed: ${formatZodErrors(parsed.error)}` };
  }

  try {
    await changePassword(parsed.data.currentPassword, parsed.data.newPassword);
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}

export async function updateLockTimeoutAction(
  data: unknown
): Promise<ActionResult> {
  const parsed = lockTimeoutSchema.safeParse(data);
  if (!parsed.success) {
    return { error: 'Invalid timeout value.' };
  }

  try {
    await updateLockTimeout(parsed.data.lockTimeoutMinutes);
    revalidatePath('/settings');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}

export async function updateDefaultYearAction(
  data: unknown
): Promise<ActionResult> {
  const parsed = defaultYearSchema.safeParse(data);
  if (!parsed.success) {
    return { error: 'Invalid tax year.' };
  }

  try {
    updateDefaultYear(parsed.data.defaultTaxYear);
    revalidatePath('/settings');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}

export async function savePersonProfileAction(
  data: unknown
): Promise<ActionResult & { id?: string }> {
  const parsed = personProfileSchema.safeParse(data);
  if (!parsed.success) {
    return { error: `Validation failed: ${formatZodErrors(parsed.error)}` };
  }

  try {
    const { year, label, firstName, lastName, ...rest } = parsed.data;
    const payload: PersonPayload = {
      firstName,
      lastName,
      ssn: rest.ssn || undefined,
      dateOfBirth: rest.dateOfBirth || undefined,
      address: rest.address || undefined,
      phone: rest.phone || undefined,
      email: rest.email || undefined,
    };

    // Check if a profile already exists for this year
    const existing = await listPersonProfilesByYear(year);
    if (existing.length > 0) {
      await updatePersonProfile(existing[0]!.id, label, payload);
      revalidatePath('/settings');
      return { success: true, id: existing[0]!.id };
    }

    const id = await createPersonProfile(year, label, payload);
    revalidatePath('/settings');
    return { success: true, id };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}

export async function saveBusinessProfileFromSettingsAction(
  data: unknown
): Promise<ActionResult> {
  const parsed = businessProfileSchema.safeParse(data);
  if (!parsed.success) {
    return { error: `Validation failed: ${formatZodErrors(parsed.error)}` };
  }

  try {
    await saveBusinessProfile(parsed.data.year, parsed.data);
    revalidatePath('/settings');
    revalidatePath('/llc');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}

export async function addCategoryAction(
  data: unknown
): Promise<ActionResult> {
  const parsed = addCategorySchema.safeParse(data);
  if (!parsed.success) {
    return { error: `Validation failed: ${formatZodErrors(parsed.error)}` };
  }

  try {
    createCustomCategory(parsed.data.year, parsed.data.name);
    revalidatePath('/settings');
    revalidatePath('/expenses');
    revalidatePath('/llc');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}

export async function deleteCategoryAction(
  id: string
): Promise<ActionResult> {
  if (!id || typeof id !== 'string') {
    return { error: 'Invalid category ID.' };
  }

  try {
    deleteCustomCategory(id);
    revalidatePath('/settings');
    revalidatePath('/expenses');
    revalidatePath('/llc');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}

export async function revealRecoveryKeyAction(
  password: string
): Promise<ActionResult & { recoveryKey?: string }> {
  if (!password || typeof password !== 'string') {
    return { error: 'Password is required.' };
  }

  try {
    const recoveryKey = await revealRecoveryKey(password);
    return { success: true, recoveryKey };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}

// Helpers for loading data in client components
export async function getPersonProfilesForYear(year: number) {
  return listPersonProfilesByYear(year);
}

export async function getBusinessProfileForYearAction(year: number) {
  return getBusinessProfileForYear(year);
}

export async function getCustomCategoriesForYear(year: number) {
  return listCustomCategories(year);
}

