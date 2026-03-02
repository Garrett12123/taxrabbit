import { PageHeaderSkeleton, StatCardSkeleton, CardSkeleton, TableSkeleton } from '@/components/ui/page-skeleton';

export default function UtilitiesLoading() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <CardSkeleton />
      <div className="rounded-lg border bg-card p-6">
        <TableSkeleton rows={5} columns={5} />
      </div>
    </div>
  );
}
