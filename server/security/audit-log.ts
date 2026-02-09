import 'server-only';

import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const DATA_DIR = join(process.cwd(), 'data');
const AUDIT_LOG_PATH = join(DATA_DIR, 'audit.log');

export type AuditEventType =
  | 'vault_setup'
  | 'unlock_success'
  | 'unlock_failed'
  | 'unlock_rate_limited'
  | 'device_key_missing'
  | 'recovery_key_failed'
  | 'recovery_unlock_failed'
  | 'recovery_unlock_success'
  | 'session_timeout'
  | 'lock'
  | 'password_changed'
  | 'backup_created'
  | 'backup_restored';

export function logSecurityEvent(event: AuditEventType): void {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    const entry = `${new Date().toISOString()} ${event}\n`;
    appendFileSync(AUDIT_LOG_PATH, entry, 'utf-8');
  } catch {
    // Audit logging should never crash the app
  }
}
