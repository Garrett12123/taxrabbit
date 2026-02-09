'use client';

import { useActionState, useState } from 'react';
import { KeyRound, Rabbit } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { unlockAction, recoveryUnlockAction, type ActionResult } from '../actions';

export default function UnlockPage() {
  const [showRecovery, setShowRecovery] = useState(false);
  const [unlockState, unlockFormAction, isUnlocking] = useActionState<
    ActionResult | null,
    FormData
  >(unlockAction, null);
  const [recoveryState, recoveryFormAction, isRecovering] = useActionState<
    ActionResult | null,
    FormData
  >(recoveryUnlockAction, null);

  if (showRecovery) {
    return (
      <div className="space-y-4">
      <p className="text-center text-sm text-muted-foreground">
        Recovery mode
      </p>
      <Card>
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-lg bg-primary">
            <KeyRound className="size-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl">Recovery Unlock</CardTitle>
          <CardDescription>
            Enter your password and recovery key to unlock the vault
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={recoveryFormAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recovery-password">Master Password</Label>
              <Input
                id="recovery-password"
                name="password"
                type="password"
                required
                autoFocus
                disabled={isRecovering}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recoveryKey">Recovery Key</Label>
              <Input
                id="recoveryKey"
                name="recoveryKey"
                type="password"
                required
                placeholder="Base64 recovery key"
                disabled={isRecovering}
                className="font-mono text-xs"
              />
              {recoveryState?.fieldErrors?.recoveryKey && (
                <p className="text-sm text-destructive">
                  {recoveryState.fieldErrors.recoveryKey[0]}
                </p>
              )}
            </div>

            {recoveryState?.error && (
              <p className="text-sm text-destructive">{recoveryState.error}</p>
            )}

            <Button type="submit" className="w-full" disabled={isRecovering}>
              {isRecovering ? (
                <>
                  <Spinner />
                  Recovering…
                </>
              ) : (
                'Unlock with Recovery Key'
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setShowRecovery(false)}
            >
              Back to normal unlock
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Welcome greeting */}
      <p className="text-center text-sm text-muted-foreground">
        Welcome back
      </p>

      <Card>
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-lg bg-primary">
            <Rabbit className="size-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl">Unlock Your Vault</CardTitle>
          <CardDescription>
            Enter your master password to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={unlockFormAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Master Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoFocus
                disabled={isUnlocking}
                placeholder="Enter your password"
              />
              {unlockState?.fieldErrors?.password && (
                <p className="text-sm text-destructive">
                  {unlockState.fieldErrors.password[0]}
                </p>
              )}
            </div>

            {unlockState?.error && (
              <p className="text-sm text-destructive">{unlockState.error}</p>
            )}

            <Button type="submit" className="w-full" disabled={isUnlocking}>
              {isUnlocking ? (
                <>
                  <Spinner />
                  Unlocking…
                </>
              ) : (
                'Unlock'
              )}
            </Button>

            <button
              type="button"
              className="flex items-center justify-center gap-1.5 w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowRecovery(true)}
            >
              <KeyRound className="size-3" />
              Lost access? Use recovery key
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
