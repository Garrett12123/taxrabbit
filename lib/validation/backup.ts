import { z } from 'zod';

export const backupManifestSchema = z.object({
  version: z.number().int().positive(),
  createdAt: z.string(),
  fileCount: z.number().int().nonnegative(),
});

export type BackupManifest = z.infer<typeof backupManifestSchema>;
