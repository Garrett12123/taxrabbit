import { z } from 'zod';

import { TAX_YEARS } from '@/lib/constants';

export const setupSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be at most 128 characters'),
    confirmPassword: z.string(),
    defaultTaxYear: z.coerce
      .number()
      .refine(
        (val): val is (typeof TAX_YEARS)[number] =>
          (TAX_YEARS as readonly number[]).includes(val),
        'Invalid tax year'
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const unlockSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export const recoveryUnlockSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  recoveryKey: z.string().min(1, 'Recovery key is required'),
});

export type SetupInput = z.infer<typeof setupSchema>;
export type UnlockInput = z.infer<typeof unlockSchema>;
export type RecoveryUnlockInput = z.infer<typeof recoveryUnlockSchema>;
