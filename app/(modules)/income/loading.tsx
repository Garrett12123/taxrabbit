import { PageHeaderSkeleton, TableSkeleton, StatCardSkeleton } from '@/components/ui/page-skeleton';

export default function IncomeLoading() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeaderSkeleton />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <div className="rounded-lg border bg-card p-6">
        <TableSkeleton rows={6} columns={5} />
      </div>
    </div>
  );
}
