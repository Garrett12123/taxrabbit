import { PageHeaderSkeleton, CardSkeleton } from '@/components/ui/page-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function ChecklistLoading() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />

      {/* Progress card skeleton */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-6">
          <Skeleton className="size-20 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="mt-3 h-2 w-full max-w-sm rounded-full" />
          </div>
        </div>
      </div>

      {/* Checklist card skeleton */}
      <CardSkeleton />
    </div>
  );
}
