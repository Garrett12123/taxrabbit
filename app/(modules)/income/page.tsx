import { Suspense } from 'react';
import { DollarSign } from 'lucide-react';

import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { IncomeSummaryCards } from '@/components/forms/income-summary-cards';
import { IncomeFilters } from '@/components/forms/income-filters';
import { IncomeTable } from '@/components/forms/income-table';
import { IncomePageActions } from './page-actions';
import { IncomeTrendChart } from '@/components/charts/income-trend-chart';
import { IncomeVsWithholdingChart } from '@/components/charts/income-vs-withholding-chart';
import { IncomeByTypeChart } from '@/components/charts/income-by-type-chart';
import { IncomeByPayerChart } from '@/components/charts/income-by-payer-chart';
import { IncomeEntityChart } from '@/components/charts/income-entity-chart';
import {
  listIncomeDocumentsByYear,
  getTotalIncome,
  getTotalWithholding,
  computeCompleteness,
} from '@/server/services/income-service';
import {
  getIncomeByType,
  getIncomeByPayer,
  getIncomeMonthly,
  getIncomeWithholdingMonthly,
  getIncomeByEntity,
} from '@/server/services/analytics-service';
import { getDefaultTaxYear } from '@/server/services/settings-service';
import { TAX_YEARS } from '@/lib/constants';
import type { IncomeFormType } from '@/lib/constants';

type IncomePageProps = {
  searchParams: Promise<{
    year?: string;
    formType?: string;
    entityType?: string;
  }>;
};

export default async function IncomePage({ searchParams }: IncomePageProps) {
  const params = await searchParams;
  const yearParam = params.year ? Number(params.year) : null;
  const year =
    yearParam && !isNaN(yearParam) && (TAX_YEARS as readonly number[]).includes(yearParam)
      ? yearParam
      : getDefaultTaxYear();
  const formType = params.formType;
  const entityType = params.entityType as
    | 'personal'
    | 'business'
    | undefined;

  const [
    documents,
    incomeByType,
    incomeByPayer,
    incomeMonthly,
    withholdingMonthly,
    incomeByEntity,
  ] = await Promise.all([
    listIncomeDocumentsByYear(year, { formType, entityType }),
    Promise.resolve(getIncomeByType(year)),
    getIncomeByPayer(year),
    Promise.resolve(getIncomeMonthly(year)),
    Promise.resolve(getIncomeWithholdingMonthly(year)),
    Promise.resolve(getIncomeByEntity(year)),
  ]);

  const totalIncome = getTotalIncome(year);
  const totalWithholding = getTotalWithholding(year);

  const rows = documents.map((doc) => ({
    document: doc,
    completeness: computeCompleteness(
      doc.formType as IncomeFormType,
      doc.payload.boxes ?? {},
      doc.payload.issuerName
    ),
  }));

  const needsReviewCount = rows.filter(
    (r) => r.completeness.status !== 'complete'
  ).length;

  // Only show monthly charts when data spans more than one month
  const hasMultipleMonths = incomeMonthly.length > 1;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Income</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track W-2s, 1099s, and other income forms for {year}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Suspense fallback={<Skeleton className="h-9 w-64" />}>
            <IncomeFilters />
          </Suspense>
          <IncomePageActions year={year} />
        </div>
      </div>

      <IncomeSummaryCards
        totalIncome={totalIncome}
        totalWithholding={totalWithholding}
        formCount={documents.length}
        needsReviewCount={needsReviewCount}
      />

      {documents.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <DollarSign />
            </EmptyMedia>
            <EmptyTitle>No income forms yet</EmptyTitle>
            <EmptyDescription>
              Add your first W-2, 1099, or other income form to get started.
            </EmptyDescription>
          </EmptyHeader>
          <IncomePageActions year={year} variant="empty" />
        </Empty>
      ) : (
        <>
          <IncomeTable rows={rows} year={year} />

          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <h2 className="text-lg font-semibold tracking-tight">Analytics</h2>
              <span className="text-xs text-muted-foreground">{year} income data</span>
            </div>
            <div className="rounded-xl border bg-muted/20 p-4 sm:p-6 space-y-6">
              {/* Row 1: Income Trend + Income vs Withholding (only when data spans multiple months) */}
              {hasMultipleMonths && (
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Income Trend</CardTitle>
                      <CardDescription>Monthly income over the year</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <IncomeTrendChart data={incomeMonthly} year={year} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Income vs. Withholding</CardTitle>
                      <CardDescription>Monthly income alongside tax withholding</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <IncomeVsWithholdingChart
                        incomeData={incomeMonthly}
                        withholdingData={withholdingMonthly}
                        year={year}
                      />
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Row 2: By Form Type + By Payer */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Income by Form Type</CardTitle>
                    <CardDescription>Breakdown of income across form types</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <IncomeByTypeChart data={incomeByType} year={year} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Income by Payer</CardTitle>
                    <CardDescription>Top payers / employers by amount</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <IncomeByPayerChart data={incomeByPayer} year={year} />
                  </CardContent>
                </Card>
              </div>

              {/* Row 3: Personal vs Business */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal vs. Business</CardTitle>
                  <CardDescription>Income split by entity type</CardDescription>
                </CardHeader>
                <CardContent>
                  <IncomeEntityChart data={incomeByEntity} />
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
