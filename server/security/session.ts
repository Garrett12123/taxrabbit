import 'server-only';

import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';

import { zeroBuffer } from './crypto';

const COOKIE_NAME = 'taxrabbit_session';
const DEFAULT_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const MAX_SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 hours absolute maximum

type Session = {
  token: string;
  dek: Buffer;
  createdAt: number;
  lastAccessedAt: number;
  idleTimeoutMs: number;
};

// Use globalThis to survive HMR in development
const globalKey = Symbol.for('taxrabbit.sessions');

function getSessionMap(): Map<string, Session> {
  const g = globalThis as unknown as Record<symbol, Map<string, Session>>;
  if (!g[globalKey]) {
    g[globalKey] = new Map<string, Session>();
  }
  return g[globalKey];
}

function isSessionExpired(session: Session, now: number): boolean {
  // Check idle timeout
  if (now - session.lastAccessedAt > session.idleTimeoutMs) return true;
  // Check absolute lifetime
  if (now - session.createdAt > MAX_SESSION_LIFETIME_MS) return true;
  return false;
}

function pruneExpiredSessions(): void {
  const sessions = getSessionMap();
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (isSessionExpired(session, now)) {
      zeroBuffer(session.dek);
      sessions.delete(token);
    }
  }
}

export async function createSession(
  dek: Buffer,
  idleTimeoutMs: number = DEFAULT_IDLE_TIMEOUT_MS
): Promise<string> {
  // Clean up any expired sessions to prevent memory leaks
  pruneExpiredSessions();

  const token = randomBytes(32).toString('hex');
  const now = Date.now();

  getSessionMap().set(token, {
    token,
    dek: Buffer.from(dek),
    createdAt: now,
    lastAccessedAt: now,
    idleTimeoutMs,
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure:
      process.env.SECURE_COOKIES !== undefined
        ? process.env.SECURE_COOKIES !== 'false'
        : process.env.NODE_ENV === 'production',
    path: '/',
    // No maxAge — session-scoped cookie
  });

  return token;
}

export async function getSession(): Promise<Session | null> {
  // Prune expired sessions on every access to avoid stale DEKs in memory
  pruneExpiredSessions();

  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie?.value) return null;

  const session = getSessionMap().get(cookie.value);
  if (!session) return null;

  const now = Date.now();

  // Check idle timeout and absolute lifetime
  if (isSessionExpired(session, now)) {
    zeroBuffer(session.dek);
    getSessionMap().delete(cookie.value);
    return null;
  }

  session.lastAccessedAt = now;
  return session;
}

export async function getDek(): Promise<Buffer | null> {
  const session = await getSession();
  // Return a copy to prevent callers from mutating/zeroing the session DEK
  return session?.dek ? Buffer.from(session.dek) : null;
}

export async function requireDek(): Promise<Buffer> {
  const dek = await getDek();
  if (!dek) {
    throw new Error('Vault is locked');
  }
  return dek;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);

  if (cookie?.value) {
    const session = getSessionMap().get(cookie.value);
    if (session) {
      zeroBuffer(session.dek);
      getSessionMap().delete(cookie.value);
    }
  }

  cookieStore.delete(COOKIE_NAME);
}

export async function updateSessionTimeout(idleTimeoutMs: number): Promise<void> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie?.value) return;

  const session = getSessionMap().get(cookie.value);
  if (session) {
    session.idleTimeoutMs = idleTimeoutMs;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}
