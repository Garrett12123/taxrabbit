import 'server-only';

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash, timingSafeEqual } from 'node:crypto';

import { generateKey, encryptBuffer, decryptBuffer, zeroBuffer } from './crypto';
import {
  deriveKey,
  getDefaultKdfParams,
  getScryptFallbackParams,
  type KdfParams,
} from './kdf';
import { getOrCreateDeviceKey, getDeviceKey, combineKeys } from './keychain';
import { createSession, destroySession } from './session';
import { checkUnlockRateLimit, recordFailedAttempt, resetUnlockRateLimit } from './rate-limit';
import { logSecurityEvent } from './audit-log';
import { getDb } from '@/server/db';
import { ensureTaxYear } from '@/server/db/dal/tax-years';
import { VaultError } from '@/lib/errors';

const DATA_DIR = join(process.cwd(), 'data');
const VAULT_PATH = join(DATA_DIR, 'vault.json');

export type VaultConfig = {
  version: 1;
  createdAt: string;
  kdfParams: KdfParams;
  wrappedDek: string;
  deviceKeyEnabled: boolean;
  defaultTaxYear: number;
  lockTimeoutMinutes?: number;
  recoveryKeyHash?: string; // SHA-256 hash of recovery key for verification
};

export function isVaultConfigured(): boolean {
  return existsSync(VAULT_PATH);
}

export function getVaultConfig(): VaultConfig | null {
  if (!existsSync(VAULT_PATH)) return null;
  const raw = readFileSync(VAULT_PATH, 'utf-8');
  return JSON.parse(raw) as VaultConfig;
}

export function updateVaultConfig(
  partial: Partial<Omit<VaultConfig, 'version' | 'createdAt'>>
): void {
  const config = getVaultConfig();
  if (!config) {
    throw new VaultError('Vault is not configured');
  }

  const updated = { ...config, ...partial };
  writeFileSync(VAULT_PATH, JSON.stringify(updated, null, 2), 'utf-8');
}

export async function setupVault(
  password: string,
  defaultTaxYear: number
): Promise<{ recoveryKey?: string }> {
  // Determine KDF params — try argon2id, fall back to scrypt
  let kdfParams: KdfParams;
  let kek: Buffer;
  try {
    kdfParams = getDefaultKdfParams();
    kek = await deriveKey(password, kdfParams);
  } catch {
    kdfParams = getScryptFallbackParams();
    kek = await deriveKey(password, kdfParams);
  }

  // Device key from macOS Keychain
  let wrappingKey: Buffer;
  let deviceKeyEnabled = false;
  let recoveryKey: string | undefined;
  let recoveryKeyHash: string | undefined;
  const deviceKey = await getOrCreateDeviceKey();
  if (deviceKey) {
    wrappingKey = combineKeys(kek, deviceKey);
    deviceKeyEnabled = true;
    // Generate recovery key so user can recover if device key is lost
    recoveryKey = deviceKey.toString('base64');
    recoveryKeyHash = createHash('sha256').update(recoveryKey).digest('hex');
    zeroBuffer(deviceKey);
  } else {
    // Keychain unavailable — use KEK alone (no device binding)
    // Must copy to avoid aliasing: zeroBuffer(kek) would also zero wrappingKey
    wrappingKey = Buffer.from(kek);
  }
  zeroBuffer(kek);

  // Generate and wrap DEK
  const dek = generateKey();
  const wrappedDek = encryptBuffer(dek, wrappingKey);
  zeroBuffer(wrappingKey);

  // Write vault config
  const config: VaultConfig = {
    version: 1,
    createdAt: new Date().toISOString(),
    kdfParams,
    wrappedDek,
    deviceKeyEnabled,
    defaultTaxYear,
    recoveryKeyHash,
  };

  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(VAULT_PATH, JSON.stringify(config, null, 2), 'utf-8');

  // Create session with the DEK
  await createSession(dek);
  zeroBuffer(dek);

  // Initialize database and create default tax year
  getDb();
  ensureTaxYear(defaultTaxYear);

  logSecurityEvent('vault_setup');

  return { recoveryKey };
}

