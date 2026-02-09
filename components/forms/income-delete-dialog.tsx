'use client';

import { useTransition } from 'react';

import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteIncomeAction } from '@/app/(modules)/income/actions';

type IncomeDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
  documentId: string;
  formType: string;
  issuerName: string;
};

export function IncomeDeleteDialog({
  open,
  onOpenChange,
  onDeleted,
  documentId,
  formType,
  issuerName,
}: IncomeDeleteDialogProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteIncomeAction(documentId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      onOpenChange(false);
      onDeleted?.();
      toast.success(`${formType} deleted.`);
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {formType}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the {formType} from {issuerName}. This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
