import { PageHeaderSkeleton, TableSkeleton, StatCardSkeleton } from '@/components/ui/page-skeleton';

export default function ExpensesLoading() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeaderSkeleton />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <div className="rounded-lg border bg-card p-6">
        <TableSkeleton rows={8} columns={6} />
      </div>
    </div>
  );
}
