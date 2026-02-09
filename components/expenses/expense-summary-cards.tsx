import { TrendingDown } from 'lucide-react';
import {
  CardContent,
  CardHeader,
  CardTitle,
  CardMetric,
} from '@/components/ui/card';
import { formatCents } from '@/lib/utils';

type ExpenseSummaryCardsProps = {
  totalAll: number;
  totalPersonal: number;
  totalBusiness: number;
  needsAttentionCount: number;
};

export function ExpenseSummaryCards({
  totalAll,
  totalPersonal,
  totalBusiness,
  needsAttentionCount,
}: ExpenseSummaryCardsProps) {
  const businessPercent = totalAll > 0 ? Math.round((totalBusiness / totalAll) * 100) : 0;
  const personalPercent = totalAll > 0 ? Math.round((totalPersonal / totalAll) * 100) : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <CardMetric trend="down">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Expenses
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums tracking-tight">
              {formatCents(totalAll)}
            </span>
            {totalAll > 0 && (
              <TrendingDown className="size-4 text-negative" />
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            All categories combined
          </p>
        </CardContent>
      </CardMetric>

      <CardMetric>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Personal
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold tabular-nums tracking-tight">
            {formatCents(totalPersonal)}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {totalAll > 0 ? `${personalPercent}% of total` : 'No expenses yet'}
          </p>
        </CardContent>
      </CardMetric>

      <CardMetric>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Business / LLC
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums tracking-tight">
              {formatCents(totalBusiness)}
            </span>
            {totalBusiness > 0 && (
              <span className="text-xs font-medium text-positive">Deductible</span>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {totalAll > 0 ? `${businessPercent}% of total` : 'No expenses yet'}
          </p>
        </CardContent>
      </CardMetric>

      <CardMetric>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Needs Attention
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold tabular-nums tracking-tight">{needsAttentionCount}</div>
          <p className="mt-2 text-xs text-muted-foreground">
            {needsAttentionCount === 0 ? (
              <span className="inline-flex items-center gap-1 text-positive">
                <span className="size-1.5 rounded-full bg-positive" />
                No issues found
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-warning" />
                Missing receipts or notes
              </span>
            )}
          </p>
        </CardContent>
      </CardMetric>
    </div>
  );
}
