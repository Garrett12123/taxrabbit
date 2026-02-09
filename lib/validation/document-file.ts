import { z } from 'zod';

import { TAX_YEARS } from '@/lib/constants';

export const documentFileSchema = z.object({
  year: z.coerce
    .number()
    .refine(
      (val): val is (typeof TAX_YEARS)[number] =>
        (TAX_YEARS as readonly number[]).includes(val),
      'Invalid tax year'
    ),
  originalFilename: z
    .string()
    .min(1, 'Filename is required')
    .max(255),
  mimeType: z.string().min(1).max(100),
  sizeBytes: z.coerce.number().int().min(0),
  description: z.string().max(500).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export type DocumentFileInput = z.infer<typeof documentFileSchema>;
