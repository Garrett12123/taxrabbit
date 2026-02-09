'use client';

import { CheckCircle2, AlertCircle } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  EXPENSE_FIELD_TARGETS,
  type ColumnMapping,
  type ExpenseFieldTarget,
} from '@/lib/csv/column-mapping';

type CsvMapperStepProps = {
  headers: string[];
  previewRows: string[][];
  mappings: ColumnMapping[];
  onMappingsChange: (mappings: ColumnMapping[]) => void;
};

const REQUIRED_FIELDS: ExpenseFieldTarget[] = ['date', 'vendor', 'amount'];

const TARGET_LABELS: Record<ExpenseFieldTarget | 'skip', string> = {
  date: 'Date',
  vendor: 'Vendor',
  amount: 'Amount',
  category: 'Category',
  notes: 'Notes',
  description: 'Description',
  entityType: 'Entity Type',
  paymentMethod: 'Payment Method',
  skip: 'Skip',
};

export function CsvMapperStep({
  headers,
  previewRows,
  mappings,
  onMappingsChange,
}: CsvMapperStepProps) {
  const mappedTargets = new Set(
    mappings.map((m) => m.target).filter((t) => t !== 'skip')
  );

  const handleTargetChange = (
    index: number,
    target: ExpenseFieldTarget | 'skip'
  ) => {
    const updated = mappings.map((m, i) =>
      i === index ? { ...m, target } : m
    );
    onMappingsChange(updated);
  };

  const missingRequired = REQUIRED_FIELDS.filter(
    (f) => !mappedTargets.has(f)
  );

  return (
    <div className="space-y-4">
      {missingRequired.length > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm">
          <AlertCircle className="size-4 text-destructive shrink-0" />
          <span>
            Required fields not mapped:{' '}
            {missingRequired.map((f) => TARGET_LABELS[f]).join(', ')}
          </span>
        </div>
      )}

      {missingRequired.length === 0 && (
        <div className="flex items-center gap-2 rounded-md border border-green-500/50 bg-green-500/5 p-3 text-sm">
          <CheckCircle2 className="size-4 text-green-600 shrink-0" />
          <span>All required fields mapped. Ready to validate.</span>
        </div>
      )}

      <div className="rounded-md border overflow-auto max-h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">CSV Column</TableHead>
              <TableHead className="w-[200px]">Map To</TableHead>
              <TableHead>Sample Values</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {headers.map((header, idx) => {
              const mapping = mappings[idx];
              const isRequired =
                mapping &&
                mapping.target !== 'skip' &&
                REQUIRED_FIELDS.includes(mapping.target as ExpenseFieldTarget);

              return (
                <TableRow key={idx}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {header}
                      {isRequired && (
                        <Badge variant="secondary" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={mapping?.target ?? 'skip'}
                      onValueChange={(v) =>
                        handleTargetChange(
                          idx,
                          v as ExpenseFieldTarget | 'skip'
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">Skip</SelectItem>
                        {EXPENSE_FIELD_TARGETS.map((target) => (
                          <SelectItem
                            key={target}
                            value={target}
                            disabled={
                              mappedTargets.has(target) &&
                              mapping?.target !== target
                            }
                          >
                            {TARGET_LABELS[target]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {previewRows
                      .slice(0, 3)
                      .map((row) => row[idx] ?? '')
                      .filter(Boolean)
                      .join(' | ')}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
