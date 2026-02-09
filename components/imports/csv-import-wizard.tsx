'use client';

import { useCallback, useState, useTransition } from 'react';
import { CheckCircle2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { CsvUploadStep } from './csv-upload-step';
import { CsvMapperStep } from './csv-mapper-step';
import { CsvPreviewStep } from './csv-preview-step';
import {
  parseCsvAction,
  validateImportAction,
  commitImportAction,
} from '@/app/(modules)/imports/actions';
import {
  autoDetectMappings,
  validateMappings,
  type ColumnMapping,
} from '@/lib/csv/column-mapping';
import type {
  CsvRowParsed,
  RowValidationResult,
} from '@/lib/validation/csv-import';

type CsvImportWizardProps = {
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

export function CsvImportWizard({
  year,
  open,
  onOpenChange,
  onComplete,
}: CsvImportWizardProps) {
  const [step, setStep] = useState<Step>('upload');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // State across steps
  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [validationResults, setValidationResults] = useState<
    RowValidationResult[]
  >([]);
  const [validData, setValidData] = useState<CsvRowParsed[]>([]);
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

  const handleFileLoaded = useCallback(
    (text: string, name: string) => {
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
        setMappings(autoDetectMappings(result.headers));
        setStep('map');
      });
    },
    []
  );

  const handleValidate = useCallback(() => {
    setError(null);
    const mappingResult = validateMappings(mappings);
    if (!mappingResult.valid) {
      setError(
        `Required fields not mapped: ${mappingResult.missingRequired.join(', ')}`
      );
      return;
    }

    startTransition(async () => {
      const result = await validateImportAction(csvText, mappings, {
        year,
      });

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
      const result = await commitImportAction(validData, { year });

      if (!result.success) {
        setError(result.error ?? 'Import failed.');
        return;
      }

      setInsertedCount(result.insertedCount);
      setStep('success');
      onComplete(result.insertedCount);
    });
  }, [validData, year, onComplete]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) reset();
      onOpenChange(open);
    },
    [onOpenChange, reset]
  );

  const currentStepNum = STEP_NUMBERS[step];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Import Expenses from CSV</DialogTitle>
          <DialogDescription>
            {fileName
              ? `File: ${fileName}`
              : 'Upload a CSV file to import expenses.'}
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
                  <div
                    className={`h-px w-8 ${
                      isComplete ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                )}
                <div className="flex items-center gap-1.5">
                  <div
                    className={`flex size-6 items-center justify-center rounded-full text-xs font-medium ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : isComplete
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      num
                    )}
                  </div>
                  <span
                    className={`text-xs ${
                      isActive
                        ? 'font-medium'
                        : 'text-muted-foreground'
                    }`}
                  >
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
                  <span className="ml-2 text-sm text-muted-foreground">
                    Parsing CSV...
                  </span>
                </div>
              ) : (
                <CsvUploadStep onFileLoaded={handleFileLoaded} />
              )}
            </>
          )}

          {step === 'map' && (
            <div className="space-y-4">
              <CsvMapperStep
                headers={headers}
                previewRows={previewRows}
                mappings={mappings}
                onMappingsChange={setMappings}
              />
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
            <CsvPreviewStep
              totalRows={totalRows}
              validRows={validRowCount}
              errorRows={errorRowCount}
              validationResults={validationResults}
              validData={validData}
              onCommit={handleCommit}
              onBack={() => {
                setStep('map');
                setError(null);
              }}
              isCommitting={isPending}
            />
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <div className="rounded-full bg-green-500/10 p-4">
                <CheckCircle2 className="size-10 text-green-600" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium">Import Complete</p>
                <p className="text-sm text-muted-foreground">
                  Successfully imported {insertedCount} expense
                  {insertedCount !== 1 ? 's' : ''}.
                </p>
              </div>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
