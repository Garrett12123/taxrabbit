import 'server-only';

import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import * as schema from './schema';

export type DB = ReturnType<typeof drizzle<typeof schema>>;

const DATA_DIR = join(process.cwd(), 'data');
const DB_PATH = join(DATA_DIR, 'taxrabbit.db');
const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations');

const globalKey = Symbol.for('taxrabbit.db');

export function getDb(): DB {
  const g = globalThis as unknown as Record<symbol, DB>;
  if (g[globalKey]) {
    return g[globalKey];
  }

  // Ensure data directory exists
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  // Open SQLite database
  const sqlite = new Database(DB_PATH);

  // Set pragmas for performance and safety
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('busy_timeout = 5000');
  sqlite.pragma('synchronous = NORMAL');

  // Create drizzle instance
  const db = drizzle(sqlite, { schema });

  // Run migrations
  migrate(db, { migrationsFolder: MIGRATIONS_DIR });

  g[globalKey] = db;
  return db;
}

export function resetDb(): void {
  const g = globalThis as unknown as Record<symbol, DB | undefined>;
  const existing = g[globalKey];
  if (existing) {
    // Close the underlying better-sqlite3 connection
    (existing as unknown as { $client: { close: () => void } }).$client.close();
    g[globalKey] = undefined;
  }
}
