'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { IncomeFormDialog } from '@/components/forms/income-form-dialog';
import { IncomeDeleteDialog } from '@/components/forms/income-delete-dialog';
import type { IncomeDocumentDecrypted } from '@/lib/types/income';

type DetailPageActionsProps = {
  document: IncomeDocumentDecrypted;
};

export function DetailPageActions({ document: doc }: DetailPageActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => router.push('/income')}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="size-4" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDeleteOpen(true)}
          className="text-destructive"
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>

      <IncomeFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        year={doc.year}
        editDocument={doc}
      />

      <IncomeDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.push('/income')}
        documentId={doc.id}
        formType={doc.formType}
        issuerName={doc.payload.issuerName}
      />
    </>
  );
}
