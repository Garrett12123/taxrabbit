import 'server-only';

const MAX_ATTEMPTS = 5;
const BASE_LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes
const MAX_LOCKOUT_MS = 60 * 60 * 1000; // 1 hour maximum lockout

type AttemptRecord = {
  count: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
  lockoutCount: number; // tracks consecutive lockouts for exponential backoff
};

// In-memory store — resets on server restart (acceptable for local-first app)
let record: AttemptRecord = {
  count: 0,
  firstAttemptAt: 0,
  lockedUntil: null,
  lockoutCount: 0,
};

/**
 * Check if unlock attempts are currently rate-limited.
 * Throws if the user is locked out.
 */
export function checkUnlockRateLimit(): void {
  const now = Date.now();

  // If locked out, check if lockout has expired
  if (record.lockedUntil) {
    if (now < record.lockedUntil) {
      const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      throw new Error(
        `Too many failed attempts. Try again in ${remainingSeconds} seconds.`
      );
    }
    // Lockout expired — reset attempt counter but keep lockoutCount for backoff
    record = {
      count: 0,
      firstAttemptAt: 0,
      lockedUntil: null,
      lockoutCount: record.lockoutCount,
    };
  }
}

/**
 * Record a failed unlock attempt.
 * Triggers lockout after MAX_ATTEMPTS failures with exponential backoff.
 */
export function recordFailedAttempt(): void {
  const now = Date.now();

  if (record.count === 0) {
    record.firstAttemptAt = now;
  }

  record.count += 1;

  if (record.count >= MAX_ATTEMPTS) {
    record.lockoutCount += 1;
    // Exponential backoff: 5min, 10min, 20min, 40min, capped at 1 hour
    const lockoutMs = Math.min(
      BASE_LOCKOUT_MS * Math.pow(2, record.lockoutCount - 1),
      MAX_LOCKOUT_MS
    );
    record.lockedUntil = now + lockoutMs;
  }
}

/**
 * Reset the rate limiter on successful unlock.
 */
export function resetUnlockRateLimit(): void {
  record = { count: 0, firstAttemptAt: 0, lockedUntil: null, lockoutCount: 0 };
}
