'use client';

import { Calculator } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatCents, cn } from '@/lib/utils';
import type { TaxEstimate } from '@/server/services/tax-estimator-service';

const filingStatusLabels: Record<string, string> = {
  single: 'single filers',
  mfj: 'married filing jointly',
  mfs: 'married filing separately',
  hoh: 'head of household',
};

type Props = {
  estimate: TaxEstimate;
  year?: number;
};

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className={cn("text-sm", bold ? "font-medium" : "text-muted-foreground")}>
        {label}
      </span>
      <span className={cn("text-sm tabular-nums", bold ? "font-bold" : "font-medium")}>
        {value}
      </span>
    </div>
  );
}

export function TaxEstimateSummary({ estimate, year }: Props) {
  const isRefund = estimate.estimatedOwed < 0;
  const absOwed = Math.abs(estimate.estimatedOwed);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="size-4 text-muted-foreground" />
          <CardTitle>Federal Tax Estimate</CardTitle>
        </div>
        <CardDescription>
          Projected liability based on recorded income and expenses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 divide-y divide-border">
          <Row label="Gross Income" value={formatCents(estimate.grossIncome)} />
          {estimate.businessExpenses > 0 && (
            <Row label="Business Expenses" value={`(${formatCents(estimate.businessExpenses)})`} />
          )}
          <Row label="Standard Deduction" value={`(${formatCents(estimate.standardDeduction)})`} />
          <Row label="Taxable Income" value={formatCents(estimate.taxableIncome)} bold />
          <Row label="Federal Income Tax" value={formatCents(estimate.federalIncomeTax)} />
          {estimate.selfEmploymentTax > 0 && (
            <Row label="Self-Employment Tax" value={formatCents(estimate.selfEmploymentTax)} />
          )}
          {estimate.additionalMedicareTax > 0 && (
            <Row label="Addl. Medicare Tax" value={formatCents(estimate.additionalMedicareTax)} />
          )}
          <Row label="Total Federal Tax" value={formatCents(estimate.totalTax)} bold />
          <Row label="Federal Withholdings" value={`(${formatCents(estimate.totalWithholding - estimate.stateWithholding)})`} />
          <div className="flex items-center justify-between py-3">
            <span className="text-sm font-semibold">
              {isRefund ? 'Estimated Refund' : 'Estimated Balance Due'}
            </span>
            <span className={cn(
              "text-lg font-bold tabular-nums",
              isRefund ? "text-positive" : "text-negative"
            )}>
              {formatCents(absOwed)}
            </span>
          </div>
        </div>
        {estimate.stateWithholding > 0 && (
          <div className="pt-2 border-t border-dashed">
            <Row label="State Withholdings (info only)" value={formatCents(estimate.stateWithholding)} />
            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
              State tax is not estimated. State withholding is shown for reference only.
            </p>
          </div>
        )}
        <div className="mt-4 flex gap-6">
          <div>
            <p className="text-xs text-muted-foreground">Effective Rate</p>
            <p className="text-sm font-semibold">{estimate.effectiveRate}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Marginal Rate</p>
            <p className="text-sm font-semibold">{estimate.marginalRate}%</p>
          </div>
        </div>
        <p className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
          This is an estimate based on {year ?? 'current'} federal brackets for{' '}
          {filingStatusLabels[estimate.filingStatus] ?? 'single filers'} using the standard deduction.
          It does not account for state taxes, tax credits, itemized deductions, or other adjustments.
        </p>
      </CardContent>
    </Card>
  );
}
