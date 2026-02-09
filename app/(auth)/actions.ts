'use server';

import { redirect } from 'next/navigation';

import { setupSchema, unlockSchema, recoveryUnlockSchema } from '@/lib/validation/auth';
import { setupVault, unlockVault, unlockWithRecoveryKey, lockVault } from '@/server/security/vault';

export type ActionResult = {
  success?: boolean;
  error?: string;
  recoveryKey?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function setupAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = setupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const { recoveryKey } = await setupVault(parsed.data.password, parsed.data.defaultTaxYear);
    if (recoveryKey) {
      // Return recovery key for user to save before redirecting
      return { success: true, recoveryKey };
    }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Failed to set up vault',
    };
  }

  redirect('/overview');
}

export async function unlockAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = unlockSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let shouldRedirect = false;
  try {
    await unlockVault(parsed.data.password);
    shouldRedirect = true;
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Failed to unlock vault',
    };
  }

  if (shouldRedirect) {
    redirect('/overview');
  }

  // Note: redirect() above throws, so this line is only reached if shouldRedirect is false
  return { success: true };
}

export async function recoveryUnlockAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = recoveryUnlockSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let shouldRedirect = false;
  try {
    await unlockWithRecoveryKey(parsed.data.password, parsed.data.recoveryKey);
    shouldRedirect = true;
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Recovery failed',
    };
  }

  if (shouldRedirect) {
    redirect('/overview');
  }

  // Note: redirect() above throws, so this line is only reached if shouldRedirect is false
  return { success: true };
}

export async function lockAction(): Promise<void> {
  await lockVault();
  redirect('/unlock');
}
