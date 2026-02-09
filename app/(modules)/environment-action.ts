'use server';

import { getVaultConfig } from '@/server/security/vault';
import { getDeviceKey } from '@/server/security/keychain';

export type EnvironmentInfo = {
  runtime: 'docker' | 'native';
  platform: string;
  encryption: 'AES-256-GCM';
  kdf: string;
  deviceKeyBound: boolean;
  secureCookies: boolean;
  nodeVersion: string;
};

export async function getEnvironmentInfo(): Promise<EnvironmentInfo> {
  const config = getVaultConfig();
  const deviceKey = await getDeviceKey();

  const isDocker =
    !!process.env.VAULT_STORAGE_DIR || !!process.env.container;

  const secureCookies =
    process.env.SECURE_COOKIES !== undefined
      ? process.env.SECURE_COOKIES !== 'false'
      : process.env.NODE_ENV === 'production';

  return {
    runtime: isDocker ? 'docker' : 'native',
    platform: process.platform,
    encryption: 'AES-256-GCM',
    kdf: config?.kdfParams.algorithm === 'argon2id' ? 'Argon2id' : 'scrypt',
    deviceKeyBound: !!deviceKey,
    secureCookies,
    nodeVersion: process.version,
  };
}
