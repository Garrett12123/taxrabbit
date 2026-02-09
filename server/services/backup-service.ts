import 'server-only';

import {
  existsSync,
  readdirSync,
  mkdirSync,
  renameSync,
  rmSync,
  copyFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

import archiver from 'archiver';
import AdmZip from 'adm-zip';

import { getDb, resetDb } from '@/server/db';
import { destroySession } from '@/server/security/session';
import { backupManifestSchema, type BackupManifest } from '@/lib/validation/backup';
import { VAULT_DIR } from '@/server/storage/vault';

const DATA_DIR = join(process.cwd(), 'data');
const DB_PATH = join(DATA_DIR, 'taxrabbit.db');
const VAULT_JSON_PATH = join(DATA_DIR, 'vault.json');

export type RestoreValidation = {
  valid: boolean;
  errors: string[];
  manifest?: BackupManifest;
  fileCount: number;
  hasDatabase: boolean;
  hasVaultJson: boolean;
  vaultFileCount: number;
};

export async function createBackup(): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  // Flush WAL to ensure consistent state
  const db = getDb();
  (db as unknown as { $client: { pragma: (s: string) => void } }).$client.pragma(
    'wal_checkpoint(TRUNCATE)'
  );

  const archive = archiver('zip', { zlib: { level: 9 } });
  const chunks: Buffer[] = [];

  // Set up ALL event listeners BEFORE calling finalize to avoid race condition
  const archivePromise = new Promise<Buffer>((resolve, reject) => {
    archive.on('data', (chunk: Buffer) => chunks.push(chunk));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);
  });

  // Add database file
  if (existsSync(DB_PATH)) {
    archive.file(DB_PATH, { name: 'backup/taxrabbit.db' });
  }

  // Add vault.json
  if (existsSync(VAULT_JSON_PATH)) {
    archive.file(VAULT_JSON_PATH, { name: 'backup/vault.json' });
  }

  // Add vault files (already encrypted at rest)
  let vaultFileCount = 0;
  if (existsSync(VAULT_DIR)) {
    const files = readdirSync(VAULT_DIR);
    for (const file of files) {
      const filePath = join(VAULT_DIR, file);
      archive.file(filePath, { name: `backup/vault/${file}` });
      vaultFileCount++;
    }
  }

  // Add manifest
  const manifest: BackupManifest = {
    version: 1,
    createdAt: new Date().toISOString(),
    fileCount: (existsSync(DB_PATH) ? 1 : 0) +
      (existsSync(VAULT_JSON_PATH) ? 1 : 0) +
      vaultFileCount,
  };
  archive.append(JSON.stringify(manifest, null, 2), {
    name: 'backup/manifest.json',
  });

  // Finalize the archive (triggers the stream to complete)
  archive.finalize();

  // Wait for all data to be collected
  const buffer = await archivePromise;
  const date = new Date().toISOString().split('T')[0];
  const filename = `taxrabbit-backup-${date}.zip`;

  return { buffer, filename };
}

export async function validateBackupArchive(
  buffer: Buffer
): Promise<RestoreValidation> {
  const errors: string[] = [];
  let manifest: BackupManifest | undefined;
  let hasDatabase = false;
  let hasVaultJson = false;
  let vaultFileCount = 0;

  try {
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();

    let fileCount = 0;
    for (const entry of entries) {
      if (entry.isDirectory) continue;
      fileCount++;

      const name = entry.entryName;
      if (name === 'backup/taxrabbit.db') {
        hasDatabase = true;
      } else if (name === 'backup/vault.json') {
        hasVaultJson = true;
      } else if (name === 'backup/manifest.json') {
        try {
          const raw = entry.getData().toString('utf-8');
          const parsed = backupManifestSchema.safeParse(JSON.parse(raw));
          if (parsed.success) {
            manifest = parsed.data;
          } else {
            errors.push('Invalid manifest format');
          }
        } catch {
          errors.push('Failed to parse manifest.json');
        }
      } else if (name.startsWith('backup/vault/')) {
        vaultFileCount++;
      }
    }

    if (!hasDatabase) errors.push('Missing database file (taxrabbit.db)');
    if (!hasVaultJson) errors.push('Missing vault configuration (vault.json)');
    if (!manifest) errors.push('Missing or invalid manifest.json');

    return {
      valid: errors.length === 0,
      errors,
      manifest,
      fileCount,
      hasDatabase,
      hasVaultJson,
      vaultFileCount,
    };
  } catch {
    return {
      valid: false,
      errors: ['Invalid ZIP archive'],
      fileCount: 0,
      hasDatabase: false,
      hasVaultJson: false,
      vaultFileCount: 0,
    };
  }
}

