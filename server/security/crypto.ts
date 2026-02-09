import 'server-only';

import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';

import { CryptoError } from '@/lib/errors';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function assertKeyLength(key: Buffer): void {
  if (key.length !== KEY_LENGTH) {
    throw new CryptoError(`Invalid key length: expected ${KEY_LENGTH} bytes`);
  }
}

export function generateKey(): Buffer {
  return randomBytes(KEY_LENGTH);
}

export function encryptBuffer(plaintext: Buffer, key: Buffer): string {
  assertKeyLength(key);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Format: base64(iv + authTag + ciphertext)
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

export function decryptBuffer(encoded: string, key: Buffer): Buffer {
  assertKeyLength(key);
  try {
    const data = Buffer.from(encoded, 'base64');
    if (data.length < IV_LENGTH + AUTH_TAG_LENGTH) {
      throw new CryptoError('Decryption failed');
    }
    const iv = data.subarray(0, IV_LENGTH);
    const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    throw new CryptoError('Decryption failed');
  }
}

export function encryptJSON(data: unknown, key: Buffer): string {
  const json = JSON.stringify(data);
  return encryptBuffer(Buffer.from(json, 'utf-8'), key);
}

export function decryptJSON<T>(encrypted: string, key: Buffer): T {
  const buf = decryptBuffer(encrypted, key);
  try {
    return JSON.parse(buf.toString('utf-8')) as T;
  } catch {
    throw new CryptoError('Decryption failed');
  }
}

export function encryptFile(plaintext: Buffer, key: Buffer): Buffer {
  assertKeyLength(key);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]);
}

export function decryptFile(encrypted: Buffer, key: Buffer): Buffer {
  assertKeyLength(key);
  try {
    if (encrypted.length < IV_LENGTH + AUTH_TAG_LENGTH) {
      throw new CryptoError('Decryption failed');
    }
    const iv = encrypted.subarray(0, IV_LENGTH);
    const authTag = encrypted.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = encrypted.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    throw new CryptoError('Decryption failed');
  }
}

export function zeroBuffer(buf: Buffer): void {
  buf.fill(0);
}
