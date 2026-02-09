import { z } from 'zod';

import { TAX_YEARS } from '@/lib/constants';

export const mileageLogSchema = z.object({
  year: z.coerce
    .number()
    .refine(
      (val): val is (typeof TAX_YEARS)[number] =>
        (TAX_YEARS as readonly number[]).includes(val),
      'Invalid tax year'
    ),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  miles: z.coerce.number().positive(),
  isRoundTrip: z.boolean().optional().default(false),
  purpose: z.string().max(200).optional(),
  destination: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
}).refine(
  (data) => data.date.startsWith(String(data.year)),
  { message: 'Trip date must be within the selected tax year', path: ['date'] }
);

export type MileageLogInput = z.infer<typeof mileageLogSchema>;
