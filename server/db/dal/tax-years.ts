import 'server-only';

import { eq, desc } from 'drizzle-orm';

import { getDb } from '@/server/db';
import { taxYears } from '@/server/db/schema';
import { nowISO } from './helpers';

export type TaxYearStatus = 'open' | 'in_progress' | 'filed' | 'amended';
export type FilingStatus = 'single' | 'mfj' | 'mfs' | 'hoh';

export type TaxYearRecord = typeof taxYears.$inferSelect;

export function ensureTaxYear(year: number): TaxYearRecord {
  const db = getDb();
  const existing = db
    .select()
    .from(taxYears)
    .where(eq(taxYears.year, year))
    .get();

  if (existing) return existing;

  const now = nowISO();
  const record = {
    year,
    status: 'open' as const,
    filingStatus: 'single' as const,
    notes: null,
    createdAt: now,
    updatedAt: now,
  };

  db.insert(taxYears).values(record).run();
  return record;
}

export function getTaxYear(year: number): TaxYearRecord | undefined {
  const db = getDb();
  return db.select().from(taxYears).where(eq(taxYears.year, year)).get();
}

export function listTaxYears(): TaxYearRecord[] {
  const db = getDb();
  return db.select().from(taxYears).orderBy(desc(taxYears.year)).all();
}

export function updateTaxYearStatus(
  year: number,
  status: TaxYearStatus,
  notes?: string | null
): void {
  const db = getDb();
  const now = nowISO();
  db.update(taxYears)
    .set({
      status,
      ...(notes !== undefined ? { notes } : {}),
      updatedAt: now,
    })
    .where(eq(taxYears.year, year))
    .run();
}

export function updateFilingStatus(
  year: number,
  filingStatus: FilingStatus
): void {
  const db = getDb();
  const now = nowISO();
  db.update(taxYears)
    .set({
      filingStatus,
      updatedAt: now,
    })
    .where(eq(taxYears.year, year))
    .run();
}

export function getFilingStatus(year: number): FilingStatus {
  const record = getTaxYear(year);
  return record?.filingStatus ?? 'single';
}
