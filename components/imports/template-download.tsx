'use client';

import { useCallback } from 'react';
import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  generateTemplateCSV,
  EXPENSE_CSV_COLUMNS,
  W2_CSV_COLUMNS,
} from '@/lib/csv/templates';

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function TemplateDownload() {
  const handleExpenseTemplate = useCallback(() => {
    const csv = generateTemplateCSV(EXPENSE_CSV_COLUMNS);
    downloadCSV(csv, 'expense-template.csv');
  }, []);

  const handleW2Template = useCallback(() => {
    const csv = generateTemplateCSV(W2_CSV_COLUMNS);
    downloadCSV(csv, 'w2-template.csv');
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={handleExpenseTemplate}>
        <Download className="size-4" />
        Expense Template
      </Button>
      <Button variant="outline" onClick={handleW2Template}>
        <Download className="size-4" />
        W-2 Template
      </Button>
    </div>
  );
}
