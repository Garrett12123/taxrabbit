'use client';

import { useEffect } from 'react';
import { AlertCircle, Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { formatErrorForUser } from '@/lib/errors';

export default function ModulesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[ModulesError]', error);
  }, [error]);

  const isVaultLocked =
    error.message === 'Vault is locked' ||
    error.message.includes('vault is locked');

  if (isVaultLocked) {
    return (
      <div className="space-y-4 p-6">
        <Alert>
          <Lock className="size-4" />
          <AlertTitle>Vault is locked</AlertTitle>
          <AlertDescription>
            Your session has expired. Please unlock your vault to continue.
          </AlertDescription>
        </Alert>
        <Button asChild>
          <a href="/unlock">Unlock Vault</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>{formatErrorForUser(error)}</AlertDescription>
      </Alert>
      <div className="flex gap-2">
        <Button onClick={reset} variant="default">
          Try again
        </Button>
        <Button variant="outline" asChild>
          <a href="/overview">Go to Overview</a>
        </Button>
      </div>
    </div>
  );
}
