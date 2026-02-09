'use client';

import { useCallback, useState, useTransition } from 'react';
import { CheckCircle2, Car } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CsvUploadStep } from './csv-upload-step';
import {
  parseCsvAction,
  validateMileageImportAction,
  commitMileageImportAction,
} from '@/app/(modules)/imports/actions';
import {
  autoDetectMileageMappings,
  validateMileageMappings,
  MILEAGE_FIELD_TARGETS,
  type MileageColumnMapping,
  type MileageFieldTarget,
} from '@/lib/csv/column-mapping';
import type { MileageRowParsed, MileageRowValidationResult } from '@/lib/validation/csv-import';

type MileageImportWizardProps = {
  year: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (insertedCount: number) => void;
};

type Step = 'upload' | 'map' | 'preview' | 'success';

const STEP_NUMBERS: Record<Step, number> = {
  upload: 1,
  map: 2,
  preview: 3,
  success: 3,
};

const STEP_LABELS = ['Upload', 'Map Columns', 'Preview & Import'];

const FIELD_LABELS: Record<MileageFieldTarget, string> = {
  date: 'Date',
  miles: 'Miles',
  purpose: 'Purpose',
  destination: 'Destination',
  notes: 'Notes',
  isRoundTrip: 'Round Trip',
};

export function MileageImportWizard({
  year,
  open,
  onOpenChange,
  onComplete,
}: MileageImportWizardProps) {
  const [step, setStep] = useState<Step>('upload');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // State across steps
  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState('');
  const [, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [mappings, setMappings] = useState<MileageColumnMapping[]>([]);
  const [validationResults, setValidationResults] = useState<MileageRowValidationResult[]>([]);
  const [validData, setValidData] = useState<MileageRowParsed[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [validRowCount, setValidRowCount] = useState(0);
  const [errorRowCount, setErrorRowCount] = useState(0);
  const [insertedCount, setInsertedCount] = useState(0);

  const reset = useCallback(() => {
    setStep('upload');
    setError(null);
    setCsvText('');
    setFileName('');
    setHeaders([]);
    setPreviewRows([]);
    setMappings([]);
    setValidationResults([]);
    setValidData([]);
    setTotalRows(0);
    setValidRowCount(0);
    setErrorRowCount(0);
    setInsertedCount(0);
  }, []);

  const handleFileLoaded = useCallback((text: string, name: string) => {
    setCsvText(text);
    setFileName(name);
    setError(null);

    startTransition(async () => {
      const result = await parseCsvAction(text);
      if (result.error) {
        setError(result.error);
        return;
      }
      setHeaders(result.headers);
      setPreviewRows(result.previewRows);
      setTotalRows(result.totalRows);
      setMappings(autoDetectMileageMappings(result.headers));
      setStep('map');
    });
  }, []);

  const handleMappingChange = useCallback((index: number, target: MileageFieldTarget | 'skip') => {
    setMappings(prev => {
      const newMappings = [...prev];
      newMappings[index] = { ...newMappings[index], target };
      return newMappings;
    });
  }, []);

  const handleValidate = useCallback(() => {
    setError(null);
    const mappingResult = validateMileageMappings(mappings);
    if (!mappingResult.valid) {
      setError(`Required fields not mapped: ${mappingResult.missingRequired.map(f => FIELD_LABELS[f]).join(', ')}`);
      return;
    }

    startTransition(async () => {
      const result = await validateMileageImportAction(csvText, mappings, { year });
      if (result.error) {
        setError(result.error);
        return;
      }

      setValidationResults(result.validationResults);
      setValidData(result.validData);
      setTotalRows(result.totalRows);
      setValidRowCount(result.validRows);
      setErrorRowCount(result.errorRows);
      setStep('preview');
    });
  }, [csvText, mappings, year]);

  const handleCommit = useCallback(() => {
    setError(null);
    startTransition(async () => {
      const result = await commitMileageImportAction(validData, { year });
      if (!result.success) {
        setError(result.error ?? 'Import failed.');
        return;
      }
      setInsertedCount(result.insertedCount);
      setStep('success');
      onComplete(result.insertedCount);
    });
  }, [validData, year, onComplete]);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  }, [onOpenChange, reset]);

  const currentStepNum = STEP_NUMBERS[step];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Car className="size-5 text-muted-foreground" />
            <DialogTitle>Import Mileage from CSV</DialogTitle>
          </div>
          <DialogDescription>
            {fileName ? `File: ${fileName}` : 'Upload a CSV file to import mileage logs.'}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 pb-2">
          {STEP_LABELS.map((label, idx) => {
            const num = idx + 1;
            const isActive = currentStepNum === num;
            const isComplete = currentStepNum > num;
            return (
              <div key={label} className="flex items-center gap-2">
                {idx > 0 && (
                  <div className={`h-px w-8 ${isComplete ? 'bg-primary' : 'bg-border'}`} />
                )}
                <div className="flex items-center gap-1.5">
                  <div
                    className={`flex size-6 items-center justify-center rounded-full text-xs font-medium ${
                      isActive || isComplete
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isComplete ? <CheckCircle2 className="size-4" /> : num}
                  </div>
                  <span className={`text-xs ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                    {label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="flex-1 min-h-0 overflow-auto">
          {step === 'upload' && (
            <>
              {isPending ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner className="size-6" />
                  <span className="ml-2 text-sm text-muted-foreground">Parsing CSV...</span>
                </div>
              ) : (
                <CsvUploadStep onFileLoaded={handleFileLoaded} />
              )}
            </>
          )}

          {step === 'map' && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Map your CSV columns to mileage fields. Date and Miles are required.
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">CSV Column</th>
                      <th className="px-3 py-2 text-left font-medium">Sample Data</th>
                      <th className="px-3 py-2 text-left font-medium">Map To</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {mappings.map((mapping, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 font-mono text-xs">{mapping.csvColumn}</td>
                        <td className="px-3 py-2 text-muted-foreground truncate max-w-[200px]">
                          {previewRows[0]?.[idx] ?? '—'}
                        </td>
                        <td className="px-3 py-2">
                          <Select
                            value={mapping.target}
                            onValueChange={(v) => handleMappingChange(idx, v as MileageFieldTarget | 'skip')}
                          >
                            <SelectTrigger className="h-8 w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="skip">Skip</SelectItem>
                              {MILEAGE_FIELD_TARGETS.map((target) => (
                                <SelectItem key={target} value={target}>
                                  {FIELD_LABELS[target]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('upload');
                    setError(null);
                  }}
                  disabled={isPending}
                >
                  Back
                </Button>
                <Button onClick={handleValidate} disabled={isPending}>
                  {isPending ? (
                    <>
                      <Spinner className="size-4" />
                      Validating...
                    </>
                  ) : (
                    'Validate & Preview'
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold">{totalRows}</p>
                  <p className="text-xs text-muted-foreground">Total Rows</p>
                </div>
                <div className="rounded-lg border p-4 text-center bg-green-500/5">
                  <p className="text-2xl font-bold text-green-600">{validRowCount}</p>
                  <p className="text-xs text-muted-foreground">Valid</p>
                </div>
                <div className="rounded-lg border p-4 text-center bg-red-500/5">
                  <p className="text-2xl font-bold text-red-600">{errorRowCount}</p>
                  <p className="text-xs text-muted-foreground">Errors</p>
                </div>
              </div>

              {errorRowCount > 0 && (
                <div className="border rounded-lg p-3 bg-destructive/5">
                  <p className="text-sm font-medium text-destructive mb-2">Rows with errors:</p>
                  <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                    {validationResults
                      .filter((r) => r.status === 'error')
                      .slice(0, 10)
                      .map((r) => (
                        <div key={r.rowIndex} className="text-muted-foreground">
                          Row {r.rowIndex + 1}: {r.errors?.map((e) => e.message).join(', ')}
                        </div>
                      ))}
                    {errorRowCount > 10 && (
                      <div className="text-muted-foreground">...and {errorRowCount - 10} more</div>
                    )}
                  </div>
                </div>
              )}

              {validRowCount > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <p className="text-sm font-medium px-3 py-2 bg-muted/50">Preview (first 5 valid rows)</p>
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="px-3 py-1.5 text-left">Date</th>
                        <th className="px-3 py-1.5 text-right">Miles</th>
                        <th className="px-3 py-1.5 text-left">Purpose</th>
                        <th className="px-3 py-1.5 text-center">Round Trip</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {validData.slice(0, 5).map((row, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-1.5">{row.date}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums">{(row.miles / 100).toFixed(1)}</td>
                          <td className="px-3 py-1.5 truncate max-w-[150px]">{row.purpose || '—'}</td>
                          <td className="px-3 py-1.5 text-center">{row.isRoundTrip ? 'Yes' : 'No'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('map');
                    setError(null);
                  }}
                  disabled={isPending}
                >
                  Back
                </Button>
                <Button onClick={handleCommit} disabled={isPending || validRowCount === 0}>
                  {isPending ? (
                    <>
                      <Spinner className="size-4" />
                      Importing...
                    </>
                  ) : (
                    `Import ${validRowCount} Trip${validRowCount !== 1 ? 's' : ''}`
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <div className="rounded-full bg-green-500/10 p-4">
                <CheckCircle2 className="size-10 text-green-600" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium">Import Complete</p>
                <p className="text-sm text-muted-foreground">
                  Successfully imported {insertedCount} mileage log{insertedCount !== 1 ? 's' : ''}.
                </p>
              </div>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-destructive text-center">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}
