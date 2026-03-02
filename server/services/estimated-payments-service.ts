import 'server-only';

import {
  createEstimatedPayment,
  updateEstimatedPayment,
  listEstimatedPaymentsByYear,
  deleteEstimatedPayment,
  type EstimatedPaymentDecrypted,
  type EstimatedPaymentPayload,
} from '@/server/db/dal/estimated-payments';
import { estimateTaxLiability } from './tax-estimator-service';
import { ValidationError } from '@/lib/errors';

// IRS quarterly due dates (for the tax year)
export const QUARTERLY_DEADLINES: Record<number, { month: number; day: number; label: string }> = {
  1: { month: 4, day: 15, label: 'Q1 (Jan–Mar)' },
  2: { month: 6, day: 15, label: 'Q2 (Apr–May)' },
  3: { month: 9, day: 15, label: 'Q3 (Jun–Aug)' },
  4: { month: 1, day: 15, label: 'Q4 (Sep–Dec)' }, // Due Jan 15 of following year
};

export type QuarterlyStatus = {
  quarter: number;
  label: string;
  dueDate: string;
  recommendedAmount: number; // cents
  amountPaid: number; // cents
  isPaid: boolean;
  isPartiallyPaid: boolean;
  isOverdue: boolean;
  payment?: EstimatedPaymentDecrypted;
};

export function getDueDateForQuarter(year: number, quarter: number): string {
  const deadline = QUARTERLY_DEADLINES[quarter]!;
  const dueYear = quarter === 4 ? year + 1 : year;
  const month = String(deadline.month).padStart(2, '0');
  const day = String(deadline.day).padStart(2, '0');
  return `${dueYear}-${month}-${day}`;
}

export async function getQuarterlyOverview(
  year: number
): Promise<{
  quarters: QuarterlyStatus[];
  totalRecommended: number;
  totalPaid: number;
  estimatedOwed: number;
  nextDueQuarter: QuarterlyStatus | null;
}> {
  const taxEstimate = await estimateTaxLiability(year);
  const payments = await listEstimatedPaymentsByYear(year);
  const today = new Date().toISOString().slice(0, 10);

  // Recommended quarterly amount: estimated tax owed / 4
  // Only recommend payments if self-employment income exists and tax is owed
  const hasSeIncome = taxEstimate.selfEmploymentIncome > 0;
  const estimatedOwed = taxEstimate.estimatedOwed;
  const quarterlyAmount = hasSeIncome && estimatedOwed > 0 ? Math.ceil(estimatedOwed / 4) : 0;

  const quarters: QuarterlyStatus[] = [];
  let totalRecommended = 0;
  let totalPaid = 0;
  let nextDueQuarter: QuarterlyStatus | null = null;

  for (let q = 1; q <= 4; q++) {
    const dueDate = getDueDateForQuarter(year, q);
    const deadline = QUARTERLY_DEADLINES[q]!;
    const existingPayment = payments.find((p) => p.quarter === q);
    const amountPaid = existingPayment?.amountPaid ?? 0;
    // Consider paid only if the full recommended amount is covered.
    // When no estimated payment is needed (quarterlyAmount === 0 and no payment made),
    // treat as "paid" to avoid false overdue warnings for non-SE users.
    const isPaid = quarterlyAmount > 0 ? amountPaid >= quarterlyAmount : (quarterlyAmount === 0 || amountPaid > 0);
    const isPartiallyPaid = quarterlyAmount > 0 && amountPaid > 0 && amountPaid < quarterlyAmount;
    const isOverdue = !isPaid && dueDate < today;

    const status: QuarterlyStatus = {
      quarter: q,
      label: deadline.label,
      dueDate,
      recommendedAmount: quarterlyAmount,
      amountPaid,
      isPaid,
      isPartiallyPaid,
      isOverdue,
      payment: existingPayment,
    };

    quarters.push(status);
    totalRecommended += quarterlyAmount;
    totalPaid += amountPaid;

    if (!nextDueQuarter && !isPaid && dueDate >= today) {
      nextDueQuarter = status;
    }
  }

  return { quarters, totalRecommended, totalPaid, estimatedOwed, nextDueQuarter };
}

export async function recordPayment(data: {
  year: number;
  quarter: number;
  amountPaid: number;
  datePaid: string;
  payload?: EstimatedPaymentPayload;
}): Promise<string> {
  const payments = await listEstimatedPaymentsByYear(data.year);
  const existing = payments.find((p) => p.quarter === data.quarter);

  if (existing) {
    // Accumulate payment amounts instead of overwriting.
    // Merge payload fields to preserve existing notes/confirmation from prior payments.
    const mergedPayload = {
      ...existing.payload,
      ...data.payload,
    };
    await updateEstimatedPayment(existing.id, {
      amountPaid: existing.amountPaid + data.amountPaid,
      datePaid: data.datePaid, // Use the most recent payment date
      payload: mergedPayload,
    });
    return existing.id;
  }

  try {
    return await createEstimatedPayment({
      year: data.year,
      quarter: data.quarter,
      dueDate: getDueDateForQuarter(data.year, data.quarter),
      amountDue: 0,
      amountPaid: data.amountPaid,
      datePaid: data.datePaid,
      payload: data.payload,
    });
  } catch (err) {
    // Unique index on (year, quarter) prevents duplicates — surface user-friendly message
    if (err instanceof Error && err.message.includes('UNIQUE constraint')) {
      throw new ValidationError('A payment for this quarter already exists.');
    }
    throw err;
  }
}

export { listEstimatedPaymentsByYear, deleteEstimatedPayment };
