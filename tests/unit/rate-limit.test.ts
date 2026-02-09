import { describe, it, expect, beforeEach } from 'vitest';

import {
  checkUnlockRateLimit,
  recordFailedAttempt,
  resetUnlockRateLimit,
} from '@/server/security/rate-limit';

describe('rate-limit', () => {
  beforeEach(() => {
    resetUnlockRateLimit();
  });

  it('allows initial attempts', () => {
    expect(() => checkUnlockRateLimit()).not.toThrow();
  });

  it('allows up to 4 failed attempts without lockout', () => {
    for (let i = 0; i < 4; i++) {
      recordFailedAttempt();
    }
    expect(() => checkUnlockRateLimit()).not.toThrow();
  });

  it('locks out after 5 failed attempts', () => {
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt();
    }
    expect(() => checkUnlockRateLimit()).toThrow(/Too many failed attempts/);
  });

  it('resets after successful unlock', () => {
    for (let i = 0; i < 4; i++) {
      recordFailedAttempt();
    }
    resetUnlockRateLimit();
    expect(() => checkUnlockRateLimit()).not.toThrow();
  });

  it('includes remaining seconds in error message', () => {
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt();
    }
    try {
      checkUnlockRateLimit();
    } catch (err) {
      expect((err as Error).message).toMatch(/\d+ seconds/);
    }
  });
});
