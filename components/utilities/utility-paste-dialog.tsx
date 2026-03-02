'use client';

import { useState, useTransition } from 'react';
import { ClipboardPaste, Check, AlertTriangle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { bulkCreateUtilityBillsAction } from '@/app/(modules)/utilities/actions';
import { parseUtilityPaste, type ParsedUtilityRow } from '@/lib/utility-paste/parse';
import { UTILITY_TYPES, UTILITY_USAGE_UNITS, type UtilityType } from '@/lib/constants';
import { formatCents } from '@/lib/utils';

type UtilityPasteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
};

type Step = 'paste' | 'review';

export function UtilityPasteDialog({
  open,
  onOpenChange,
  year,
}: UtilityPasteDialogProps) {
  const [step, setStep] = useState<Step>('paste');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Paste step state
  const [rawText, setRawText] = useState('');
  const [utilityType, setUtilityType] = useState<UtilityType>('Electric');
  const [provider, setProvider] = useState('');

  // Review step state
  const [parsedRows, setParsedRows] = useState<ParsedUtilityRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  const handleParse = () => {
    setError(null);

    if (!rawText.trim()) {
      setError('Please paste your utility bill data.');
      return;
    }
    if (!provider.trim()) {
      setError('Please enter the provider name.');
      return;
    }

    const result = parseUtilityPaste(rawText);
    setParsedRows(result.rows);
    setParseErrors(result.errors);

    if (result.rows.length === 0) {
      setError(result.errors[0] ?? 'No valid rows found in the pasted text.');
      return;
    }

    setStep('review');
  };

  const handleImport = () => {
    setError(null);
    startTransition(async () => {
      const result = await bulkCreateUtilityBillsAction({
        year,
        utilityType,
        provider: provider.trim(),
        usageUnit: UTILITY_USAGE_UNITS[utilityType] || undefined,
        rows: parsedRows,
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      onOpenChange(false);
      // Reset state for next open
      setStep('paste');
      setRawText('');
      setProvider('');
      setParsedRows([]);
      setParseErrors([]);
    });
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setStep('paste');
      setRawText('');
      setProvider('');
      setParsedRows([]);
      setParseErrors([]);
      setError(null);
    }
    onOpenChange(open);
  };

  const totalAmount = parsedRows.reduce((sum, r) => sum + r.amount, 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardPaste className="size-5" />
            Quick Paste Import
          </DialogTitle>
          <DialogDescription>
            {step === 'paste'
              ? 'Paste utility bill data from your provider\'s website. Select the utility type and enter the provider name.'
              : `Review ${parsedRows.length} parsed bill${parsedRows.length !== 1 ? 's' : ''} before importing.`}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          {step === 'paste' ? (
            <div className="space-y-4 pb-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Utility Type *</FieldLabel>
                  <Select value={utilityType} onValueChange={(v) => setUtilityType(v as UtilityType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UTILITY_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Provider *</FieldLabel>
                  <Input
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    placeholder="e.g. Duke Energy, Spectrum"
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel>Paste Data</FieldLabel>
                <Textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={"Paste rows from your utility provider's billing page...\n\nExample:\nBill Date\tUsage\tConsumption Charges\tOther Charges\tTotal Charges\nDec 01, 2025\t2\t$ 58.69\t$ 1.67\t$ 60.36"}
                  rows={8}
                  className="font-mono text-xs"
                />
              </Field>

              {error && <FieldError>{error}</FieldError>}
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {parseErrors.length > 0 && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="size-4" />
                    {parseErrors.length} warning{parseErrors.length !== 1 ? 's' : ''}
                  </div>
                  <ul className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                    {parseErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm">
                <Badge variant="outline">{utilityType}</Badge>
                <span className="text-muted-foreground">{provider}</span>
                <span className="ml-auto font-mono tabular-nums font-medium">
                  Total: {formatCents(totalAmount)}
                </span>
              </div>

              <div className="max-h-[300px] overflow-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Date</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead className="text-right">Consumption</TableHead>
                      <TableHead className="text-right">Other</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {row.billDate}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.usage != null ? row.usage : '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {row.consumptionCharges > 0 ? formatCents(row.consumptionCharges) : '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {row.otherCharges > 0 ? formatCents(row.otherCharges) : '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums font-medium">
                          {formatCents(row.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {error && <FieldError>{error}</FieldError>}
            </div>
          )}
        </DialogBody>

        <DialogFooter className="flex-row gap-2 sm:flex-row sm:justify-end">
          {step === 'review' && (
            <Button
              variant="outline"
              onClick={() => { setStep('paste'); setError(null); }}
              disabled={isPending}
            >
              Back
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          {step === 'paste' ? (
            <Button onClick={handleParse}>
              Parse & Preview
            </Button>
          ) : (
            <Button onClick={handleImport} disabled={isPending}>
              {isPending && <Spinner className="size-4" />}
              {isPending ? 'Importing...' : (
                <>
                  <Check className="size-4" />
                  Import {parsedRows.length} Bill{parsedRows.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
