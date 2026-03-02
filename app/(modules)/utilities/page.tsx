import { Zap } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UtilitySummaryCards } from '@/components/utilities/utility-summary-cards';
import { UtilityTable } from '@/components/utilities/utility-table';
import { UtilityMonthlyChart } from '@/components/charts/utility-monthly-chart';
import { UtilityPageActions } from './page-actions';
import { getUtilitySummary, listUtilityBillsByYear } from '@/server/services/utility-service';
import { getBusinessProfileForYear } from '@/server/services/business-service';
import { TAX_YEARS } from '@/lib/constants';
import { getDefaultTaxYear } from '@/server/services/settings-service';

type Props = {
  searchParams: Promise<{ year?: string; utilityType?: string }>;
};

export default async function UtilitiesPage({ searchParams }: Props) {
  const params = await searchParams;
  const yearParam = params.year ? Number(params.year) : null;
  const year =
    yearParam && (TAX_YEARS as readonly number[]).includes(yearParam)
      ? yearParam
      : getDefaultTaxYear();

  const utilityTypeFilter = params.utilityType || undefined;

  const [summary, bills, businessProfile] = await Promise.all([
    getUtilitySummary(year),
    listUtilityBillsByYear(year, { utilityType: utilityTypeFilter }),
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
        <UtilityPageActions year={year} />
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
        <Card>
          <CardHeader>
            <CardTitle>Monthly Breakdown</CardTitle>
            <CardDescription>Utility costs by type per month</CardDescription>
          </CardHeader>
          <CardContent>
            <UtilityMonthlyChart data={summary.monthlyByType} year={year} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Utility Bills</CardTitle>
          <CardDescription>
            {bills.length} bill{bills.length !== 1 ? 's' : ''} recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bills.length === 0 ? (
            <div className="py-8 text-center">
              <Zap className="mx-auto size-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No utility bills recorded yet. Add your first bill to start tracking.
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
