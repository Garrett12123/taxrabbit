import { ShieldAlert, Printer } from 'lucide-react';
import Link from 'next/link';

import { AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { WarningAlert } from '@/components/layout/warning-alert';
import { YearEndSummaryView } from '@/components/reports/year-end-summary';
import { CPAExportCard } from '@/components/reports/cpa-export-card';
import { SummaryDownloadCard } from '@/components/reports/summary-download-card';
import { BackupCard } from '@/components/reports/backup-card';
import { TaxEstimateSummary } from '@/components/reports/tax-estimate-summary';
import { getYearEndSummary } from '@/server/services/report-service';
import { estimateTaxLiability } from '@/server/services/tax-estimator-service';
import { TAX_YEARS } from '@/lib/constants';
import { getDefaultTaxYear } from '@/server/services/settings-service';

type Props = {
  searchParams: Promise<{ year?: string; view?: string }>;
};

export default async function ReportsPage({ searchParams }: Props) {
  const params = await searchParams;
  const yearParam = params.year ? Number(params.year) : null;
  const year =
    yearParam && (TAX_YEARS as readonly number[]).includes(yearParam)
      ? yearParam
      : getDefaultTaxYear();

  const [summary, taxEstimate] = await Promise.all([
    getYearEndSummary(year),
    estimateTaxLiability(year),
  ]);

  // Print-only view -- renders just the summary
  if (params.view === 'print') {
    return (
      <div className="p-6">
        <h1 className="text-page-title mb-1">
          Tax Year {year} Summary
        </h1>
        <p className="text-muted-foreground mb-6">{summary.generatedAt}</p>
        <YearEndSummaryView summary={summary} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate summaries and CPA-ready exports for {year}.
        </p>
      </div>

      <WarningAlert className="print:hidden">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Sensitive Data</AlertTitle>
        <AlertDescription>
          Reports and exports may contain sensitive financial information.
          Handle exported files securely and delete them when no longer needed.
        </AlertDescription>
      </WarningAlert>

      {/* Tax Estimate -- most valuable, prominent position */}
      {taxEstimate.grossIncome > 0 && (
        <div className="print:hidden">
          <TaxEstimateSummary estimate={taxEstimate} year={year} />
        </div>
      )}

      {/* Export section with visual container */}
      <div className="print:hidden space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Exports</h2>
        <div className="rounded-xl border bg-muted/20 p-4 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <SummaryDownloadCard year={year} />
            <CPAExportCard year={year} />
          </div>
        </div>
      </div>

      {/* Year-End Summary */}
      <div>
        <div className="flex items-center justify-between mb-4 print:hidden">
          <h2 className="text-lg font-semibold tracking-tight">Year-End Summary</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/reports?year=${year}&view=print`} target="_blank">
              <Printer className="size-3.5" />
              Print View
            </Link>
          </Button>
        </div>
        <YearEndSummaryView summary={summary} />
      </div>

      <Separator className="print:hidden" />

      {/* Backup & Restore -- de-emphasized at bottom */}
      <div className="print:hidden">
        <div className="rounded-xl border-dashed border bg-muted/10 p-1">
          <BackupCard />
        </div>
      </div>
    </div>
  );
}
