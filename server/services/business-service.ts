import 'server-only';

import {
  createBusinessProfile,
  updateBusinessProfile,
  listBusinessProfilesByYear,
  deleteBusinessProfile,
  copyBusinessProfileToYear,
  type BusinessPayload,
  type BusinessProfileDecrypted,
} from '@/server/db/dal/business-profiles';
import type { BusinessProfileInput } from '@/lib/validation/business-profile';

export async function getBusinessProfileForYear(
  year: number
): Promise<BusinessProfileDecrypted | null> {
  const profiles = await listBusinessProfilesByYear(year);
  return profiles[0] ?? null;
}

export async function saveBusinessProfile(
  year: number,
  input: BusinessProfileInput
): Promise<string> {
  const payload: BusinessPayload = {
    businessName: input.businessName,
    ein: input.ein || undefined,
    address: input.address,
    address2: input.address2,
    city: input.city,
    state: input.state,
    zip: input.zip,
    stateOfFormation: input.stateOfFormation,
    entityType: input.entityType,
    accountingMethod: input.accountingMethod,
    startDate: input.startDate,
    notes: input.notes,
    homeOfficePercent: input.homeOfficePercent,
  };

  const existing = await getBusinessProfileForYear(year);

  if (existing) {
    await updateBusinessProfile(existing.id, payload);
    return existing.id;
  }

  return createBusinessProfile(year, payload);
}

// Re-export DAL functions
export {
  listBusinessProfilesByYear,
  deleteBusinessProfile,
  copyBusinessProfileToYear,
};
export type { BusinessProfileDecrypted };
