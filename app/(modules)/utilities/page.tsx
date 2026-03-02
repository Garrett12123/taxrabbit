import { Suspense } from 'react';
import { Zap } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UtilitySummaryCards } from '@/components/utilities/utility-summary-cards';
import { UtilityTable } from '@/components/utilities/utility-table';
import { UtilityFilters } from '@/components/utilities/utility-filters';
import { UtilityMonthlyChart } from '@/components/charts/utility-monthly-chart';
import { UtilityTypeChart } from '@/components/charts/utility-type-chart';
import { UtilityCostTrendChart } from '@/components/charts/utility-cost-trend-chart';
import { UtilityPageActions } from './page-actions';
import { getUtilitySummary, listUtilityBillsByYear } from '@/server/services/utility-service';
import { getBusinessProfileForYear } from '@/server/services/business-service';
import { TAX_YEARS } from '@/lib/constants';
import { getDefaultTaxYear } from '@/server/services/settings-service';

type Props = {
  searchParams: Promise<{ year?: string; utilityType?: string; month?: string }>;
};

export default async function UtilitiesPage({ searchParams }: Props) {
  const params = await searchParams;
  const yearParam = params.year ? Number(params.year) : null;
  const year =
    yearParam && (TAX_YEARS as readonly number[]).includes(yearParam)
      ? yearParam
      : getDefaultTaxYear();

  const utilityTypeFilter = params.utilityType || undefined;
  const monthFilter = params.month || undefined;

  // Build date range from month filter
  let startDate: string | undefined;
  let endDate: string | undefined;
  if (monthFilter) {
    const paddedMonth = String(monthFilter).padStart(2, '0');
    startDate = `${year}-${paddedMonth}-01`;
    const lastDay = new Date(year, Number(monthFilter), 0).getDate();
    endDate = `${year}-${paddedMonth}-${String(lastDay).padStart(2, '0')}`;
  }

  const [summary, bills, businessProfile] = await Promise.all([
    getUtilitySummary(year),
    listUtilityBillsByYear(year, { utilityType: utilityTypeFilter, startDate, endDate }),
    getBusinessProfileForYear(year),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Utilities</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track monthly utility bills for your home office deduction ({year}).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Suspense fallback={<Skeleton className="h-9 w-72" />}>
            <UtilityFilters />
          </Suspense>
          <UtilityPageActions year={year} />
        </div>
      </div>

      <UtilitySummaryCards
        year={year}
        totalCost={summary.totalCost}
        businessDeduction={summary.businessDeduction}
        billCount={summary.billCount}
        homeOfficePercent={summary.homeOfficePercent}
        hasBusinessProfile={!!businessProfile}
      />

      {summary.billCount > 0 && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Breakdown</CardTitle>
                <CardDescription>Utility costs by type per month</CardDescription>
              </CardHeader>
              <CardContent>
                <UtilityMonthlyChart data={summary.monthlyByType} year={year} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost by Type</CardTitle>
                <CardDescription>Total spending breakdown by utility type</CardDescription>
              </CardHeader>
              <CardContent>
                <UtilityTypeChart data={summary.byType} year={year} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cost Trend</CardTitle>
              <CardDescription>Total monthly utility spending over time</CardDescription>
            </CardHeader>
            <CardContent>
              <UtilityCostTrendChart data={summary.monthlyByType} year={year} />
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Utility Bills</CardTitle>
          <CardDescription>
            {bills.length} bill{bills.length !== 1 ? 's' : ''} recorded
            {(utilityTypeFilter || monthFilter) && ' (filtered)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bills.length === 0 ? (
            <div className="py-8 text-center">
              <Zap className="mx-auto size-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                {utilityTypeFilter || monthFilter
                  ? 'No utility bills match the current filters.'
                  : 'No utility bills recorded yet. Add your first bill to start tracking.'}
              </p>
            </div>
          ) : (
            <UtilityTable bills={bills} year={year} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