export async function restoreFromBackup(buffer: Buffer): Promise<void> {
  // Validate first
  const validation = await validateBackupArchive(buffer);
  if (!validation.valid) {
    throw new Error(`Invalid backup: ${validation.errors.join(', ')}`);
  }

  // Validate manifest fileCount matches actual file count
  if (validation.manifest && validation.fileCount !== validation.manifest.fileCount + 1) {
    // +1 for the manifest itself
    throw new Error(
      `Backup integrity check failed: expected ${validation.manifest.fileCount} files, found ${validation.fileCount - 1}`
    );
  }

  // Close DB connection before replacing files
  resetDb();

  // Destroy any active session
  try {
    await destroySession();
  } catch {
    // Session may not exist
  }

  const zip = new AdmZip(buffer);
  const tempDir = join(DATA_DIR, `restore-${randomUUID()}`);
  const rollbackDir = join(DATA_DIR, `rollback-${randomUUID()}`);

  try {
    // Extract backup to temp directory
    mkdirSync(tempDir, { recursive: true });
    zip.extractAllTo(tempDir, true);

    const backupDir = join(tempDir, 'backup');

    // --- Phase 1: Back up current state for rollback ---
    mkdirSync(rollbackDir, { recursive: true });

    if (existsSync(DB_PATH)) {
      copyFileSync(DB_PATH, join(rollbackDir, 'taxrabbit.db'));
    }
    for (const ext of ['-wal', '-shm']) {
      const walPath = DB_PATH + ext;
      if (existsSync(walPath)) {
        copyFileSync(walPath, join(rollbackDir, `taxrabbit.db${ext}`));
      }
    }
    if (existsSync(VAULT_JSON_PATH)) {
      copyFileSync(VAULT_JSON_PATH, join(rollbackDir, 'vault.json'));
    }
    const rollbackVaultDir = join(rollbackDir, 'vault');
    if (existsSync(VAULT_DIR)) {
      mkdirSync(rollbackVaultDir, { recursive: true });
      const existingFiles = readdirSync(VAULT_DIR);
      for (const file of existingFiles) {
        copyFileSync(join(VAULT_DIR, file), join(rollbackVaultDir, file));
      }
    }

    // --- Phase 2: Apply the restore ---
    try {
      // Replace database
      const dbSource = join(backupDir, 'taxrabbit.db');
      if (existsSync(dbSource)) {
        // Remove WAL/SHM files if they exist
        for (const ext of ['-wal', '-shm']) {
          const walPath = DB_PATH + ext;
          if (existsSync(walPath)) {
            rmSync(walPath);
          }
        }
        renameSync(dbSource, DB_PATH);
      }

      // Replace vault.json
      const vaultJsonSource = join(backupDir, 'vault.json');
      if (existsSync(vaultJsonSource)) {
        renameSync(vaultJsonSource, VAULT_JSON_PATH);
      }

      // Replace vault files
      const vaultSource = join(backupDir, 'vault');
      if (existsSync(vaultSource)) {
        // Clear existing vault files
        if (existsSync(VAULT_DIR)) {
          const existingFiles = readdirSync(VAULT_DIR);
          for (const file of existingFiles) {
            rmSync(join(VAULT_DIR, file));
          }
        }

        mkdirSync(VAULT_DIR, { recursive: true });
        const restoredFiles = readdirSync(vaultSource);
        for (const file of restoredFiles) {
          renameSync(join(vaultSource, file), join(VAULT_DIR, file));
        }
      }
    } catch (restoreErr) {
      // --- Phase 3: Rollback on failure ---
      try {
        const rollbackDb = join(rollbackDir, 'taxrabbit.db');
        if (existsSync(rollbackDb)) {
          copyFileSync(rollbackDb, DB_PATH);
        }
        for (const ext of ['-wal', '-shm']) {
          const src = join(rollbackDir, `taxrabbit.db${ext}`);
          if (existsSync(src)) {
            copyFileSync(src, DB_PATH + ext);
          }
        }
        const rollbackVaultJson = join(rollbackDir, 'vault.json');
        if (existsSync(rollbackVaultJson)) {
          copyFileSync(rollbackVaultJson, VAULT_JSON_PATH);
        }
        if (existsSync(rollbackVaultDir)) {
          if (existsSync(VAULT_DIR)) {
            const staleFiles = readdirSync(VAULT_DIR);
            for (const file of staleFiles) {
              rmSync(join(VAULT_DIR, file));
            }
          }
          mkdirSync(VAULT_DIR, { recursive: true });
          const origFiles = readdirSync(rollbackVaultDir);
          for (const file of origFiles) {
            copyFileSync(join(rollbackVaultDir, file), join(VAULT_DIR, file));
          }
        }
      } catch {
        // If rollback itself fails, we can't recover — throw the original error
      }
      throw restoreErr;
    }
  } finally {
    // Cleanup temp directories
    for (const dir of [tempDir, rollbackDir]) {
      if (existsSync(dir)) {
        rmSync(dir, { recursive: true, force: true });
      }
    }
  }
}
