import { z } from 'zod';

import { TAX_YEARS } from '@/lib/constants';

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be at most 128 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const LOCK_TIMEOUT_OPTIONS = [5, 15, 30, 60, 120] as const;

export const lockTimeoutSchema = z.object({
  lockTimeoutMinutes: z.coerce
    .number()
    .refine(
      (val): val is (typeof LOCK_TIMEOUT_OPTIONS)[number] =>
        (LOCK_TIMEOUT_OPTIONS as readonly number[]).includes(val),
      'Invalid lock timeout value'
    ),
});

export type LockTimeoutInput = z.infer<typeof lockTimeoutSchema>;

export const defaultYearSchema = z.object({
  defaultTaxYear: z.coerce
    .number()
    .refine(
      (val): val is (typeof TAX_YEARS)[number] =>
        (TAX_YEARS as readonly number[]).includes(val),
      'Invalid tax year'
    ),
});

export type DefaultYearInput = z.infer<typeof defaultYearSchema>;
