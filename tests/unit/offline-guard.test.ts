import { describe, it, expect, beforeAll } from 'vitest';

import { installOfflineGuard } from '@/lib/offline-guard';

describe('offline-guard', () => {
  beforeAll(() => {
    installOfflineGuard();
  });

  it('blocks http://example.com', () => {
    expect(() => {
      globalThis.fetch('http://example.com');
    }).toThrow('[offline-guard] External network request blocked');
  });

  it('blocks https://api.example.com', () => {
    expect(() => {
      globalThis.fetch('https://api.example.com/data');
    }).toThrow('[offline-guard] External network request blocked');
  });

  it('allows http://localhost:3000', () => {
    // The guard should not throw — it passes through to real fetch
    // which will reject with a network error, not an offline-guard error
    const result = globalThis.fetch('http://localhost:3000/__offline_guard_test__');
    // If we got here without a synchronous throw, the guard allowed it
    // Catch the network error from the actual fetch
    result.catch(() => {});
    expect(true).toBe(true);
  });

  it('allows http://127.0.0.1:3000', () => {
    const result = globalThis.fetch('http://127.0.0.1:3000/__offline_guard_test__');
    result.catch(() => {});
    expect(true).toBe(true);
  });

  it('allows relative URLs (/api/local)', () => {
    // Relative URLs don't start with http:// or https://, so they pass the guard
    const result = globalThis.fetch('/api/local');
    result.catch(() => {});
    expect(true).toBe(true);
  });
});
