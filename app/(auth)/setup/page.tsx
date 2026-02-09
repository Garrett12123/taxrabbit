'use client';

import { useActionState, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Rabbit, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { TAX_YEARS, DEFAULT_TAX_YEAR } from '@/lib/constants';
import { setupAction, type ActionResult } from '../actions';

export default function SetupPage() {
  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(setupAction, null);
  const [taxYear, setTaxYear] = useState(String(DEFAULT_TAX_YEAR));
  const router = useRouter();

  // If vault was created and a recovery key was returned, show it
  if (state?.success && state.recoveryKey) {
    return (
      <div className="space-y-4">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="flex size-5 items-center justify-center rounded-full bg-positive text-[10px] font-bold text-primary-foreground">✓</span>
            Create Password
          </span>
          <span className="h-px w-6 bg-border" />
          <span className="flex items-center gap-1.5 text-foreground font-medium">
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">2</span>
            Save Recovery Key
          </span>
        </div>

        <Card>
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-lg bg-positive/10">
              <ShieldCheck className="size-7 text-positive" />
            </div>
            <CardTitle className="text-xl">Save Your Recovery Key</CardTitle>
            <CardDescription>
              This key lets you recover your vault if your macOS Keychain is lost.
              Store it somewhere safe — it will not be shown again.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border bg-muted/50 p-3">
              <code className="block break-all text-xs font-mono leading-relaxed">
                {state.recoveryKey}
              </code>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                navigator.clipboard.writeText(state.recoveryKey!);
                toast.success('Recovery key copied to clipboard');
              }}
            >
              <Copy className="size-4" />
              Copy to Clipboard
            </Button>
            <p className="text-xs text-destructive font-medium text-center">
              Without this key and your password, your data cannot be recovered if the Keychain entry is lost.
            </p>
            <Button
              className="w-full"
              onClick={() => router.push('/overview')}
            >
              I&apos;ve Saved My Recovery Key
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5 text-foreground font-medium">
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">1</span>
          Create Password
        </span>
        <span className="h-px w-6 bg-border" />
        <span className="flex items-center gap-1.5">
          <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">2</span>
          Save Recovery Key
        </span>
      </div>

      <Card>
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-lg bg-primary">
            <Rabbit className="size-7 text-primary-foreground" />
          </div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            TaxRabbit
          </p>
          <CardTitle className="text-xl">Set Up Your Vault</CardTitle>
          <CardDescription>
            Create a master password to encrypt your tax data.
          </CardDescription>
        </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Master Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoFocus
              disabled={isPending}
            />
            {state?.fieldErrors?.password && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.password[0]}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Use at least 8 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              disabled={isPending}
            />
            {state?.fieldErrors?.confirmPassword && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.confirmPassword[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultTaxYear">Default Tax Year</Label>
            <Select value={taxYear} onValueChange={setTaxYear}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TAX_YEARS.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="defaultTaxYear" value={taxYear} />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Spinner />
                Creating vault…
              </>
            ) : (
              'Create Vault'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>

    {/* What is TaxRabbit blurb */}
    <p className="text-center text-xs text-muted-foreground leading-relaxed">
      TaxRabbit encrypts all your tax data locally on this Mac.
      <br />
      Nothing is sent to the cloud — your data stays yours.
    </p>
    </div>
  );
}
