'use client';

import { useState, useRef } from 'react';
import {
  Download,
  Upload,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';

import {
  validateBackupAction,
  restoreBackupAction,
} from '@/app/(modules)/reports/actions';
import type { RestoreValidation } from '@/server/services/backup-service';

export function BackupCard() {
  const [backupLoading, setBackupLoading] = useState(false);
  const [validation, setValidation] = useState<RestoreValidation | null>(null);
  const [validating, setValidating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedFileRef = useRef<File | null>(null);

  async function handleCreateBackup() {
    setBackupLoading(true);
    try {
      const res = await fetch('/api/export/backup');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Backup failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download =
        res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ??
        'taxrabbit-backup.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Backup failed:', err);
      toast.error(err instanceof Error ? err.message : 'Backup failed. Please try again.');
    } finally {
      setBackupLoading(false);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    selectedFileRef.current = file;
    setValidation(null);
    setRestoreError(null);
    setValidating(true);

    try {
      const formData = new FormData();
      formData.set('file', file);
      const result = await validateBackupAction(formData);
      setValidation(result);
    } catch {
      setValidation({
        valid: false,
        errors: ['Failed to validate backup file'],
        fileCount: 0,
        hasDatabase: false,
        hasVaultJson: false,
        vaultFileCount: 0,
      });
    } finally {
      setValidating(false);
    }
  }

  async function handleConfirmRestore() {
    const file = selectedFileRef.current;
    if (!file) return;

    setConfirmOpen(false);
    setRestoring(true);
    setRestoreError(null);

    try {
      const formData = new FormData();
      formData.set('file', file);
      const result = await restoreBackupAction(formData);
      if (result?.error) {
        setRestoreError(result.error);
      }
    } catch {
      // redirect on success will throw NEXT_REDIRECT — that's expected
    } finally {
      setRestoring(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup & Restore</CardTitle>
        <CardDescription>
          Create a full backup of your vault or restore from a previous backup.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create Backup */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Create Backup</h3>
          <p className="text-sm text-muted-foreground">
            Downloads a ZIP archive containing your encrypted database and vault
            files. Backups remain encrypted — your password is required to
            restore.
          </p>
          <Button
            variant="outline"
            onClick={handleCreateBackup}
            disabled={backupLoading}
          >
            {backupLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {backupLoading ? 'Creating...' : 'Create Backup'}
          </Button>
        </div>

        <Separator />

        {/* Restore from Backup */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Restore from Backup</h3>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Restoring from a backup will replace all current data. This cannot
              be undone. Make sure you have a current backup before proceeding.
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={validating || restoring}
            >
              {validating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              {validating ? 'Validating...' : 'Select Backup File'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Validation Results */}
          {validation && (
            <div className="space-y-2 rounded-lg border p-4">
              <div className="flex items-center gap-2">
                {validation.valid ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                <span className="font-medium">
                  {validation.valid ? 'Valid backup' : 'Invalid backup'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Files: </span>
                  {validation.fileCount}
                </div>
                <div>
                  <span className="text-muted-foreground">Database: </span>
                  {validation.hasDatabase ? 'Yes' : 'No'}
                </div>
                <div>
                  <span className="text-muted-foreground">Vault config: </span>
                  {validation.hasVaultJson ? 'Yes' : 'No'}
                </div>
                <div>
                  <span className="text-muted-foreground">Vault files: </span>
                  {validation.vaultFileCount}
                </div>
              </div>

              {validation.errors.length > 0 && (
                <ul className="text-sm text-destructive list-disc pl-5">
                  {validation.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}

              {validation.valid && (
                <Button
                  variant="destructive"
                  onClick={() => setConfirmOpen(true)}
                  disabled={restoring}
                >
                  {restoring ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {restoring ? 'Restoring...' : 'Restore This Backup'}
                </Button>
              )}
            </div>
          )}

          {restoreError && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Restore Failed</AlertTitle>
              <AlertDescription>{restoreError}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Confirm Dialog */}
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Restore</AlertDialogTitle>
              <AlertDialogDescription>
                This will replace all current data with the backup contents. You
                will need to re-enter your password to unlock the vault. This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmRestore}>
                Yes, Restore Backup
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
