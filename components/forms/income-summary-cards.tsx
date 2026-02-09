import { TrendingUp } from 'lucide-react';
import {
  CardContent,
  CardHeader,
  CardTitle,
  CardMetric,
} from '@/components/ui/card';
import { formatCents } from '@/lib/utils';

type IncomeSummaryCardsProps = {
  totalIncome: number;
  totalWithholding: number;
  formCount: number;
  needsReviewCount: number;
};

export function IncomeSummaryCards({
  totalIncome,
  totalWithholding,
  formCount,
  needsReviewCount,
}: IncomeSummaryCardsProps) {
  const completeCount = formCount - needsReviewCount;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <CardMetric trend="up">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Income
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums tracking-tight">
              {formatCents(totalIncome)}
            </span>
            {totalIncome > 0 && (
              <TrendingUp className="size-4 text-positive" />
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {formCount} form{formCount !== 1 ? 's' : ''} recorded
          </p>
        </CardContent>
      </CardMetric>

      <CardMetric>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Fed Withholding
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold tabular-nums tracking-tight">
            {formatCents(totalWithholding)}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Tax already paid</p>
        </CardContent>
      </CardMetric>

      <CardMetric>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Forms
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold tabular-nums tracking-tight">{formCount}</div>
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-positive" />
              {completeCount} complete
            </span>
          </p>
        </CardContent>
      </CardMetric>

      <CardMetric>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Needs Review
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold tabular-nums tracking-tight">{needsReviewCount}</div>
          <p className="mt-2 text-xs text-muted-foreground">
            {needsReviewCount === 0 ? (
              <span className="inline-flex items-center gap-1 text-positive">
                <span className="size-1.5 rounded-full bg-positive" />
                All forms complete
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-warning" />
                of {formCount} forms
              </span>
            )}
          </p>
        </CardContent>
      </CardMetric>
    </div>
  );
}
