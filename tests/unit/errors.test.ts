import { describe, it, expect } from 'vitest';

import {
  formatZodErrors,
  formatErrorForUser,
  AppError,
  VaultError,
  CryptoError,
  DatabaseError,
  ValidationError,
} from '@/lib/errors';

describe('formatZodErrors', () => {
  it('formats a single error with path', () => {
    const result = formatZodErrors({
      issues: [{ path: ['name'], message: 'Required' }],
    });
    expect(result).toBe('name: Required');
  });

  it('formats multiple errors', () => {
    const result = formatZodErrors({
      issues: [
        { path: ['name'], message: 'Required' },
        { path: ['age'], message: 'Must be a number' },
      ],
    });
    expect(result).toBe('name: Required; age: Must be a number');
  });

  it('handles nested paths', () => {
    const result = formatZodErrors({
      issues: [{ path: ['address', 'zip'], message: 'Invalid' }],
    });
    expect(result).toBe('address.zip: Invalid');
  });

  it('handles empty path', () => {
    const result = formatZodErrors({
      issues: [{ path: [], message: 'Global error' }],
    });
    expect(result).toBe('Global error');
  });

  it('handles empty issues array', () => {
    const result = formatZodErrors({ issues: [] });
    expect(result).toBe('');
  });
});

describe('formatErrorForUser', () => {
  it('returns message for AppError', () => {
    expect(formatErrorForUser(new AppError('Custom error'))).toBe('Custom error');
  });

  it('returns message for VaultError', () => {
    expect(formatErrorForUser(new VaultError('Vault issue'))).toBe('Vault issue');
  });

  it('returns user-friendly message for CryptoError', () => {
    expect(formatErrorForUser(new CryptoError('Crypto fail'))).toBe(
      'Failed to decrypt data. The vault may be corrupted.'
    );
  });

  it('returns user-friendly message for DatabaseError', () => {
    expect(formatErrorForUser(new DatabaseError('DB fail'))).toBe(
      'A database error occurred. Please try again.'
    );
  });

  it('returns message for ValidationError', () => {
    expect(formatErrorForUser(new ValidationError('Bad input'))).toBe('Bad input');
  });

  it('maps "Vault is locked" to user-friendly message', () => {
    expect(formatErrorForUser(new Error('Vault is locked'))).toBe(
      'Your vault is locked. Please unlock it to continue.'
    );
  });

  it('maps "Incorrect password" to user-friendly message', () => {
    expect(formatErrorForUser(new Error('Incorrect password'))).toBe(
      'The password you entered is incorrect.'
    );
  });

  it('maps decryption errors to user-friendly message', () => {
    expect(formatErrorForUser(new Error('Decryption failed: bad tag'))).toBe(
      'Failed to decrypt data. The vault may be corrupted.'
    );
  });

  it('returns message for generic Error', () => {
    expect(formatErrorForUser(new Error('Something broke'))).toBe('Something broke');
  });

  it('returns default for non-Error', () => {
    expect(formatErrorForUser('string error')).toBe(
      'An unexpected error occurred. Please try again.'
    );
  });

  it('returns default for null', () => {
    expect(formatErrorForUser(null)).toBe(
      'An unexpected error occurred. Please try again.'
    );
  });
});
