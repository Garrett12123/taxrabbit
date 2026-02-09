'use client';

import { Calculator, TrendingDown, TrendingUp } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatCents, cn } from '@/lib/utils';
import { FilingStatusSelect } from '@/components/tax-year/filing-status-select';
import type { TaxEstimate, FilingStatus } from '@/server/services/tax-estimator-service';

type Props = {
  estimate: TaxEstimate;
  year: number;
};

const filingStatusLabels: Record<FilingStatus, string> = {
  single: 'Single',
  mfj: 'Married Filing Jointly',
  mfs: 'Married Filing Separately',
  hoh: 'Head of Household',
};

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className={cn("text-sm", muted ? "text-muted-foreground" : "text-foreground")}>
        {label}
      </span>
      <span className={cn("text-sm font-medium tabular-nums", muted && "text-muted-foreground")}>
        {value}
      </span>
    </div>
  );
}

export function TaxEstimateCard({ estimate, year }: Props) {
  const isRefund = estimate.estimatedOwed < 0;
  const absOwed = Math.abs(estimate.estimatedOwed);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="size-4 text-muted-foreground" />
            <CardTitle>Tax Estimate</CardTitle>
          </div>
          <div className="w-48">
            <FilingStatusSelect year={year} currentStatus={estimate.filingStatus} />
          </div>
        </div>
        <CardDescription>
          Projected federal tax liability ({filingStatusLabels[estimate.filingStatus]}, standard deduction)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Headline */}
        <div className={cn(
          "rounded-lg p-4 text-center",
          isRefund ? "bg-positive/10" : "bg-negative/10"
        )}>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            {isRefund ? 'Estimated Refund' : 'Estimated Amount Owed'}
          </p>
          <div className="flex items-center justify-center gap-2">
            {isRefund ? (
              <TrendingDown className="size-5 text-positive" />
            ) : (
              <TrendingUp className="size-5 text-negative" />
            )}
            <span className={cn(
              "text-2xl font-bold tabular-nums",
              isRefund ? "text-positive" : "text-negative"
            )}>
              {formatCents(absOwed)}
            </span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="divide-y divide-border">
          <Row label="Gross Income" value={formatCents(estimate.grossIncome)} />
          {estimate.selfEmploymentIncome > 0 && (
            <Row label="Self-Employment Income" value={formatCents(estimate.selfEmploymentIncome)} muted />
          )}
          {estimate.businessExpenses > 0 && (
            <Row label="Business Expenses" value={`-${formatCents(estimate.businessExpenses)}`} muted />
          )}
          <Row label="Standard Deduction" value={`-${formatCents(estimate.standardDeduction)}`} muted />
          <Row label="Taxable Income" value={formatCents(estimate.taxableIncome)} />
          <Row label="Federal Income Tax" value={formatCents(estimate.federalIncomeTax)} />
          {estimate.selfEmploymentTax > 0 && (
            <Row label="Self-Employment Tax" value={formatCents(estimate.selfEmploymentTax)} />
          )}
          <Row label="Total Tax" value={formatCents(estimate.totalTax)} />
          <Row label="Federal Withheld" value={`-${formatCents(estimate.totalWithholding - estimate.stateWithholding)}`} muted />
          {estimate.stateWithholding > 0 && (
            <Row label="State Withheld" value={`-${formatCents(estimate.stateWithholding)}`} muted />
          )}
        </div>

        {/* Rates */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-center flex-1">
            <p className="text-xs text-muted-foreground">Effective Rate</p>
            <p className="text-sm font-semibold tabular-nums">{estimate.effectiveRate}%</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center flex-1">
            <p className="text-xs text-muted-foreground">Marginal Rate</p>
            <p className="text-sm font-semibold tabular-nums">{estimate.marginalRate}%</p>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
          Estimate only. Based on {year} federal brackets for {filingStatusLabels[estimate.filingStatus].toLowerCase()} with standard deduction.
          Does not include state taxes, credits, or itemized deductions.
        </p>
      </CardContent>
    </Card>
  );
}
