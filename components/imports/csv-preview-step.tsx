'use client';

import { CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { formatCents } from '@/lib/utils';
import type { CsvRowParsed, RowValidationResult } from '@/lib/validation/csv-import';

type CsvPreviewStepProps = {
  totalRows: number;
  validRows: number;
  errorRows: number;
  validationResults: RowValidationResult[];
  validData: CsvRowParsed[];
  onCommit: () => void;
  onBack: () => void;
  isCommitting: boolean;
};

export function CsvPreviewStep({
  totalRows,
  validRows,
  errorRows,
  validationResults,
  validData,
  onCommit,
  onBack,
  isCommitting,
}: CsvPreviewStepProps) {
  const errorResults = validationResults.filter((r) => r.status === 'error');

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-md border p-3 text-center">
          <p className="text-2xl font-bold">{totalRows}</p>
          <p className="text-xs text-muted-foreground">Total Rows</p>
        </div>
        <div className="rounded-md border border-green-500/30 bg-green-500/5 p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{validRows}</p>
          <p className="text-xs text-muted-foreground">Valid</p>
        </div>
        <div
          className={`rounded-md border p-3 text-center ${
            errorRows > 0
              ? 'border-destructive/30 bg-destructive/5'
              : 'border-muted'
          }`}
        >
          <p
            className={`text-2xl font-bold ${
              errorRows > 0 ? 'text-destructive' : ''
            }`}
          >
            {errorRows}
          </p>
          <p className="text-xs text-muted-foreground">Errors</p>
        </div>
      </div>

      {/* Error Table */}
      {errorResults.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-destructive">
            <AlertCircle className="size-4" />
            Rows with errors (will be skipped)
          </div>
          <ScrollArea className="max-h-[160px]">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Row</TableHead>
                    <TableHead className="w-[120px]">Field</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errorResults.map((result) =>
                    result.errors?.map((err, errIdx) => (
                      <TableRow key={`${result.rowIndex}-${errIdx}`}>
                        <TableCell>{result.rowIndex + 2}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{err.field}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {err.message}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Preview Table */}
      {validData.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-green-600">
            <CheckCircle2 className="size-4" />
            Preview of valid rows (first 20)
          </div>
          <ScrollArea className="max-h-[200px]">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Entity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validData.slice(0, 20).map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {row.vendor}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCents(row.amount)}
                      </TableCell>
                      <TableCell>{row.category}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.entityType}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={onBack} disabled={isCommitting}>
          Back
        </Button>
        <div className="flex items-center gap-3">
          {errorRows > 0 && validRows > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <AlertTriangle className="size-3" />
              {errorRows} row{errorRows !== 1 ? 's' : ''} will be skipped
            </div>
          )}
          <Button
            onClick={onCommit}
            disabled={validRows === 0 || isCommitting}
          >
            {isCommitting ? (
              <>
                <Spinner className="size-4" />
                Importing...
              </>
            ) : errorRows > 0 ? (
              `Import ${validRows} of ${totalRows} expenses`
            ) : (
              `Import ${validRows} expense${validRows !== 1 ? 's' : ''}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
