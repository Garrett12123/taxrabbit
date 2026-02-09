'use client';

import { useState, useTransition } from 'react';
import { Plus, Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ExpenseFormDialog } from '@/components/expenses/expense-form-dialog';
import { copyProfileForwardAction } from '@/app/(modules)/llc/actions';

type LlcPageActionsProps = {
  year: number;
  hasProfile: boolean;
  hasPreviousProfile: boolean;
  customCategories?: string[];
};

export function LlcPageActions({
  year,
  hasProfile,
  hasPreviousProfile,
  customCategories = [],
}: LlcPageActionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [copyError, setCopyError] = useState<string | null>(null);

  const handleCopyForward = () => {
    setCopyError(null);
    startTransition(async () => {
      const result = await copyProfileForwardAction(year);
      if (result?.error) {
        setCopyError(result.error);
      }
    });
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {!hasProfile && hasPreviousProfile && (
          <Button
            variant="outline"
            onClick={handleCopyForward}
            disabled={isPending}
          >
            <Copy className="size-4" />
            {isPending ? 'Copying…' : 'Copy from Previous Year'}
          </Button>
        )}
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          Add Expense
        </Button>
      </div>

      {copyError && (
        <p className="text-sm text-destructive">{copyError}</p>
      )}

      <ExpenseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        year={year}
        defaultEntityType="business"
        customCategories={customCategories}
      />
    </>
  );
}
