import { z } from 'zod';

import { TAX_YEARS } from '@/lib/constants';

const einRegex = /^\d{2}-\d{7}$/;

export const entityTypeEnum = z.enum([
  'sole_proprietorship',
  'single_member_llc',
  'multi_member_llc',
  'partnership',
  's_corporation',
  'c_corporation',
]);

export const accountingMethodEnum = z.enum(['cash', 'accrual', 'hybrid']);

export const businessProfileSchema = z.object({
  year: z.coerce
    .number()
    .refine(
      (val): val is (typeof TAX_YEARS)[number] =>
        (TAX_YEARS as readonly number[]).includes(val),
      'Invalid tax year'
    ),
  businessName: z.string().min(1, 'Business name is required').max(200),
  ein: z
    .string()
    .regex(einRegex, 'EIN must be in format XX-XXXXXXX')
    .optional()
    .or(z.literal('')),
  address: z.string().max(200).optional(),
  address2: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
  zip: z.string().max(10).optional(),
  stateOfFormation: z.string().max(50).optional(),
  entityType: entityTypeEnum.optional(),
  accountingMethod: accountingMethodEnum.optional(),
  startDate: z.string().max(10).optional(),
  notes: z.string().max(1000).optional(),
});

export type BusinessProfileInput = z.infer<typeof businessProfileSchema>;
