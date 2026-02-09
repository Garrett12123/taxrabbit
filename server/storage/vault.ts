import 'server-only';

import { mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

import { encryptFile, decryptFile, zeroBuffer } from '@/server/security/crypto';

export const VAULT_DIR = process.env.VAULT_STORAGE_DIR
  ? join(process.env.VAULT_STORAGE_DIR)
  : join(homedir(), 'Library', 'Application Support', 'taxrabbit', 'vault');

export function ensureVaultDir(): void {
  mkdirSync(VAULT_DIR, { recursive: true });
}

/**
 * Encrypts and writes a file to the vault directory.
 * WARNING: Zeroes the `plaintext` buffer after encryption for security.
 * The caller must not reuse the buffer after this call.
 */
export function writeVaultFile(
  id: string,
  plaintext: Buffer,
  key: Buffer
): string {
  ensureVaultDir();
  const encrypted = encryptFile(plaintext, key);
  const storagePath = join(VAULT_DIR, id);
  writeFileSync(storagePath, encrypted);
  zeroBuffer(plaintext);
  return storagePath;
}

export function readVaultFile(id: string, key: Buffer): Buffer {
  const storagePath = join(VAULT_DIR, id);
  const encrypted = readFileSync(storagePath);
  return decryptFile(encrypted, key);
}

export function deleteVaultFile(id: string): void {
  const storagePath = join(VAULT_DIR, id);
  try {
    unlinkSync(storagePath);
  } catch {
    // File may already be deleted
  }
}
