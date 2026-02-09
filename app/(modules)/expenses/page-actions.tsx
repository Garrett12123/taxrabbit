'use client';

import { useState } from 'react';
import { Plus, Settings2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ExpenseFormDialog } from '@/components/expenses/expense-form-dialog';
import { CategoryManager } from '@/components/expenses/category-manager';
import { ExportCsvButton } from '@/components/common/export-csv-button';
import type { CustomCategoryRecord } from '@/server/db/dal/custom-categories';

type ExpensePageActionsProps = {
  year: number;
  customCategories: CustomCategoryRecord[];
  variant?: 'default' | 'empty';
};

export function ExpensePageActions({
  year,
  customCategories,
  variant = 'default',
}: ExpensePageActionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);

  const customCategoryNames = customCategories.map((c) => c.name);

  if (variant === 'empty') {
    return (
      <>
        <Button size="lg" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          Add Your First Expense
        </Button>

        <ExpenseFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          year={year}
          customCategories={customCategoryNames}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <ExportCsvButton module="expenses" year={year} />
        <Button variant="outline" onClick={() => setCategoryManagerOpen(true)}>
          <Settings2 className="size-4" />
          Categories
        </Button>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          New Expense
        </Button>
      </div>

      <ExpenseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        year={year}
        customCategories={customCategoryNames}
      />

      <CategoryManager
        open={categoryManagerOpen}
        onOpenChange={setCategoryManagerOpen}
        year={year}
        customCategories={customCategories}
      />
    </>
  );
}
