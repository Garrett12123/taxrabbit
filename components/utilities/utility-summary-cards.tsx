'use client';

import {
  CardContent,
  CardHeader,
  CardTitle,
  CardMetric,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HomeOfficePercentInput } from './home-office-percent-input';
import { formatCents } from '@/lib/utils';

type UtilitySummaryCardsProps = {
  year: number;
  totalCost: number;
  businessDeduction: number;
  billCount: number;
  homeOfficePercent: number;
  hasBusinessProfile: boolean;
};

export function UtilitySummaryCards({
  year,
  totalCost,
  businessDeduction,
  billCount,
  homeOfficePercent,
  hasBusinessProfile,
}: UtilitySummaryCardsProps) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <CardMetric>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Utility Costs
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <span className="text-2xl font-bold tabular-nums">
            {formatCents(totalCost)}
          </span>
        </CardContent>
      </CardMetric>

      <CardMetric>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Business Deduction
            <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 text-positive border-positive/30">
              Deductible
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <span className="text-2xl font-bold tabular-nums text-positive">
            {formatCents(businessDeduction)}
          </span>
        </CardContent>
      </CardMetric>

      <CardMetric>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Bills Recorded
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <span className="text-2xl font-bold tabular-nums">
            {billCount}
          </span>
        </CardContent>
      </CardMetric>

      <CardMetric>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Home Office %
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <HomeOfficePercentInput
            year={year}
            currentPercent={homeOfficePercent}
            hasBusinessProfile={hasBusinessProfile}
          />
        </CardContent>
      </CardMetric>
    </div>
  );
}
