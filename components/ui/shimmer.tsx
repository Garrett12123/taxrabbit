import { cn } from '@/lib/utils';

type ShimmerProps = {
  className?: string;
};

/**
 * Premium shimmer loading effect.
 * Use instead of basic skeleton for a more polished feel.
 */
export function Shimmer({ className }: ShimmerProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-muted/60',
        className
      )}
    >
      <div
        className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />
    </div>
  );
}

/**
 * Premium shimmer text placeholder
 */
export function ShimmerText({ 
  className,
  width = 'w-32',
}: ShimmerProps & { width?: string }) {
  return <Shimmer className={cn('h-4', width, className)} />;
}

/**
 * Premium shimmer for avatars/icons
 */
export function ShimmerCircle({ 
  className,
  size = 'size-10',
}: ShimmerProps & { size?: string }) {
  return <Shimmer className={cn('rounded-full', size, className)} />;
}

/**
 * Premium shimmer card
 */
export function ShimmerCard({ className }: ShimmerProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-6 space-y-4', className)}>
      <div className="space-y-2">
        <Shimmer className="h-5 w-24" />
        <Shimmer className="h-4 w-40" />
      </div>
      <div className="space-y-3">
        <Shimmer className="h-4 w-full" />
        <Shimmer className="h-4 w-3/4" />
      </div>
    </div>
  );
}

/**
 * Premium shimmer table
 */
export function ShimmerTable({ 
  rows = 5, 
  columns = 4,
  className,
}: ShimmerProps & { rows?: number; columns?: number }) {
  return (
    <div className={cn('w-full space-y-3', className)}>
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Shimmer key={`h-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows with staggered animation */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div 
          key={rowIdx} 
          className="flex gap-4"
          style={{ animationDelay: `${rowIdx * 50}ms` }}
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Shimmer key={`${rowIdx}-${colIdx}`} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Metric/stat shimmer with large number
 */
export function ShimmerMetric({ className }: ShimmerProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Shimmer className="h-3 w-16" />
      <Shimmer className="h-8 w-28" />
    </div>
  );
}
