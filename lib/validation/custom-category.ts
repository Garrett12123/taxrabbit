import { z } from 'zod';

import { TAX_YEARS } from '@/lib/constants';

export const addCategorySchema = z.object({
  year: z.coerce
    .number()
    .refine(
      (val): val is (typeof TAX_YEARS)[number] =>
        (TAX_YEARS as readonly number[]).includes(val),
      'Invalid tax year'
    ),
  name: z.string().min(1).max(100),
});

export type AddCategoryInput = z.infer<typeof addCategorySchema>;
