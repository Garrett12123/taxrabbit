'use client';

import { useState, useTransition, useCallback } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

import { LoadingButton } from '@/components/ui/loading-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CopyButton } from '@/components/ui/copy-button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Spinner } from '@/components/ui/spinner';
import {
  changePasswordAction,
  updateLockTimeoutAction,
  revealRecoveryKeyAction,
} from '@/app/(modules)/settings/actions';
import { LOCK_TIMEOUT_OPTIONS } from '@/lib/validation/settings';
import { useSaveShortcut } from '@/hooks/use-save-shortcut';

type SecurityTabProps = {
  lockTimeoutMinutes: number;
  deviceKeyEnabled: boolean;
};

export function SecurityTab({
  lockTimeoutMinutes: initialTimeout,
  deviceKeyEnabled,
}: SecurityTabProps) {
  return (
    <div className="space-y-6">
      <ChangePasswordCard />
      {deviceKeyEnabled && <RecoveryKeyCard />}
      <AutoLockCard
        initialTimeout={initialTimeout}
        deviceKeyEnabled={deviceKeyEnabled}
      />
    </div>
  );
}

function ChangePasswordCard() {
  const [isPending, startTransition] = useTransition();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(() => {
    setError(null);
    startTransition(async () => {
      const result = await changePasswordAction({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(true);
      toast.success('Password changed successfully.');
    });
  }, [currentPassword, newPassword, confirmPassword]);

  // Cmd+S to save
  useSaveShortcut(handleSubmit, !isPending);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Update the password used to unlock your vault.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field>
          <FieldLabel>Current Password</FieldLabel>
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
        </Field>
        <Field>
          <FieldLabel>New Password</FieldLabel>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
        </Field>
        <Field>
          <FieldLabel>Confirm New Password</FieldLabel>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </Field>
        {error && <FieldError>{error}</FieldError>}
      </CardContent>
      <CardFooter>
        <LoadingButton
          onClick={handleSubmit}
          loading={isPending}
          success={success}
          loadingText="Changing..."
          successText="Changed"
        >
          Change Password
        </LoadingButton>
      </CardFooter>
    </Card>
  );
}

function RecoveryKeyCard() {
  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState('');
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  function handleReveal() {
    setError(null);
    startTransition(async () => {
      const result = await revealRecoveryKeyAction(password);
      if (result.error) {
        setError(result.error);
        return;
      }
      setRecoveryKey(result.recoveryKey!);
      setPassword('');
    });
  }

  function handleHide() {
    setRecoveryKey(null);
    setVisible(false);
    setError(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recovery Key</CardTitle>
        <CardDescription>
          Use this key to recover your vault if the macOS Keychain entry is lost.
          Store it somewhere safe.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recoveryKey ? (
          <>
            <div className="rounded-md border bg-muted/50 p-3">
              <code className="block break-all text-xs font-mono leading-relaxed">
                {visible ? recoveryKey : '\u2022'.repeat(44)}
              </code>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisible((v) => !v)}
              >
                {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                {visible ? 'Hide' : 'Show'}
              </Button>
              <CopyButton
                value={recoveryKey}
                label="Copy"
                onCopied={() => toast.success('Recovery key copied to clipboard')}
              />
            </div>
            <p className="text-xs text-destructive font-medium">
              Without this key and your password, your data cannot be recovered
              if the Keychain entry is lost.
            </p>
          </>
        ) : (
          <>
            <Field>
              <FieldLabel>Confirm Password</FieldLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your vault password"
                autoComplete="current-password"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && password) handleReveal();
                }}
              />
            </Field>
            {error && <FieldError>{error}</FieldError>}
          </>
        )}
      </CardContent>
      <CardFooter>
        {recoveryKey ? (
          <Button variant="outline" onClick={handleHide}>
            Done
          </Button>
        ) : (
          <LoadingButton
            onClick={handleReveal}
            loading={isPending}
            disabled={!password}
            loadingText="Verifying..."
          >
            Reveal Recovery Key
          </LoadingButton>
        )}
      </CardFooter>
    </Card>
  );
}

function AutoLockCard({
  initialTimeout,
  deviceKeyEnabled,
}: {
  initialTimeout: number;
  deviceKeyEnabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    startTransition(async () => {
      const result = await updateLockTimeoutAction({
        lockTimeoutMinutes: Number(e.target.value),
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Lock timeout updated.');
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auto-Lock Timeout</CardTitle>
        <CardDescription>
          Automatically lock the vault after a period of inactivity.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field>
          <FieldLabel>Timeout</FieldLabel>
          <div className="flex items-center gap-2">
            <NativeSelect
              defaultValue={initialTimeout}
              onChange={handleChange}
              disabled={isPending}
            >
              {LOCK_TIMEOUT_OPTIONS.map((mins) => (
                <NativeSelectOption key={mins} value={mins}>
                  {mins} minutes
                </NativeSelectOption>
              ))}
            </NativeSelect>
            {isPending && <Spinner className="size-4 text-muted-foreground" />}
          </div>
        </Field>
        <FieldDescription>
          Device key: {deviceKeyEnabled ? 'Enabled' : 'Not available'}
          {deviceKeyEnabled && ' — your vault key is additionally protected by the macOS Keychain.'}
        </FieldDescription>
      </CardContent>
    </Card>
  );
}
