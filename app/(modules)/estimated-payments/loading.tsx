import { PageHeaderSkeleton, StatCardSkeleton, FormSkeleton, CardSkeleton } from '@/components/ui/page-skeleton';

export default function EstimatedPaymentsLoading() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <div className="rounded-lg border bg-card p-6">
        <FormSkeleton />
      </div>
      <CardSkeleton />
    </div>
  );
}
