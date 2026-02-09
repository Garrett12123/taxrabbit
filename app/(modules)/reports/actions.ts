'use server';

import { redirect } from 'next/navigation';

import { formatErrorForUser } from '@/lib/errors';
import {
  validateBackupArchive,
  restoreFromBackup,
  type RestoreValidation,
} from '@/server/services/backup-service';

export async function validateBackupAction(
  formData: FormData
): Promise<RestoreValidation> {
  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) {
    return {
      valid: false,
      errors: ['No file provided'],
      fileCount: 0,
      hasDatabase: false,
      hasVaultJson: false,
      vaultFileCount: 0,
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return validateBackupArchive(buffer);
}

export async function restoreBackupAction(
  formData: FormData
): Promise<{ error?: string }> {
  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) {
    return { error: 'No file provided' };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    await restoreFromBackup(buffer);
  } catch (err) {
    return { error: formatErrorForUser(err) };
  }

  redirect('/unlock');
}
