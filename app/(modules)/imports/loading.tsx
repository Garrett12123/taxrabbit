import { PageHeaderSkeleton, CardSkeleton, FormSkeleton } from '@/components/ui/page-skeleton';

export default function ImportsLoading() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <CardSkeleton />
      <div className="rounded-lg border bg-card p-6">
        <FormSkeleton />
      </div>
    </div>
  );
}
