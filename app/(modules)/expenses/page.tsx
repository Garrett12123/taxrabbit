import { Suspense } from 'react';
import { Receipt } from 'lucide-react';

import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { ExpenseSummaryCards } from '@/components/expenses/expense-summary-cards';
import { ExpenseFilters } from '@/components/expenses/expense-filters';
import { ExpenseTable } from '@/components/expenses/expense-table';
import { ExpensePageActions } from './page-actions';
import {
  listExpensesByYear,
  getExpenseSummary,
} from '@/server/services/expense-service';
import { listCustomCategories } from '@/server/db/dal/custom-categories';
import { computeAuditFlags, hasAuditWarnings } from '@/lib/audit';
import { getLinkedEntityIds } from '@/server/db/dal/document-files';
import { getDefaultTaxYear } from '@/server/services/settings-service';
import { TAX_YEARS } from '@/lib/constants';

type ExpensesPageProps = {
  searchParams: Promise<{
    year?: string;
    category?: string;
    entityType?: string;
    month?: string;
  }>;
};

export default async function ExpensesPage({
  searchParams,
}: ExpensesPageProps) {
  const params = await searchParams;
  const yearParam = params.year ? Number(params.year) : null;
  const year =
    yearParam && !isNaN(yearParam) && (TAX_YEARS as readonly number[]).includes(yearParam)
      ? yearParam
      : getDefaultTaxYear();
  const category = params.category;
  const entityType = params.entityType as
    | 'personal'
    | 'business'
    | undefined;
  const month = params.month;

  // Build date range from month filter
  let startDate: string | undefined;
  let endDate: string | undefined;
  if (month) {
    const paddedMonth = String(month).padStart(2, '0');
    startDate = `${year}-${paddedMonth}-01`;
    const lastDay = new Date(year, Number(month), 0).getDate();
    endDate = `${year}-${paddedMonth}-${String(lastDay).padStart(2, '0')}`;
  }

  const [expenses, summary, customCategories] = await Promise.all([
    listExpensesByYear(year, {
      category,
      entityType,
      startDate,
      endDate,
    }),
    Promise.resolve(getExpenseSummary(year)),
    Promise.resolve(listCustomCategories(year)),
  ]);

  const customCategoryNames = customCategories.map((c) => c.name);
  const linkedExpenseIds = getLinkedEntityIds('expense');

  const rows = expenses.map((expense) => {
    const hasLinkedDocument = linkedExpenseIds.has(expense.id);
    const auditFlags = computeAuditFlags({
      category: expense.category,
      receiptRef: expense.payload.receiptRef,
      notes: expense.payload.notes,
      hasLinkedDocument,
    });
    return { expense, auditFlags, hasLinkedDocument };
  });

  const needsAttentionCount = rows.filter((r) =>
    hasAuditWarnings(r.auditFlags)
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Expenses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track and categorize personal and business expenses for {year}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Suspense fallback={<Skeleton className="h-9 w-80" />}>
            <ExpenseFilters customCategories={customCategoryNames} />
          </Suspense>
          <ExpensePageActions year={year} customCategories={customCategories} />
        </div>
      </div>

      <ExpenseSummaryCards
        totalAll={summary.totalAll}
        totalPersonal={summary.totalPersonal}
        totalBusiness={summary.totalBusiness}
        needsAttentionCount={needsAttentionCount}
      />

      {expenses.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Receipt />
            </EmptyMedia>
            <EmptyTitle>No expenses yet</EmptyTitle>
            <EmptyDescription>
              Add your first expense to start tracking and categorizing.
            </EmptyDescription>
          </EmptyHeader>
          <ExpensePageActions year={year} customCategories={customCategories} variant="empty" />
        </Empty>
      ) : (
        <ExpenseTable
          rows={rows}
          year={year}
          customCategories={customCategoryNames}
        />
      )}
    </div>
  );
}
