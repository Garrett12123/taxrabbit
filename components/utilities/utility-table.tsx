'use client';

import { useState, useMemo, useTransition } from 'react';
import { MoreHorizontal, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { UtilityFormDialog } from './utility-form-dialog';
import { deleteUtilityBillAction } from '@/app/(modules)/utilities/actions';
import { formatCents, cn } from '@/lib/utils';
import type { UtilityBillDecrypted } from '@/server/db/dal/utility-bills';

const PAGE_SIZES = [10, 25, 50] as const;

type UtilityTableProps = {
  bills: UtilityBillDecrypted[];
  year: number;
};

export function UtilityTable({ bills, year }: UtilityTableProps) {
  const [editBill, setEditBill] = useState<UtilityBillDecrypted | null>(null);
  const [deleteBill, setDeleteBill] = useState<{
    id: string;
    provider: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);

  const totalPages = Math.max(1, Math.ceil(bills.length / pageSize));
  const clampedPage = Math.min(page, totalPages - 1);

  const paginatedBills = useMemo(() => {
    const start = clampedPage * pageSize;
    return bills.slice(start, start + pageSize);
  }, [bills, clampedPage, pageSize]);

  const handlePageSizeChange = (size: string) => {
    setPageSize(Number(size));
    setPage(0);
  };

  const handleDelete = () => {
    if (!deleteBill) return;
    startTransition(async () => {
      await deleteUtilityBillAction(deleteBill.id);
      setDeleteBill(null);
    });
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedBills.map((bill) => (
            <TableRow key={bill.id} className="group/row">
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {bill.billDate}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className="transition-colors duration-150 group-hover/row:bg-muted"
                >
                  {bill.utilityType}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">
                {bill.payload.provider}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {bill.payload.usage != null && bill.payload.usage > 0
                  ? `${bill.payload.usage} ${bill.payload.usageUnit ?? ''}`
                  : '—'}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums font-medium">
                {formatCents(bill.amount)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className={cn(
                        'opacity-0 group-hover/row:opacity-100',
                        'focus-visible:opacity-100',
                        'transition-opacity duration-150'
                      )}
                    >
                      <MoreHorizontal className="size-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[140px]">
                    <DropdownMenuItem
                      onClick={() => setEditBill(bill)}
                      className="gap-2"
                    >
                      <Pencil className="size-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        setDeleteBill({
                          id: bill.id,
                          provider: bill.payload.provider,
                        })
                      }
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {bills.length > PAGE_SIZES[0] && (
        <div className="flex items-center justify-between border-t pt-4 mt-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Rows per page</span>
            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="h-8 w-[70px]" aria-label="Rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground tabular-nums">
              {clampedPage * pageSize + 1}–{Math.min((clampedPage + 1) * pageSize, bills.length)} of {bills.length}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={clampedPage === 0}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={clampedPage >= totalPages - 1}
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {editBill && (
        <UtilityFormDialog
          open={!!editBill}
          onOpenChange={(open) => !open && setEditBill(null)}
          year={year}
          editBill={editBill}
        />
      )}

      <AlertDialog
        open={!!deleteBill}
        onOpenChange={(open) => !open && setDeleteBill(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Utility Bill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the bill from{' '}
              <span className="font-medium text-foreground">
                {deleteBill?.provider}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending && <Spinner className="size-4" />}
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
