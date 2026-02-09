import { vi } from 'vitest';

// Mock server-only module (it throws when imported outside server context)
vi.mock('server-only', () => ({}));

// Mock next/headers cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    })
  ),
}));
