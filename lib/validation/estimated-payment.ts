import { z } from 'zod';

import { TAX_YEARS } from '@/lib/constants';

export const estimatedPaymentSchema = z.object({
  year: z.coerce
    .number()
    .refine(
      (val): val is (typeof TAX_YEARS)[number] =>
        (TAX_YEARS as readonly number[]).includes(val),
      'Invalid tax year'
    ),
  quarter: z.coerce.number().int().min(1).max(4),
  amountPaid: z.coerce.number().int().min(0),
  datePaid: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  confirmationNumber: z.string().max(100).optional(),
  paymentMethod: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

export type EstimatedPaymentInput = z.infer<typeof estimatedPaymentSchema>;

export const estimatedPaymentUpdateSchema = z.object({
  amountPaid: z.coerce.number().int().min(0).optional(),
  datePaid: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .nullable()
    .optional(),
  confirmationNumber: z.string().max(100).optional(),
  paymentMethod: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

export type EstimatedPaymentUpdateInput = z.infer<typeof estimatedPaymentUpdateSchema>;
