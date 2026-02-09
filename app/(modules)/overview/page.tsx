import { TrendingUp, TrendingDown, FileText, Receipt, Upload, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardMetric,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardTabs } from '@/components/dashboard/dashboard-tabs';
import { MissingItems } from '@/components/dashboard/missing-items';
import { ConfidenceFooter } from '@/components/dashboard/confidence-footer';
import { TaxEstimateCard } from '@/components/dashboard/tax-estimate-card';
import { IncomeByTypeChart } from '@/components/charts/income-by-type-chart';
import { IncomeByPayerChart } from '@/components/charts/income-by-payer-chart';
import { ExpenseCategoryChart } from '@/components/charts/expense-category-chart';
import { ExpenseTrendChart } from '@/components/charts/expense-trend-chart';
import { ExpenseVendorChart } from '@/components/charts/expense-vendor-chart';
import {
  getDashboardOverview,
  getIncomeByType,
  getIncomeByPayer,
  getExpenseByCategory,
  getExpenseMonthly,
  getExpenseByVendor,
  getMissingItems,
  getRecentActivity,
} from '@/server/services/analytics-service';
import { estimateTaxLiability } from '@/server/services/tax-estimator-service';
import { formatCents, cn } from '@/lib/utils';
import { getDefaultTaxYear } from '@/server/services/settings-service';
import { getTaxYear, ensureTaxYear } from '@/server/db/dal/tax-years';
import { TAX_YEARS } from '@/lib/constants';
import { TaxYearStatusSelect } from '@/components/tax-year/tax-year-status-select';
import { FiledBanner } from '@/components/tax-year/filed-banner';

type OverviewPageProps = {
  searchParams: Promise<{ year?: string }>;
};

const quickStartLinks = [
  { label: 'Add W-2', href: '/income', icon: FileText },
  { label: 'Expense', href: '/expenses', icon: Receipt },
  { label: 'Upload', href: '/documents', icon: Upload },
  { label: 'Import CSV', href: '/imports', icon: FileSpreadsheet },
];

