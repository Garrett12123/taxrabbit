import { ClipboardCheck, PartyPopper } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChecklistList } from '@/components/checklist/checklist-list';
import { listChecklistItemsByYear, getCompletionStats } from '@/server/db/dal/checklist-items';
import { TAX_YEARS } from '@/lib/constants';
import { getDefaultTaxYear } from '@/server/services/settings-service';
import { cn } from '@/lib/utils';

type Props = {
  searchParams: Promise<{ year?: string }>;
};

export default async function ChecklistPage({ searchParams }: Props) {
  const params = await searchParams;
  const yearParam = params.year ? Number(params.year) : null;
  const year =
    yearParam && (TAX_YEARS as readonly number[]).includes(yearParam)
      ? yearParam
      : getDefaultTaxYear();

  const [items, stats] = await Promise.all([
    listChecklistItemsByYear(year),
    Promise.resolve(getCompletionStats(year)),
  ]);

  const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const isComplete = stats.total > 0 && pct === 100;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Tax Checklist</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your tax preparation progress for {year}.
        </p>
      </div>

      {/* Hero Progress Card */}
      <Card className={cn(
        "overflow-hidden",
        isComplete && "border-positive/30 bg-positive/[0.02]"
      )}>
        <CardContent className="py-6">
          <div className="flex items-center gap-6">
            {/* Progress circle */}
            <div className="relative shrink-0">
              <svg className="size-20 -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40" cy="40" r="34"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-muted"
                />
                <circle
                  cx="40" cy="40" r="34"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                  className={cn(
                    "transition-all duration-700 ease-out",
                    isComplete ? "text-positive" : "text-primary"
                  )}
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                {isComplete ? (
                  <PartyPopper className="size-6 text-positive" />
                ) : (
                  <span className="text-lg font-bold tabular-nums">{pct}%</span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold">
                {isComplete ? 'All done!' : `${stats.completed} of ${stats.total} complete`}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isComplete
                  ? 'Your tax preparation checklist is complete for ' + year + '.'
                  : stats.total === 0
                    ? 'Add checklist items below to track your tax preparation.'
                    : `${stats.total - stats.completed} item${stats.total - stats.completed !== 1 ? 's' : ''} remaining`
                }
              </p>
              {stats.total > 0 && (
                <div className="mt-3 h-2 w-full max-w-sm rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700 ease-out",
                      isComplete ? "bg-positive" : "bg-primary"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <ClipboardCheck className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle>Checklist</CardTitle>
              <CardDescription>
                {stats.total === 0
                  ? 'Add items to track your tax preparation'
                  : `${stats.completed} of ${stats.total} complete`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChecklistList year={year} items={items} />
        </CardContent>
      </Card>
    </div>
  );
}