export async function unlockVault(password: string): Promise<void> {
  // Rate limit check — throws if locked out
  try {
    checkUnlockRateLimit();
  } catch (err) {
    logSecurityEvent('unlock_rate_limited');
    throw err;
  }

  const config = getVaultConfig();
  if (!config) {
    throw new VaultError('Vault is not configured');
  }

  const kek = await deriveKey(password, config.kdfParams);

  let wrappingKey: Buffer;
  if (config.deviceKeyEnabled) {
    const deviceKey = await getDeviceKey();
    if (deviceKey) {
      wrappingKey = combineKeys(kek, deviceKey);
      zeroBuffer(deviceKey);
    } else {
      // Device key was enabled but is now missing — cannot decrypt with KEK alone
      zeroBuffer(kek);
      logSecurityEvent('device_key_missing');
      throw new VaultError(
        'Device key is missing from Keychain. Use your recovery key to unlock.'
      );
    }
  } else {
    // Must copy to avoid aliasing: zeroBuffer(kek) would also zero wrappingKey
    wrappingKey = Buffer.from(kek);
  }
  zeroBuffer(kek);

  let dek: Buffer;
  try {
    dek = decryptBuffer(config.wrappedDek, wrappingKey);
  } catch {
    zeroBuffer(wrappingKey);
    recordFailedAttempt();
    logSecurityEvent('unlock_failed');
    throw new VaultError('Incorrect password');
  }
  zeroBuffer(wrappingKey);

  // Successful unlock — reset rate limiter
  resetUnlockRateLimit();
  logSecurityEvent('unlock_success');

  const timeoutMs = (config.lockTimeoutMinutes ?? 30) * 60 * 1000;
  await createSession(dek, timeoutMs);
  zeroBuffer(dek);
}

export async function unlockWithRecoveryKey(
  password: string,
  recoveryKeyBase64: string
): Promise<void> {
  try {
    checkUnlockRateLimit();
  } catch (err) {
    logSecurityEvent('unlock_rate_limited');
    throw err;
  }

  const config = getVaultConfig();
  if (!config) {
    throw new VaultError('Vault is not configured');
  }

  if (!config.deviceKeyEnabled) {
    throw new VaultError('Recovery key is not applicable — device key was not enabled.');
  }

  // Verify recovery key hash if stored (using timing-safe comparison)
  if (config.recoveryKeyHash) {
    const providedHash = createHash('sha256').update(recoveryKeyBase64.trim()).digest();
    const storedHash = Buffer.from(config.recoveryKeyHash, 'hex');
    if (
      providedHash.length !== storedHash.length ||
      !timingSafeEqual(providedHash, storedHash)
    ) {
      recordFailedAttempt();
      logSecurityEvent('recovery_key_failed');
      throw new VaultError('Invalid recovery key');
    }
  }

  const kek = await deriveKey(password, config.kdfParams);
  const recoveryDeviceKey = Buffer.from(recoveryKeyBase64.trim(), 'base64');

  if (recoveryDeviceKey.length !== 32) {
    zeroBuffer(kek);
    recordFailedAttempt();
    logSecurityEvent('recovery_key_failed');
    throw new VaultError('Invalid recovery key format');
  }

  const wrappingKey = combineKeys(kek, recoveryDeviceKey);
  zeroBuffer(kek);
  zeroBuffer(recoveryDeviceKey);

  let dek: Buffer;
  try {
    dek = decryptBuffer(config.wrappedDek, wrappingKey);
  } catch {
    zeroBuffer(wrappingKey);
    recordFailedAttempt();
    logSecurityEvent('recovery_unlock_failed');
    throw new VaultError('Recovery failed — incorrect password or recovery key');
  }
  zeroBuffer(wrappingKey);

  resetUnlockRateLimit();
  logSecurityEvent('recovery_unlock_success');

  const timeoutMs = (config.lockTimeoutMinutes ?? 30) * 60 * 1000;
  await createSession(dek, timeoutMs);
  zeroBuffer(dek);
}

export async function lockVault(): Promise<void> {
  await destroySession();
  logSecurityEvent('lock');
}
