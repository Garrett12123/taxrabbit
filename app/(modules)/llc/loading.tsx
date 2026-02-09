import { PageHeaderSkeleton, FormSkeleton, StatCardSkeleton } from '@/components/ui/page-skeleton';

export default function LlcLoading() {
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
    </div>
  );
}
