import { z } from 'zod';

import { TAX_YEARS, INCOME_FORM_TYPES } from '@/lib/constants';

export const incomeDocumentSchema = z.object({
  year: z.coerce
    .number()
    .refine(
      (val): val is (typeof TAX_YEARS)[number] =>
        (TAX_YEARS as readonly number[]).includes(val),
      'Invalid tax year'
    ),
  formType: z
    .string()
    .refine(
      (val): val is (typeof INCOME_FORM_TYPES)[number] =>
        (INCOME_FORM_TYPES as readonly string[]).includes(val),
      'Invalid form type'
    ),
  entityType: z.enum(['personal', 'business']).default('personal'),
  amount: z.coerce.number().int().min(0, 'Amount must be non-negative'),
  fedWithholding: z.coerce
    .number()
    .int()
    .min(0, 'Withholding must be non-negative')
    .default(0),
  issuerName: z.string().min(1, 'Issuer name is required').max(200),
  issuerEin: z.string().max(20).optional(),
  recipientProfileId: z.string().uuid().optional(),
  boxes: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])).optional(),
  stateWages: z.coerce.number().int().min(0).optional(),
  stateWithholding: z.coerce.number().int().min(0).optional(),
  localWages: z.coerce.number().int().min(0).optional(),
  localWithholding: z.coerce.number().int().min(0).optional(),
  notes: z.string().max(1000).optional(),
});

export type IncomeDocumentInput = z.infer<typeof incomeDocumentSchema>;
