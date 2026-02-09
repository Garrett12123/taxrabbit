import { PageHeaderSkeleton, FormSkeleton } from '@/components/ui/page-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsLoading() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      {/* Tabs skeleton */}
      <div className="flex gap-2 border-b pb-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="rounded-lg border bg-card p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <FormSkeleton />
        </div>
      </div>
    </div>
  );
}
