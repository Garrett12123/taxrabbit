'use server';

import { revalidatePath } from 'next/cache';

import { utilityBillSchema } from '@/lib/validation/utility-bill';
import { formatZodErrors, formatErrorForUser } from '@/lib/errors';
import type { ActionResult } from '@/lib/types';
import {
  createUtilityBillFromInput,
  updateUtilityBillFromInput,
  deleteUtilityBill,
  bulkCreateUtilityBillsFromPaste,
} from '@/server/services/utility-service';
import { UTILITY_TYPES } from '@/lib/constants';
import {
  getBusinessProfileForYear,
  saveBusinessProfile,
} from '@/server/services/business-service';

export async function createUtilityBillAction(
  data: unknown
): Promise<ActionResult> {
  const parsed = utilityBillSchema.safeParse(data);
  if (!parsed.success) {
    return { error: `Validation failed: ${formatZodErrors(parsed.error)}` };
  }

  try {
    await createUtilityBillFromInput(parsed.data);
    revalidatePath('/utilities');
    revalidatePath('/overview');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}

export async function updateUtilityBillAction(
  id: string,
  data: unknown
): Promise<ActionResult> {
  if (!id || typeof id !== 'string') {
    return { error: 'Invalid utility bill ID.' };
  }

  const parsed = utilityBillSchema.safeParse(data);
  if (!parsed.success) {
    return { error: `Validation failed: ${formatZodErrors(parsed.error)}` };
  }

  try {
    await updateUtilityBillFromInput(id, parsed.data);
    revalidatePath('/utilities');
    revalidatePath('/overview');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}

export async function deleteUtilityBillAction(
  id: string
): Promise<ActionResult> {
  if (!id || typeof id !== 'string') {
    return { error: 'Invalid utility bill ID.' };
  }

  try {
    deleteUtilityBill(id);
    revalidatePath('/utilities');
    revalidatePath('/overview');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}

export async function updateHomeOfficePercentAction(
  year: number,
  percent: number
): Promise<ActionResult> {
  if (percent < 0 || percent > 100) {
    return { error: 'Percentage must be between 0 and 100.' };
  }

  try {
    const existing = await getBusinessProfileForYear(year);

    if (!existing) {
      return { error: 'No LLC profile found. Set up your LLC profile first.' };
    }

    // Merge homeOfficePercent into existing payload
    const updatedInput = {
      year: year as (typeof import('@/lib/constants').TAX_YEARS)[number],
      businessName: existing.payload.businessName,
      ein: existing.payload.ein,
      address: existing.payload.address,
      address2: existing.payload.address2,
      city: existing.payload.city,
      state: existing.payload.state,
      zip: existing.payload.zip,
      stateOfFormation: existing.payload.stateOfFormation,
      entityType: existing.payload.entityType as 'sole_proprietorship' | 'single_member_llc' | 'multi_member_llc' | 'partnership' | 's_corporation' | 'c_corporation' | undefined,
      accountingMethod: existing.payload.accountingMethod as 'cash' | 'accrual' | 'hybrid' | undefined,
      startDate: existing.payload.startDate,
      notes: existing.payload.notes,
      homeOfficePercent: percent,
    };

    await saveBusinessProfile(year, updatedInput);
    revalidatePath('/utilities');
    revalidatePath('/overview');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}

export async function bulkCreateUtilityBillsAction(data: {
  year: number;
  utilityType: string;
  provider: string;
  usageUnit?: string;
  rows: Array<{
    billDate: string;
    usage: number | undefined;
    consumptionCharges: number;
    otherCharges: number;
    amount: number;
  }>;
}): Promise<ActionResult<{ insertedCount: number }>> {
  if (!data.rows || data.rows.length === 0) {
    return { error: 'No rows to import.' };
  }
  if (!data.provider?.trim()) {
    return { error: 'Provider is required.' };
  }
  if (!(UTILITY_TYPES as readonly string[]).includes(data.utilityType)) {
    return { error: 'Invalid utility type.' };
  }

  try {
    const result = await bulkCreateUtilityBillsFromPaste(
      data.year,
      data.utilityType,
      data.provider.trim(),
      data.usageUnit || undefined,
      data.rows
    );
    revalidatePath('/utilities');
    revalidatePath('/overview');
    return { success: true, data: result };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}
