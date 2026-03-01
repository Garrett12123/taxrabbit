'use client';

import { useCallback, useState } from 'react';
import { ClipboardPaste } from 'lucide-react';

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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MoneyInput } from '@/components/forms/common/money-input';
import { Input } from '@/components/ui/input';
import { smartPaste } from '@/lib/smart-paste';
import { formatCents } from '@/lib/utils';
import { FORM_BOX_DEFINITIONS } from '@/lib/constants';
import type { IncomeFormType } from '@/lib/constants';
import type { SmartPasteResult, MatchResult } from '@/lib/smart-paste';

type SmartPasteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formType: IncomeFormType;
  onApply: (result: SmartPasteResult) => void;
};

const CONFIDENCE_BADGE: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' }> = {
  high: { label: 'High', variant: 'success' },
  medium: { label: 'Med', variant: 'warning' },
  low: { label: 'Low', variant: 'destructive' },
};

export function SmartPasteDialog({
  open,
  onOpenChange,
  formType,
  onApply,
}: SmartPasteDialogProps) {
  const [step, setStep] = useState<'paste' | 'review'>('paste');
  const [rawText, setRawText] = useState('');
  const [result, setResult] = useState<SmartPasteResult | null>(null);
  const [editedMatches, setEditedMatches] = useState<MatchResult[]>([]);
  const [issuerName, setIssuerName] = useState('');
  const [issuerEin, setIssuerEin] = useState('');

  const boxDefs = FORM_BOX_DEFINITIONS[formType];

  const handleExtract = useCallback(() => {
    if (!rawText.trim()) return;
    const parsed = smartPaste(rawText, formType);
    setResult(parsed);
    setEditedMatches([...parsed.matches]);
    setIssuerName(parsed.issuerName ?? '');
    setIssuerEin(parsed.issuerEin ?? '');
    setStep('review');
  }, [rawText, formType]);

  const handleApply = useCallback(() => {
    if (!result) return;

    // Build boxes from edited matches
    const boxes: Record<string, number | string | boolean> = {};
    for (const match of editedMatches) {
      boxes[match.key] = match.value;
    }

    onApply({
      ...result,
      matches: editedMatches,
      boxes,
      issuerName: issuerName || undefined,
      issuerEin: issuerEin || undefined,
    });
    handleClose();
  }, [result, editedMatches, issuerName, issuerEin, onApply]);

  const handleClose = useCallback(() => {
    setStep('paste');
    setRawText('');
    setResult(null);
    setEditedMatches([]);
    setIssuerName('');
    setIssuerEin('');
    onOpenChange(false);
  }, [onOpenChange]);

  const updateMatchValue = useCallback(
    (index: number, value: number | string | boolean) => {
      setEditedMatches((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], value };
        return next;
      });
    },
    []
  );

  const removeMatch = useCallback((index: number) => {
    setEditedMatches((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardPaste className="size-4" />
            Paste from PDF
          </DialogTitle>
          <DialogDescription>
            {step === 'paste'
              ? 'Copy all text from your PDF form and paste it below. We\'ll extract the values automatically.'
              : `Found ${editedMatches.length} field${editedMatches.length !== 1 ? 's' : ''}. Review and edit before applying.`}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          {step === 'paste' && (
            <div className="space-y-3">
              <Textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste your form text here..."
                rows={10}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Tip: Open the PDF, press Ctrl+A (Cmd+A) to select all, then Ctrl+C (Cmd+C) to copy.
              </p>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-4">
              {/* Issuer info */}
              {(issuerName || issuerEin) && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">
                    {formType === 'W-2' ? 'Employer' : 'Payer'} Info
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {issuerName && (
                      <div>
                        <label className="text-xs text-muted-foreground">Name</label>
                        <Input
                          value={issuerName}
                          onChange={(e) => setIssuerName(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    )}
                    {issuerEin && (
                      <div>
                        <label className="text-xs text-muted-foreground">EIN</label>
                        <Input
                          value={issuerEin}
                          onChange={(e) => setIssuerEin(e.target.value.replace(/\D/g, '').slice(0, 9))}
                          className="h-8 text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Matched fields */}
              {editedMatches.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Matched Fields</h4>
                  <div className="divide-y rounded-md border">
                    {editedMatches.map((match, i) => {
                      const def = boxDefs.find((d) => d.key === match.key);
                      const isMoney = def?.type === 'money';
                      const isCheckbox = def?.type === 'checkbox';
                      const conf = CONFIDENCE_BADGE[match.confidence];

                      return (
                        <div
                          key={match.key}
                          className="flex items-center gap-2 px-3 py-2"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-sm">{match.label}</span>
                          </div>
                          <Badge variant={conf.variant} className="shrink-0">
                            {conf.label}
                          </Badge>
                          <div className="w-32 shrink-0">
                            {isMoney && (
                              <MoneyInput
                                value={match.value as number}
                                onChange={(v) => updateMatchValue(i, v)}
                                className="h-8 text-sm"
                              />
                            )}
                            {isCheckbox && (
                              <span className="text-sm text-muted-foreground">
                                Checked
                              </span>
                            )}
                            {!isMoney && !isCheckbox && (
                              <Input
                                value={match.value as string}
                                onChange={(e) =>
                                  updateMatchValue(i, e.target.value)
                                }
                                className="h-8 text-sm"
                              />
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-7 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeMatch(i)}
                          >
                            &times;
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Unmatched values */}
              {result && result.unmatched.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">
                    Unmatched values
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {result.unmatched.map((token, i) => (
                      <Badge key={i} variant="outline" className="font-mono">
                        {token.type === 'money'
                          ? formatCents(token.value as number)
                          : token.raw}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {editedMatches.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No fields could be extracted. Try a different form type or paste different text.
                </p>
              )}
            </div>
          )}
        </DialogBody>

        <DialogFooter className="flex-row gap-2 sm:flex-row sm:justify-end">
          {step === 'paste' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleExtract} disabled={!rawText.trim()}>
                Extract
              </Button>
            </>
          )}
          {step === 'review' && (
            <>
              <Button variant="outline" onClick={() => setStep('paste')}>
                Back
              </Button>
              <Button onClick={handleApply} disabled={editedMatches.length === 0}>
                Apply {editedMatches.length} Field{editedMatches.length !== 1 ? 's' : ''}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
