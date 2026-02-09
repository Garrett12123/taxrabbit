'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Pencil, Eye, Trash2 } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableRowInteractive,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { CompletenessBadge } from '@/components/forms/common/completeness-badge';
import { IncomeFormDialog } from '@/components/forms/income-form-dialog';
import { IncomeDeleteDialog } from '@/components/forms/income-delete-dialog';
import { formatCents } from '@/lib/utils';
import type { CompletenessResult } from '@/lib/completeness';
import type { IncomeDocumentDecrypted } from '@/lib/types/income';

type IncomeTableRow = {
  document: IncomeDocumentDecrypted;
  completeness: CompletenessResult;
};

type IncomeTableProps = {
  rows: IncomeTableRow[];
  year: number;
};

export function IncomeTable({ rows, year }: IncomeTableProps) {
  const router = useRouter();
  const [editDoc, setEditDoc] = useState<IncomeDocumentDecrypted | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<{
    id: string;
    formType: string;
    issuerName: string;
  } | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Form Type</TableHead>
            <TableHead>Payer / Employer</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Fed Withholding</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ document: doc, completeness }) => (
            <TableRowInteractive
              key={doc.id}
              onClick={() => router.push(`/income/${doc.id}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  router.push(`/income/${doc.id}`);
                }
              }}
            >
              <TableCell>
                <Badge variant="outline">{doc.formType}</Badge>
              </TableCell>
              <TableCell className="font-medium">
                {doc.payload.issuerName}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {formatCents(doc.amount)}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {formatCents(doc.fedWithholding)}
              </TableCell>
              <TableCell>
                <CompletenessBadge completeness={completeness} />
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="size-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/income/${doc.id}`);
                      }}
                    >
                      <Eye className="size-4" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditDoc(doc);
                      }}
                    >
                      <Pencil className="size-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteDoc({
                          id: doc.id,
                          formType: doc.formType,
                          issuerName: doc.payload.issuerName,
                        });
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRowInteractive>
          ))}
        </TableBody>
      </Table>

      {editDoc && (
        <IncomeFormDialog
          open={!!editDoc}
          onOpenChange={(open) => !open && setEditDoc(null)}
          year={year}
          editDocument={editDoc}
        />
      )}

      {deleteDoc && (
        <IncomeDeleteDialog
          open={!!deleteDoc}
          onOpenChange={(open) => !open && setDeleteDoc(null)}
          documentId={deleteDoc.id}
          formType={deleteDoc.formType}
          issuerName={deleteDoc.issuerName}
        />
      )}
    </>
  );
}
