import { z } from 'zod';

import { TAX_YEARS } from '@/lib/constants';

export const checklistItemSchema = z.object({
  year: z.coerce
    .number()
    .refine(
      (val): val is (typeof TAX_YEARS)[number] =>
        (TAX_YEARS as readonly number[]).includes(val),
      'Invalid tax year'
    ),
  title: z.string().min(1, 'Title is required').max(200),
  completed: z.coerce.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).default(0),
  content: z.string().max(2000).optional(),
  notes: z.string().max(1000).optional(),
});

export type ChecklistItemInput = z.infer<typeof checklistItemSchema>;
