import { z } from 'zod';

import { TAX_YEARS } from '@/lib/constants';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const expenseSchema = z.object({
  year: z.coerce
    .number()
    .refine(
      (val): val is (typeof TAX_YEARS)[number] =>
        (TAX_YEARS as readonly number[]).includes(val),
      'Invalid tax year'
    ),
  date: z.string().regex(dateRegex, 'Date must be in format YYYY-MM-DD'),
  amount: z.coerce.number().int().min(1, 'Amount must be greater than zero'),
  category: z.string().min(1, 'Category is required').max(100),
  entityType: z.enum(['personal', 'business']).default('personal'),
  vendor: z.string().min(1, 'Vendor is required').max(200),
  description: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  paymentMethod: z.string().max(50).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  receiptRef: z.string().uuid().optional(),
}).refine(
  (data) => data.date.startsWith(String(data.year)),
  { message: 'Expense date must be within the selected tax year', path: ['date'] }
);

export type ExpenseInput = z.infer<typeof expenseSchema>;