export default async function OverviewPage({
  searchParams,
}: OverviewPageProps) {
  const params = await searchParams;
  const yearParam = params.year ? Number(params.year) : null;
  const year =
    yearParam && !isNaN(yearParam) && (TAX_YEARS as readonly number[]).includes(yearParam)
      ? yearParam
      : getDefaultTaxYear();

  // Ensure tax year exists in DB (creates if not)
  ensureTaxYear(year);
  const taxYear = getTaxYear(year);
  const taxYearStatus = taxYear?.status ?? 'open';

  const [
    overview,
    incomeByType,
    incomeByPayer,
    expenseByCategory,
    expenseMonthly,
    expenseByVendor,
    missingItems,
    recentActivity,
    taxEstimate,
  ] = await Promise.all([
    getDashboardOverview(year),
    Promise.resolve(getIncomeByType(year)),
    getIncomeByPayer(year),
    Promise.resolve(getExpenseByCategory(year)),
    Promise.resolve(getExpenseMonthly(year)),
    getExpenseByVendor(year),
    getMissingItems(year),
    getRecentActivity(year),
    estimateTaxLiability(year),
  ]);

  const totalRecords =
    overview.formCount +
    (overview.totalExpenses > 0
      ? expenseByCategory.reduce((s, c) => s + c.count, 0)
      : 0) +
    overview.docCount;

  return (
    <div className="space-y-8">
      {/* Filed/Amended Banner */}
      <FiledBanner status={taxYearStatus} year={year} />

      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Overview</h1>
            <TaxYearStatusSelect year={year} currentStatus={taxYearStatus} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Your {year} tax year at a glance.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CardMetric trend="up">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Income
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums tracking-tight animate-number">
                {formatCents(overview.totalIncome)}
              </span>
              {overview.totalIncome > 0 && (
                <TrendingUp className="size-4 text-positive" />
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center size-4 rounded bg-muted text-[10px] font-medium">
                {overview.formCount}
              </span>
              form{overview.formCount !== 1 ? 's' : ''}
              <span className="text-muted-foreground/50">&middot;</span>
              {formatCents(overview.totalWithholding)} withheld
            </p>
          </CardContent>
        </CardMetric>

        <CardMetric trend="down">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums tracking-tight animate-number">
                {formatCents(overview.totalExpenses)}
              </span>
              {overview.totalExpenses > 0 && (
                <TrendingDown className="size-4 text-negative" />
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              <span className="text-positive">{formatCents(overview.totalBusiness)}</span>
              {' '}business
              <span className="text-muted-foreground/50"> &middot; </span>
              {formatCents(overview.totalPersonal)} personal
            </p>
          </CardContent>
        </CardMetric>

        <CardMetric>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold tabular-nums tracking-tight animate-number">
              {overview.docCount}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {overview.unlinkedDocs > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-warning animate-pulse" />
                  {overview.unlinkedDocs} unlinked
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-positive">
                  <span className="size-1.5 rounded-full bg-positive" />
                  All linked
                </span>
              )}
            </p>
          </CardContent>
        </CardMetric>

        <CardMetric>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold tabular-nums tracking-tight animate-number">
              {overview.checklistStats.total > 0
                ? `${overview.checklistStats.completed}/${overview.checklistStats.total}`
                : '0'}
            </div>
            {overview.checklistStats.total > 0 ? (
              <div className="mt-2 space-y-1.5">
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                    style={{ 
                      width: `${Math.round((overview.checklistStats.completed / overview.checklistStats.total) * 100)}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((overview.checklistStats.completed / overview.checklistStats.total) * 100)}% complete
                </p>
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                No checklist items
              </p>
            )}
          </CardContent>
        </CardMetric>
      </div>

      {/* Two-Column Primary Content: Action Items + Tax Estimate (left, wider) | Recent Activity (right) */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left column -- 60% */}
        <div className="space-y-6 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Action Items</CardTitle>
              <CardDescription>
                Items that may need your attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MissingItems items={missingItems} />
            </CardContent>
          </Card>

          {taxEstimate.grossIncome > 0 && (
            <TaxEstimateCard estimate={taxEstimate} year={year} />
          )}
        </div>

        {/* Right column -- 40% */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest entries and uploads
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="mx-auto size-12 rounded-full bg-muted/60 flex items-center justify-center mb-3">
                    <FileText className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No activity yet. Start by adding income forms, expenses,
                    or documents.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {recentActivity.map((item) => (
                    <Link
                      key={`${item.type}-${item.href}`}
                      href={item.href}
                      className="group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted/60"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "flex size-7 items-center justify-center rounded-md text-xs font-bold",
                          item.type === 'income' && "bg-positive/10 text-positive",
                          item.type === 'expense' && "bg-negative/10 text-negative",
                          item.type === 'document' && "bg-primary/10 text-primary"
                        )}>
                          {item.type === 'income' ? '+' : item.type === 'expense' ? '−' : '#'}
                        </div>
                        <span className="truncate font-medium">
                          {item.label}
                        </span>
                      </div>
                      {item.amount !== undefined && (
                        <span className={cn(
                          "ml-2 shrink-0 font-mono font-medium tabular-nums text-sm",
                          item.type === 'income' ? "text-positive" : "text-muted-foreground"
                        )}>
                          {formatCents(item.amount)}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Start -- compact horizontal row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickStartLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Analytics Section with visual container */}
      <div className="space-y-4">
        <div className="flex items-baseline gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Analytics</h2>
          <span className="text-xs text-muted-foreground">{year} tax data</span>
        </div>
        <div className="rounded-xl border bg-muted/20 p-4 sm:p-6">
          <DashboardTabs
            overviewTab={
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Income by Form Type</CardTitle>
                    <CardDescription>
                      Breakdown of income across form types
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <IncomeByTypeChart data={incomeByType} year={year} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Expenses by Category</CardTitle>
                    <CardDescription>
                      Where your money is going
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ExpenseCategoryChart
                      data={expenseByCategory}
                      year={year}
                    />
                  </CardContent>
                </Card>
              </div>
            }
            incomeTab={
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Income by Form Type</CardTitle>
                    <CardDescription>
                      Breakdown of income across form types
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <IncomeByTypeChart data={incomeByType} year={year} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Income by Payer</CardTitle>
                    <CardDescription>
                      Top payers / employers by amount
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <IncomeByPayerChart data={incomeByPayer} year={year} />
                  </CardContent>
                </Card>
              </div>
            }
            expensesTab={
              <div className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Expenses by Category</CardTitle>
                      <CardDescription>
                        Where your money is going
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ExpenseCategoryChart
                        data={expenseByCategory}
                        year={year}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly Expense Trend</CardTitle>
                      <CardDescription>
                        Spending over the year
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ExpenseTrendChart data={expenseMonthly} year={year} />
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Vendors</CardTitle>
                    <CardDescription>
                      Highest spend by vendor
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ExpenseVendorChart data={expenseByVendor} year={year} />
                  </CardContent>
                </Card>
              </div>
            }
            documentsTab={
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Document Summary</CardTitle>
                    <CardDescription>
                      Files stored in your vault
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Total documents
                        </span>
                        <span className="font-medium tabular-nums">{overview.docCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Linked to records
                        </span>
                        <span className="font-medium tabular-nums">
                          {overview.docCount - overview.unlinkedDocs}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Unlinked
                        </span>
                        <span className="font-medium tabular-nums">{overview.unlinkedDocs}</span>
                      </div>
                    </div>
                    {overview.docCount > 0 && (
                      <Button variant="outline" className="mt-4 w-full" asChild>
                        <Link href="/documents">View all documents</Link>
                      </Button>
                    )}
                    {overview.docCount === 0 && (
                      <p className="mt-4 text-center text-sm text-muted-foreground">
                        No documents uploaded yet.{' '}
                        <Link
                          href="/documents"
                          className="text-foreground underline underline-offset-4"
                        >
                          Upload your first document.
                        </Link>
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            }
          />
        </div>
      </div>

      {/* Confidence Footer -- slim bar */}
      <div className="rounded-lg bg-muted/30 px-4 py-2.5">
        <ConfidenceFooter recordCount={totalRecords} />
      </div>
    </div>
  );
}
