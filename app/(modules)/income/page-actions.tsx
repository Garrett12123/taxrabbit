'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { IncomeFormDialog } from '@/components/forms/income-form-dialog';
import { ExportCsvButton } from '@/components/common/export-csv-button';

type IncomePageActionsProps = {
  year: number;
  variant?: 'default' | 'empty';
};

export function IncomePageActions({ year, variant = 'default' }: IncomePageActionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        {variant !== 'empty' && <ExportCsvButton module="income" year={year} />}
        <Button
          onClick={() => setDialogOpen(true)}
          size={variant === 'empty' ? 'lg' : 'default'}
        >
          <Plus className="size-4" />
          {variant === 'empty' ? 'Add Your First Form' : 'New Form'}
        </Button>
      </div>

      <IncomeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        year={year}
      />
    </>
  );
}
