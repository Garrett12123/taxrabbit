import { AlertCircle, CheckCircle2, Clock, DollarSign } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardMetric,
} from '@/components/ui/card';
import { EstimatedPaymentForm } from '@/components/estimated-payments/payment-form';
import { PaymentDeleteButton } from '@/components/estimated-payments/payment-actions';
import { getQuarterlyOverview } from '@/server/services/estimated-payments-service';
import { formatCents, cn } from '@/lib/utils';
import { TAX_YEARS } from '@/lib/constants';
import { getDefaultTaxYear } from '@/server/services/settings-service';

type Props = {
  searchParams: Promise<{ year?: string }>;
};

export default async function EstimatedPaymentsPage({ searchParams }: Props) {
  const params = await searchParams;
  const yearParam = params.year ? Number(params.year) : null;
  const year =
    yearParam && (TAX_YEARS as readonly number[]).includes(yearParam)
      ? yearParam
      : getDefaultTaxYear();

  const overview = await getQuarterlyOverview(year);

  const paidCount = overview.quarters.filter((q) => q.isPaid).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Estimated Tax Payments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track quarterly estimated tax payments for {year}.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CardMetric>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recommended Total
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <span className="text-2xl font-bold tabular-nums">
              {formatCents(overview.totalRecommended)}
            </span>
          </CardContent>
        </CardMetric>

        <CardMetric>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <span className="text-2xl font-bold tabular-nums text-positive">
              {formatCents(overview.totalPaid)}
            </span>
          </CardContent>
        </CardMetric>

        <CardMetric>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Remaining
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <span className={cn(
              "text-2xl font-bold tabular-nums",
              overview.totalRecommended - overview.totalPaid > 0 ? "text-negative" : "text-positive"
            )}>
              {formatCents(Math.max(overview.totalRecommended - overview.totalPaid, 0))}
            </span>
          </CardContent>
        </CardMetric>
      </div>

      {/* Visual Progress Timeline */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Quarterly Progress</span>
          <span className="text-xs text-muted-foreground">{paidCount} of 4 quarters paid</span>
        </div>
        <div className="flex gap-2">
          {overview.quarters.map((q) => (
            <div key={q.quarter} className="flex-1">
              <div className={cn(
                "h-2 rounded-full transition-all duration-500",
                q.isPaid ? "bg-positive" : q.isOverdue ? "bg-destructive/60" : "bg-muted"
              )} />
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-[10px] font-medium text-muted-foreground">{q.label}</span>
                {q.isPaid ? (
                  <CheckCircle2 className="size-3 text-positive" />
                ) : q.isOverdue ? (
                  <AlertCircle className="size-3 text-destructive" />
                ) : (
                  <Clock className="size-3 text-muted-foreground/50" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quarterly Breakdown */}
      <div className="grid gap-4 sm:grid-cols-2">
        {overview.quarters.map((q) => (
          <Card key={q.quarter} className={cn(
            "transition-all duration-200",
            q.isPaid && "bg-positive/[0.02] border-positive/20",
            q.isOverdue && "border-destructive/50"
          )}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{q.label}</CardTitle>
                <div className="flex items-center gap-1.5">
                  {q.isPaid ? (
                    <CheckCircle2 className="size-4 text-positive" />
                  ) : q.isOverdue ? (
                    <AlertCircle className="size-4 text-destructive" />
                  ) : (
                    <Clock className="size-4 text-muted-foreground" />
                  )}
                  <span className={cn(
                    "text-xs font-medium",
                    q.isPaid && "text-positive",
                    q.isOverdue && "text-destructive",
                    !q.isPaid && !q.isOverdue && "text-muted-foreground"
                  )}>
                    {q.isPaid ? 'Paid' : q.isOverdue ? 'Overdue' : 'Upcoming'}
                  </span>
                </div>
              </div>
              <CardDescription>
                Due {q.dueDate}
                {q.recommendedAmount > 0 && (
                  <> &middot; Recommended: {formatCents(q.recommendedAmount)}</>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {q.isPaid ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Amount Paid</span>
                    <span className="font-semibold tabular-nums">{formatCents(q.amountPaid)}</span>
                  </div>
                  {q.payment?.datePaid && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Date Paid</span>
                      <span className="text-sm">{q.payment.datePaid}</span>
                    </div>
                  )}
                  {q.payment?.payload?.confirmationNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Confirmation</span>
                      <span className="text-sm font-mono">{q.payment.payload.confirmationNumber}</span>
                    </div>
                  )}
                  {q.payment && (
                    <div className="pt-2 border-t">
                      <PaymentDeleteButton paymentId={q.payment.id} />
                    </div>
                  )}
                </div>
              ) : (
                <EstimatedPaymentForm year={year} quarter={q.quarter} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status banners styled as callouts instead of full cards */}
      {overview.estimatedOwed < 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-positive/30 bg-positive/5 px-4 py-3">
          <DollarSign className="size-5 text-positive shrink-0" />
          <div>
            <p className="text-sm font-medium text-positive">
              Estimated refund: {formatCents(Math.abs(overview.estimatedOwed))}
            </p>
            <p className="text-xs text-muted-foreground">
              Based on current withholding, you may receive a refund. No estimated payments needed.
            </p>
          </div>
        </div>
      )}

      {overview.totalRecommended === 0 && overview.estimatedOwed >= 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
          <DollarSign className="size-5 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">
            No estimated payments recommended. This feature is for self-employed
            individuals with 1099 income.
          </p>
        </div>
      )}
    </div>
  );
}
