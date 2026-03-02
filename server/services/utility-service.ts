import 'server-only';

import {
  createUtilityBill,
  updateUtilityBill,
  bulkCreateUtilityBills,
  listUtilityBillsByYear,
  deleteUtilityBill,
  getTotalUtilityCost,
  getUtilityBillCount,
  getMonthlyUtilityTotals,
  getUtilityTotalsByType,
  type UtilityBillPayload,
  type UtilityBillDecrypted,
} from '@/server/db/dal/utility-bills';
import { getBusinessProfileForYear } from '@/server/services/business-service';
import type { UtilityBillInput } from '@/lib/validation/utility-bill';

export type UtilitySummary = {
  totalCost: number; // cents
  billCount: number;
  homeOfficePercent: number; // 0-100
  businessDeduction: number; // cents
  byType: { utilityType: string; total: number; count: number }[];
  monthlyByType: { month: string; utilityType: string; total: number }[];
};

export async function getUtilitySummary(year: number): Promise<UtilitySummary> {
  const totalCost = getTotalUtilityCost(year);
  const billCount = getUtilityBillCount(year);
  const byType = getUtilityTotalsByType(year);
  const monthlyByType = getMonthlyUtilityTotals(year);

  const profile = await getBusinessProfileForYear(year);
  const homeOfficePercent = profile?.payload.homeOfficePercent ?? 0;
  const businessDeduction = Math.round((totalCost * homeOfficePercent) / 100);

  return {
    totalCost,
    billCount,
    homeOfficePercent,
    businessDeduction,
    byType,
    monthlyByType,
  };
}

export async function getUtilityDeduction(year: number): Promise<number> {
  const totalCost = getTotalUtilityCost(year);
  const profile = await getBusinessProfileForYear(year);
  const homeOfficePercent = profile?.payload.homeOfficePercent ?? 0;
  return Math.round((totalCost * homeOfficePercent) / 100);
}

export async function createUtilityBillFromInput(
  input: UtilityBillInput
): Promise<string> {
  const payload: UtilityBillPayload = {
    provider: input.provider,
    usage: input.usage,
    usageUnit: input.usageUnit,
    consumptionCharges: input.consumptionCharges,
    otherCharges: input.otherCharges,
    notes: input.notes,
  };

  return createUtilityBill({
    year: input.year,
    utilityType: input.utilityType,
    billDate: input.billDate,
    amount: input.amount,
    payload,
  });
}

export async function updateUtilityBillFromInput(
  id: string,
  input: UtilityBillInput
): Promise<void> {
  const payload: UtilityBillPayload = {
    provider: input.provider,
    usage: input.usage,
    usageUnit: input.usageUnit,
    consumptionCharges: input.consumptionCharges,
    otherCharges: input.otherCharges,
    notes: input.notes,
  };

  return updateUtilityBill(id, {
    utilityType: input.utilityType,
    billDate: input.billDate,
    amount: input.amount,
    payload,
  });
}

export async function bulkCreateUtilityBillsFromPaste(
  year: number,
  utilityType: string,
  provider: string,
  usageUnit: string | undefined,
  rows: Array<{
    billDate: string;
    usage: number | undefined;
    consumptionCharges: number;
    otherCharges: number;
    amount: number;
  }>
): Promise<{ insertedCount: number }> {
  const items = rows.map((row) => ({
    year,
    utilityType,
    billDate: row.billDate,
    amount: row.amount,
    payload: {
      provider,
      usage: row.usage,
      usageUnit,
      consumptionCharges: row.consumptionCharges || undefined,
      otherCharges: row.otherCharges || undefined,
    } as UtilityBillPayload,
  }));

  return bulkCreateUtilityBills(items);
}

export {
  listUtilityBillsByYear,
  deleteUtilityBill,
};
export type { UtilityBillDecrypted };
