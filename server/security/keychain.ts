import 'server-only';

import { randomBytes } from 'node:crypto';

const SERVICE = 'com.taxrabbit.app';
const ACCOUNT = 'device-key';
const KEY_LENGTH = 32;

async function getEntry(): Promise<{
  getPassword: () => string | null;
  setPassword: (pw: string) => void;
  deletePassword: () => void;
} | null> {
  try {
    const { Entry } = await import('@napi-rs/keyring');
    const entry = new Entry(SERVICE, ACCOUNT);
    return {
      getPassword: () => {
        try {
          return entry.getPassword();
        } catch {
          return null;
        }
      },
      setPassword: (pw: string) => entry.setPassword(pw),
      deletePassword: () => {
        try {
          entry.deletePassword();
        } catch {
          // Ignore if not found
        }
      },
    };
  } catch {
    return null;
  }
}

export async function getOrCreateDeviceKey(): Promise<Buffer | null> {
  const entry = await getEntry();
  if (!entry) {
    // Keychain unavailable — return null so caller can skip device key binding
    return null;
  }

  const existing = entry.getPassword();
  if (existing) {
    return Buffer.from(existing, 'base64');
  }

  const key = randomBytes(KEY_LENGTH);
  entry.setPassword(key.toString('base64'));
  return key;
}

export async function getDeviceKey(): Promise<Buffer | null> {
  const entry = await getEntry();
  if (!entry) return null;

  const stored = entry.getPassword();
  if (!stored) return null;
  return Buffer.from(stored, 'base64');
}

export async function deleteDeviceKey(): Promise<void> {
  const entry = await getEntry();
  if (entry) {
    entry.deletePassword();
  }
}

export function combineKeys(kek: Buffer, deviceKey: Buffer): Buffer {
  if (kek.length !== KEY_LENGTH || deviceKey.length !== KEY_LENGTH) {
    throw new Error('Both keys must be 32 bytes');
  }
  const combined = Buffer.alloc(KEY_LENGTH);
  for (let i = 0; i < KEY_LENGTH; i++) {
    combined[i] = kek[i]! ^ deviceKey[i]!;
  }
  return combined;
}
