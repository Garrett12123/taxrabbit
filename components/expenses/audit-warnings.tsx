'use client';

import { AlertTriangle } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import type { AuditFlag } from '@/lib/audit';

type AuditWarningsProps = {
  flags: AuditFlag[];
};

export function AuditWarnings({ flags }: AuditWarningsProps) {
  if (flags.length === 0) return null;

  return (
    <div className="space-y-2">
      {flags.map((flag) => (
        <Alert key={flag.code} variant="default">
          <AlertTriangle className="size-4" />
          <AlertDescription>{flag.message}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
