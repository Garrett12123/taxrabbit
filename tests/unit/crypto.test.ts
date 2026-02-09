import { describe, it, expect } from 'vitest';

import {
  generateKey,
  encryptBuffer,
  decryptBuffer,
  encryptJSON,
  decryptJSON,
  encryptFile,
  decryptFile,
} from '@/server/security/crypto';

describe('generateKey', () => {
  it('returns a 32-byte buffer', () => {
    const key = generateKey();
    expect(Buffer.isBuffer(key)).toBe(true);
    expect(key.length).toBe(32);
  });

  it('produces unique keys', () => {
    const key1 = generateKey();
    const key2 = generateKey();
    expect(key1.equals(key2)).toBe(false);
  });
});

describe('encryptBuffer / decryptBuffer', () => {
  it('roundtrips correctly', () => {
    const key = generateKey();
    const plaintext = Buffer.from('hello world', 'utf-8');
    const encrypted = encryptBuffer(plaintext, key);
    const decrypted = decryptBuffer(encrypted, key);
    expect(decrypted.toString('utf-8')).toBe('hello world');
  });

  it('same plaintext produces different ciphertexts (unique nonces)', () => {
    const key = generateKey();
    const plaintext = Buffer.from('same data', 'utf-8');
    const enc1 = encryptBuffer(plaintext, key);
    const enc2 = encryptBuffer(plaintext, key);
    expect(enc1).not.toBe(enc2);
  });

  it('wrong key fails decryption', () => {
    const key1 = generateKey();
    const key2 = generateKey();
    const plaintext = Buffer.from('secret', 'utf-8');
    const encrypted = encryptBuffer(plaintext, key1);
    expect(() => decryptBuffer(encrypted, key2)).toThrow('Decryption failed');
  });

  it('invalid key length throws', () => {
    const shortKey = Buffer.alloc(16);
    const plaintext = Buffer.from('test', 'utf-8');
    expect(() => encryptBuffer(plaintext, shortKey)).toThrow(
      'Invalid key length'
    );
  });
});

describe('encryptJSON / decryptJSON', () => {
  it('roundtrips with nested objects', () => {
    const key = generateKey();
    const data = {
      name: 'John Doe',
      details: {
        ssn: '123-45-6789',
        income: [1000, 2000, 3000],
      },
      active: true,
    };

    const encrypted = encryptJSON(data, key);
    const decrypted = decryptJSON<typeof data>(encrypted, key);
    expect(decrypted).toEqual(data);
  });
});

describe('encryptFile / decryptFile', () => {
  it('roundtrips correctly', () => {
    const key = generateKey();
    const plaintext = Buffer.from('file content here', 'utf-8');
    const encrypted = encryptFile(plaintext, key);
    const decrypted = decryptFile(encrypted, key);
    expect(decrypted.toString('utf-8')).toBe('file content here');
  });

  it('handles large files (1MB)', () => {
    const key = generateKey();
    const plaintext = Buffer.alloc(1024 * 1024, 0xab);
    const encrypted = encryptFile(plaintext, key);
    const decrypted = decryptFile(encrypted, key);
    expect(decrypted.equals(plaintext)).toBe(true);
  });
});
