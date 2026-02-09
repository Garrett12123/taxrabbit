import { z } from 'zod';

import { TAX_YEARS } from '@/lib/constants';

export const taxYearStatusEnum = z.enum([
  'open',
  'in_progress',
  'filed',
  'amended',
]);

export const taxYearSchema = z.object({
  year: z.coerce
    .number()
    .refine(
      (val): val is (typeof TAX_YEARS)[number] =>
        (TAX_YEARS as readonly number[]).includes(val),
      'Invalid tax year'
    ),
  status: taxYearStatusEnum.optional(),
  notes: z.string().max(500).optional(),
});

export type TaxYearInput = z.infer<typeof taxYearSchema>;
