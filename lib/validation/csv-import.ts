import { z } from 'zod';

import { parseDollarsToCents } from '@/lib/utils';
import type { ColumnMapping, MileageColumnMapping } from '@/lib/csv/column-mapping';

// Accepts YYYY-MM-DD, MM/DD/YYYY, M/D/YYYY, MM-DD-YYYY — normalizes to YYYY-MM-DD
export const csvDateSchema = z.string().transform((val, ctx) => {
  const trimmed = val.trim();

  // YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    if (isValidDate(Number(y), Number(m), Number(d))) return trimmed;
  }

  // MM/DD/YYYY or M/D/YYYY
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, m, d, y] = slashMatch;
    if (isValidDate(Number(y), Number(m), Number(d))) {
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }

  // MM-DD-YYYY
  const dashMatch = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dashMatch) {
    const [, m, d, y] = dashMatch;
    if (isValidDate(Number(y), Number(m), Number(d))) {
      return `${y}-${m}-${d}`;
    }
  }

  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: 'Invalid date format. Use YYYY-MM-DD, MM/DD/YYYY, or MM-DD-YYYY.',
  });
  return z.NEVER;
});

function isValidDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
}

// Accepts dollar strings like $1,234.56 or -$50.00 or ($50.00), converts to cents integer.
// Negative amounts (common in bank/credit card exports) are converted to their absolute value.
export const csvAmountSchema = z.string().transform((val, ctx) => {
  const cents = parseDollarsToCents(val);
  if (cents === null || cents === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Amount must be a non-zero dollar value.',
    });
    return z.NEVER;
  }
  // Use absolute value — bank exports often represent charges as negative
  return Math.abs(cents);
});

const csvRowSchema = z.object({
  date: csvDateSchema,
  vendor: z
    .string()
    .transform((v) => v.trim())
    .pipe(z.string().min(1, 'Vendor is required').max(200)),
  amount: csvAmountSchema,
  category: z
    .string()
    .transform((v) => v.trim())
    .pipe(z.string().max(100))
    .optional()
    .default('Other'),
  description: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  entityType: z
    .string()
    .transform((v) => {
      const lower = v.trim().toLowerCase();
      if (lower === 'business' || lower === 'llc' || lower === 'business / llc')
        return 'business' as const;
      return 'personal' as const;
    })
    .optional()
    .default('personal'),
  paymentMethod: z.string().max(50).optional(),
});

export type CsvRowParsed = {
  date: string;
  vendor: string;
  amount: number;
  category: string;
  entityType: 'personal' | 'business';
  description?: string;
  notes?: string;
  paymentMethod?: string;
};

export type RowValidationResult = {
  rowIndex: number;
  status: 'valid' | 'error';
  data?: CsvRowParsed;
  errors?: { field: string; message: string }[];
};

export type ImportDefaults = {
  year: number;
  category?: string;
  entityType?: 'personal' | 'business';
};

export function validateCsvRows(
  rawRows: string[][],
  mappings: ColumnMapping[],
  defaults: ImportDefaults
): RowValidationResult[] {
  return rawRows.map((rawRow, idx) => {
    // Apply mappings to build row object
    const obj: Record<string, string> = {};
    for (const mapping of mappings) {
      if (mapping.target === 'skip') continue;
      const value = rawRow[mapping.csvIndex] ?? '';
      obj[mapping.target] = value;
    }

    // Apply defaults for unmapped fields
    if (!obj.category && defaults.category) {
      obj.category = defaults.category;
    }
    if (!obj.entityType && defaults.entityType) {
      obj.entityType = defaults.entityType;
    }

    const result = csvRowSchema.safeParse(obj);

    if (result.success) {
      // Validate that the date year matches the import year
      const dateYear = result.data.date.substring(0, 4);
      if (dateYear !== String(defaults.year)) {
        return {
          rowIndex: idx,
          status: 'error' as const,
          errors: [{
            field: 'date',
            message: `Date ${result.data.date} does not match import year ${defaults.year}.`,
          }],
        };
      }

      return {
        rowIndex: idx,
        status: 'valid' as const,
        data: result.data as CsvRowParsed,
      };
    }

    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || 'unknown',
      message: issue.message,
    }));

    return {
      rowIndex: idx,
      status: 'error' as const,
      errors,
    };
  });
}

// ─── Mileage CSV Import ───────────────────────────────────────

// Accepts decimal miles like 24.5, converts to miles * 100 for storage
export const csvMilesSchema = z.string().transform((val, ctx) => {
  const trimmed = val.trim().replace(/,/g, '');
  const num = parseFloat(trimmed);
  if (isNaN(num) || num <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Miles must be a positive number.',
    });
    return z.NEVER;
  }
  // Store as miles * 100 for precision (e.g., 24.5 miles = 2450)
  return Math.round(num * 100);
});

const mileageRowSchema = z.object({
  date: csvDateSchema,
  miles: csvMilesSchema,
  purpose: z.string().max(200).optional(),
  destination: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
  isRoundTrip: z
    .string()
    .optional()
    .default('false')
    .transform((v) => {
      const lower = v.trim().toLowerCase();
      return lower === 'true' || lower === 'yes' || lower === '1' || lower === 'round trip';
    }),
});

export type MileageRowParsed = {
  date: string;
  miles: number; // miles * 100
  isRoundTrip: boolean;
  purpose?: string;
  destination?: string;
  notes?: string;
};

export type MileageRowValidationResult = {
  rowIndex: number;
  status: 'valid' | 'error';
  data?: MileageRowParsed;
  errors?: { field: string; message: string }[];
};

export type MileageImportDefaults = {
  year: number;
};

export function validateMileageCsvRows(
  rawRows: string[][],
  mappings: MileageColumnMapping[],
  defaults: MileageImportDefaults
): MileageRowValidationResult[] {
  return rawRows.map((rawRow, idx) => {
    const obj: Record<string, string> = {};
    for (const mapping of mappings) {
      if (mapping.target === 'skip') continue;
      const value = rawRow[mapping.csvIndex] ?? '';
      obj[mapping.target] = value;
    }

    const result = mileageRowSchema.safeParse(obj);

    if (result.success) {
      // Validate that the date year matches the import year
      const dateYear = result.data.date.substring(0, 4);
      if (dateYear !== String(defaults.year)) {
        return {
          rowIndex: idx,
          status: 'error' as const,
          errors: [{
            field: 'date',
            message: `Date ${result.data.date} does not match import year ${defaults.year}.`,
          }],
        };
      }

      return {
        rowIndex: idx,
        status: 'valid' as const,
        data: {
          ...result.data,
          isRoundTrip: result.data.isRoundTrip,
        } as MileageRowParsed,
      };
    }

    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || 'unknown',
      message: issue.message,
    }));

    return {
      rowIndex: idx,
      status: 'error' as const,
      errors,
    };
  });
}
