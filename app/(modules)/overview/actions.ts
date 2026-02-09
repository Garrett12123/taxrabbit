'use server';

import { revalidatePath } from 'next/cache';

import { 
  updateTaxYearStatus, 
  updateFilingStatus,
  type TaxYearStatus, 
  type FilingStatus 
} from '@/server/db/dal/tax-years';
import { formatErrorForUser } from '@/lib/errors';
import type { ActionResult } from '@/lib/types';

const validStatuses: TaxYearStatus[] = ['open', 'in_progress', 'filed', 'amended'];
const validFilingStatuses: FilingStatus[] = ['single', 'mfj', 'mfs', 'hoh'];

export async function updateTaxYearStatusAction(
  year: number,
  status: TaxYearStatus
): Promise<ActionResult> {
  if (!year || typeof year !== 'number' || year < 2000 || year > 2100) {
    return { error: 'Invalid tax year.' };
  }

  if (!validStatuses.includes(status)) {
    return { error: 'Invalid status.' };
  }

  try {
    updateTaxYearStatus(year, status);
    revalidatePath('/overview');
    revalidatePath('/');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}

export async function updateFilingStatusAction(
  year: number,
  filingStatus: FilingStatus
): Promise<ActionResult> {
  if (!year || typeof year !== 'number' || year < 2000 || year > 2100) {
    return { error: 'Invalid tax year.' };
  }

  if (!validFilingStatuses.includes(filingStatus)) {
    return { error: 'Invalid filing status.' };
  }

  try {
    updateFilingStatus(year, filingStatus);
    revalidatePath('/overview');
    revalidatePath('/');
    return { success: true };
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }
}
