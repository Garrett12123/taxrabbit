import { PageHeaderSkeleton, TableSkeleton } from '@/components/ui/page-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function DocumentsLoading() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeaderSkeleton />
      </div>
      <div className="space-y-4">
        {/* Search bar skeleton */}
        <Skeleton className="h-9 w-72" />
        <div className="rounded-lg border bg-card p-6">
          <TableSkeleton rows={6} columns={6} />
        </div>
      </div>
    </div>
  );
}
