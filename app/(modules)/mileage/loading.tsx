import { PageHeaderSkeleton, StatCardSkeleton, FormSkeleton, TableSkeleton } from '@/components/ui/page-skeleton';

export default function MileageLoading() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <div className="rounded-lg border bg-card p-6">
        <FormSkeleton />
      </div>
      <div className="rounded-lg border bg-card p-6">
        <TableSkeleton rows={5} columns={4} />
      </div>
    </div>
  );
}
