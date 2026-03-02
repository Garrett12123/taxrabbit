import { z } from 'zod';

import { TAX_YEARS } from '@/lib/constants';

const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;

export const personProfileSchema = z.object({
  year: z.coerce
    .number()
    .refine(
      (val): val is (typeof TAX_YEARS)[number] =>
        (TAX_YEARS as readonly number[]).includes(val),
      'Invalid tax year'
    ),
  label: z.string().min(1, 'Label is required').max(100),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  ssn: z
    .string()
    .regex(ssnRegex, 'SSN must be in format XXX-XX-XXXX')
    .optional()
    .or(z.literal('')),
  dateOfBirth: z.string().max(10).optional(),
  address: z.string().max(200).optional(),
  address2: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
  zip: z.string().max(10).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
});

export type PersonProfileInput = z.infer<typeof personProfileSchema>;
