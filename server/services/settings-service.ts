import 'server-only';

import {
  getVaultConfig,
  updateVaultConfig,
} from '@/server/security/vault';
import {
  deriveKey,
  type KdfParams,
} from '@/server/security/kdf';
import { getDeviceKey, combineKeys } from '@/server/security/keychain';
import {
  encryptBuffer,
  decryptBuffer,
  zeroBuffer,
} from '@/server/security/crypto';
import { updateSessionTimeout } from '@/server/security/session';
import { logSecurityEvent } from '@/server/security/audit-log';
import { VaultError } from '@/lib/errors';

export type SettingsData = {
  lockTimeoutMinutes: number;
  defaultTaxYear: number;
  deviceKeyEnabled: boolean;
};

export async function getSettings(): Promise<SettingsData> {
  const config = getVaultConfig();
  if (!config) {
    throw new VaultError('Vault is not configured');
  }

  return {
    lockTimeoutMinutes: config.lockTimeoutMinutes ?? 30,
    defaultTaxYear: config.defaultTaxYear,
    deviceKeyEnabled: config.deviceKeyEnabled,
  };
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const config = getVaultConfig();
  if (!config) {
    throw new VaultError('Vault is not configured');
  }

  // Verify current password by unwrapping DEK
  const oldKek = await deriveKey(currentPassword, config.kdfParams);

  let oldWrappingKey: Buffer;
  if (config.deviceKeyEnabled) {
    const deviceKey = await getDeviceKey();
    if (deviceKey) {
      oldWrappingKey = combineKeys(oldKek, deviceKey);
      zeroBuffer(deviceKey);
    } else {
      // Must copy to avoid aliasing: zeroBuffer(oldKek) would also zero wrappingKey
      oldWrappingKey = Buffer.from(oldKek);
    }
  } else {
    // Must copy to avoid aliasing: zeroBuffer(oldKek) would also zero wrappingKey
    oldWrappingKey = Buffer.from(oldKek);
  }
  zeroBuffer(oldKek);

  let dek: Buffer;
  try {
    dek = decryptBuffer(config.wrappedDek, oldWrappingKey);
  } catch {
    zeroBuffer(oldWrappingKey);
    throw new VaultError('Current password is incorrect');
  }
  zeroBuffer(oldWrappingKey);

  // Derive new KEK with new salt but same algorithm
  const { getDefaultKdfParams, getScryptFallbackParams } = await import(
    '@/server/security/kdf'
  );

  let newKdfParams: KdfParams;
  let newKek: Buffer;
  try {
    newKdfParams = getDefaultKdfParams();
    newKek = await deriveKey(newPassword, newKdfParams);
  } catch {
    newKdfParams = getScryptFallbackParams();
    newKek = await deriveKey(newPassword, newKdfParams);
  }

  // Re-wrap DEK with new KEK (+ device key if enabled)
  let newWrappingKey: Buffer;
  if (config.deviceKeyEnabled) {
    const deviceKey = await getDeviceKey();
    if (deviceKey) {
      newWrappingKey = combineKeys(newKek, deviceKey);
      zeroBuffer(deviceKey);
    } else {
      // Must copy to avoid aliasing: zeroBuffer(newKek) would also zero wrappingKey
      newWrappingKey = Buffer.from(newKek);
    }
  } else {
    // Must copy to avoid aliasing: zeroBuffer(newKek) would also zero wrappingKey
    newWrappingKey = Buffer.from(newKek);
  }
  zeroBuffer(newKek);

  const newWrappedDek = encryptBuffer(dek, newWrappingKey);
  zeroBuffer(dek);
  zeroBuffer(newWrappingKey);

  // Update vault config with new wrappedDek and kdfParams
  updateVaultConfig({
    kdfParams: newKdfParams,
    wrappedDek: newWrappedDek,
  });

  logSecurityEvent('password_changed');
}

export async function revealRecoveryKey(password: string): Promise<string> {
  const config = getVaultConfig();
  if (!config) {
    throw new VaultError('Vault is not configured');
  }
  if (!config.deviceKeyEnabled) {
    throw new VaultError('Device key is not enabled — no recovery key exists.');
  }

  // Verify password by attempting to unwrap DEK
  const kek = await deriveKey(password, config.kdfParams);
  const deviceKey = await getDeviceKey();
  if (!deviceKey) {
    zeroBuffer(kek);
    throw new VaultError(
      'Device key not found in Keychain. You may need to use your recovery key to unlock instead.'
    );
  }

  const wrappingKey = combineKeys(kek, deviceKey);
  zeroBuffer(kek);

  try {
    const dek = decryptBuffer(config.wrappedDek, wrappingKey);
    zeroBuffer(dek);
  } catch {
    zeroBuffer(wrappingKey);
    zeroBuffer(deviceKey);
    throw new VaultError('Incorrect password');
  }
  zeroBuffer(wrappingKey);

  // Password verified — return device key as recovery key
  const recoveryKey = deviceKey.toString('base64');
  zeroBuffer(deviceKey);
  return recoveryKey;
}

export async function updateLockTimeout(minutes: number): Promise<void> {
  updateVaultConfig({ lockTimeoutMinutes: minutes });
  await updateSessionTimeout(minutes * 60 * 1000);
}

export function updateDefaultYear(year: number): void {
  updateVaultConfig({ defaultTaxYear: year });
}

/** Returns the user's configured default tax year, or the constant fallback. */
export function getDefaultTaxYear(): number {
  const config = getVaultConfig();
  return config?.defaultTaxYear ?? new Date().getFullYear();
}
