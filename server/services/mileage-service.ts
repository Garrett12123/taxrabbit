import 'server-only';

import {
  createMileageLog,
  updateMileageLog,
  listMileageLogsByYear,
  deleteMileageLog,
  getMileageLog,
  getTotalMiles,
  getMileageLogCount,
  getMonthlyMileage,
  type MileageLogDecrypted,
  type MileagePayload,
} from '@/server/db/dal/mileage-logs';

// IRS standard mileage rates for business use (tenths of a cent per mile) by year.
// Using tenths of a cent to accurately represent half-cent rates (e.g., 57.5 = 575).
const IRS_MILEAGE_RATES_TENTHS: Record<number, number> = {
  2020: 575,  // $0.575/mile
  2021: 560,  // $0.56/mile
  2022: 605,  // $0.585 (Jan-Jun) / $0.625 (Jul-Dec) — average $0.605
  2023: 655,  // $0.655/mile
  2024: 670,  // $0.67/mile
  2025: 700,  // $0.70/mile
  2026: 700,  // Placeholder: not yet published, using 2025 rate
};

/**
 * Get the IRS mileage rate in cents per mile for display purposes.
 * Note: Returns the rate rounded to the nearest cent. For precise calculations,
 * use the internal tenths-of-a-cent values.
 */
export function getIrsMileageRate(year: number): number {
  const tenths = IRS_MILEAGE_RATES_TENTHS[year] ?? IRS_MILEAGE_RATES_TENTHS[2025]!;
  return Math.round(tenths / 10);
}

export function getIrsMileageRateTenths(year: number): number {
  return IRS_MILEAGE_RATES_TENTHS[year] ?? IRS_MILEAGE_RATES_TENTHS[2025]!;
}

export type MileageSummary = {
  totalMiles: number; // miles * 100
  totalTrips: number;
  totalDeduction: number; // cents
  ratePerMileTenths: number; // tenths of a cent (e.g. 700 = $0.70)
  monthlyBreakdown: { month: string; totalMiles: number; tripCount: number }[];
};

export function getMileageSummary(year: number): MileageSummary {
  const totalMiles = getTotalMiles(year);
  const totalTrips = getMileageLogCount(year);
  const monthlyBreakdown = getMonthlyMileage(year);
  const rateTenths = getIrsMileageRateTenths(year);

  // miles stored as miles * 100; rate is tenths of a cent per mile
  // deduction in cents = (totalMiles / 100) * (rateTenths / 10)
  //                    = totalMiles * rateTenths / 1000
  const totalDeduction = Math.round((totalMiles * rateTenths) / 1000);

  return {
    totalMiles,
    totalTrips,
    totalDeduction,
    ratePerMileTenths: rateTenths,
    monthlyBreakdown,
  };
}

export async function addMileageLog(input: {
  year: number;
  date: string;
  miles: number; // miles * 100
  isRoundTrip?: boolean;
  purpose?: string;
  destination?: string;
  notes?: string;
}): Promise<string> {
  // Double miles if round trip
  const actualMiles = input.isRoundTrip ? input.miles * 2 : input.miles;
  
  const payload: MileagePayload = {
    purpose: input.purpose,
    destination: input.destination,
    notes: input.notes,
    isRoundTrip: input.isRoundTrip,
  };

  return createMileageLog({
    year: input.year,
    date: input.date,
    miles: actualMiles,
    payload,
  });
}

export async function editMileageLog(
  id: string,
  input: {
    date?: string;
    miles?: number; // miles * 100 (one-way distance)
    isRoundTrip?: boolean;
    purpose?: string;
    destination?: string;
    notes?: string;
  }
): Promise<void> {
  // Apply round-trip doubling consistently with addMileageLog.
  // When miles is provided, use the round-trip flag to decide doubling.
  // When only isRoundTrip changes (miles undefined), fetch the existing log
  // to derive one-way miles and recalculate with the new round-trip flag.
  let actualMiles = input.miles;
  if (actualMiles != null) {
    actualMiles = input.isRoundTrip ? actualMiles * 2 : actualMiles;
  } else if (input.isRoundTrip !== undefined) {
    const existing = await getMileageLog(id);
    if (existing) {
      const wasRoundTrip = existing.payload?.isRoundTrip ?? false;
      const oneWayMiles = wasRoundTrip ? existing.miles / 2 : existing.miles;
      actualMiles = input.isRoundTrip ? oneWayMiles * 2 : oneWayMiles;
    }
  }

  const payload: Partial<MileagePayload> = {};
  if (input.purpose !== undefined) payload.purpose = input.purpose;
  if (input.destination !== undefined) payload.destination = input.destination;
  if (input.notes !== undefined) payload.notes = input.notes;
  if (input.isRoundTrip !== undefined) payload.isRoundTrip = input.isRoundTrip;

  return updateMileageLog(id, {
    ...(input.date !== undefined ? { date: input.date } : {}),
    ...(actualMiles !== undefined ? { miles: actualMiles } : {}),
    payload: payload as MileagePayload,
  });
}

export {
  listMileageLogsByYear,
  deleteMileageLog,
};
export type { MileageLogDecrypted };
