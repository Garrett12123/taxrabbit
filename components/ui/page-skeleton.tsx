'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type PageSkeletonProps = {
  className?: string;
};

/**
 * Header skeleton for page titles and descriptions.
 */
export function PageHeaderSkeleton({ className }: PageSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
    </div>
  );
}

/**
 * Card skeleton for content cards.
 */
export function CardSkeleton({ className }: PageSkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-6 space-y-4',
        className
      )}
    >
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

/**
 * Table skeleton for data tables.
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: PageSkeletonProps & { rows?: number; columns?: number }) {
  return (
    <div className={cn('w-full', className)}>
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      <div className="space-y-3 pt-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Form skeleton for settings/profile forms.
 */
export function FormSkeleton({ className }: PageSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Two-column grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
      {/* Full-width field */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-9 w-full" />
      </div>
      {/* Another two-column */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
      {/* Button */}
      <Skeleton className="h-9 w-24" />
    </div>
  );
}

/**
 * Stats/metric card skeleton.
 */
export function StatCardSkeleton({ className }: PageSkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-4 space-y-2',
        className
      )}
    >
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-28" />
    </div>
  );
}

/**
 * Full page loading skeleton with header and content areas.
 */
export function PageSkeleton({ className }: PageSkeletonProps) {
  return (
    <div className={cn('space-y-8', className)}>
      <PageHeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <CardSkeleton />
    </div>
  );
}
