'use client';

import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2, AlertTriangle, CheckCircle2, Paperclip } from 'lucide-react';

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ExpenseFormDialog } from '@/components/expenses/expense-form-dialog';
import { ExpenseDeleteDialog } from '@/components/expenses/expense-delete-dialog';
import { formatCents, cn } from '@/lib/utils';
import type { AuditFlag } from '@/lib/audit';
import type { ExpenseDecrypted } from '@/server/db/dal/expenses';

type ExpenseTableRow = {
  expense: ExpenseDecrypted;
  auditFlags: AuditFlag[];
  hasLinkedDocument?: boolean;
};

type ExpenseTableProps = {
  rows: ExpenseTableRow[];
  year: number;
  customCategories?: string[];
};

export function ExpenseTable({ rows, year, customCategories }: ExpenseTableProps) {
  const [editExpense, setEditExpense] = useState<ExpenseDecrypted | null>(null);
  const [deleteExpense, setDeleteExpense] = useState<{
    id: string;
    vendor: string;
  } | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Date</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Receipt</TableHead>
            <TableHead>Audit</TableHead>
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ expense, auditFlags, hasLinkedDocument }) => (
            <TableRow 
              key={expense.id}
              className="group/row"
            >
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {expense.date}
              </TableCell>
              <TableCell className="font-medium">
                {expense.payload.vendor}
              </TableCell>
              <TableCell>
                <Badge 
                  variant="outline" 
                  className="transition-colors duration-150 group-hover/row:bg-muted"
                >
                  {expense.category}
                </Badge>
              </TableCell>
              <TableCell className="capitalize text-muted-foreground">
                {expense.entityType}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums font-medium">
                {formatCents(expense.amount)}
              </TableCell>
              <TableCell>
                {hasLinkedDocument && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="p-1 -m-1">
                        <Paperclip className="size-4 text-muted-foreground" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Document linked</TooltipContent>
                  </Tooltip>
                )}
              </TableCell>
              <TableCell>
                {auditFlags.length > 0 ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "rounded-md p-1 -m-1",
                          "transition-all duration-150",
                          "hover:bg-amber-500/10",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                        )}
                        aria-label="View audit warnings"
                      >
                        <AlertTriangle className="size-5 text-amber-500 transition-transform duration-150 hover:scale-110" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <ul className="space-y-1.5 text-xs">
                        {auditFlags.map((f) => (
                          <li key={f.code} className="flex items-start gap-2">
                            <span className="size-1 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                            {f.message}
                          </li>
                        ))}
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <div className="p-1 -m-1">
                    <CheckCircle2 className="size-5 text-positive transition-transform duration-150 group-hover/row:scale-110" />
                  </div>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon-sm"
                      className={cn(
                        "opacity-0 group-hover/row:opacity-100",
                        "focus-visible:opacity-100",
                        "transition-opacity duration-150"
                      )}
                    >
                      <MoreHorizontal className="size-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[140px]">
                    <DropdownMenuItem
                      onClick={() => setEditExpense(expense)}
                      className="gap-2"
                    >
                      <Pencil className="size-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        setDeleteExpense({
                          id: expense.id,
                          vendor: expense.payload.vendor,
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

      {editExpense && (
        <ExpenseFormDialog
          open={!!editExpense}
          onOpenChange={(open) => !open && setEditExpense(null)}
          year={year}
          editExpense={editExpense}
          customCategories={customCategories}
        />
      )}

      {deleteExpense && (
        <ExpenseDeleteDialog
          open={!!deleteExpense}
          onOpenChange={(open) => !open && setDeleteExpense(null)}
          expenseId={deleteExpense.id}
          vendor={deleteExpense.vendor}
        />
      )}
    </>
  );
}
