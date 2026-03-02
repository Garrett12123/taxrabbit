import { z } from 'zod';

import { TAX_YEARS, UTILITY_TYPES } from '@/lib/constants';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const utilityBillSchema = z.object({
  year: z.coerce
    .number()
    .refine(
      (val): val is (typeof TAX_YEARS)[number] =>
        (TAX_YEARS as readonly number[]).includes(val),
      'Invalid tax year'
    ),
  utilityType: z.enum(UTILITY_TYPES),
  billDate: z.string().regex(dateRegex, 'Date must be in format YYYY-MM-DD'),
  amount: z.coerce.number().int().min(0, 'Amount must not be negative'),
  provider: z.string().min(1, 'Provider is required').max(200),
  usage: z.coerce.number().min(0).optional(),
  usageUnit: z.string().max(50).optional(),
  consumptionCharges: z.coerce.number().int().min(0).optional(),
  otherCharges: z.coerce.number().int().min(0).optional(),
  notes: z.string().max(1000).optional(),
}).refine(
  (data) => data.billDate.startsWith(String(data.year)),
  { message: 'Bill date must be within the selected tax year', path: ['billDate'] }
);

export type UtilityBillInput = z.infer<typeof utilityBillSchema>;
