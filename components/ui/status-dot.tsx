import { cn } from '@/lib/utils';

type StatusDotProps = {
  status: 'active' | 'pending' | 'success' | 'warning' | 'error' | 'inactive';
  size?: 'sm' | 'default' | 'lg';
  pulse?: boolean;
  className?: string;
};

const statusColors = {
  active: 'bg-blue-500',
  pending: 'bg-amber-500',
  success: 'bg-positive',
  warning: 'bg-warning',
  error: 'bg-destructive',
  inactive: 'bg-muted-foreground/50',
};

const pulseColors = {
  active: 'bg-blue-400',
  pending: 'bg-amber-400',
  success: 'bg-positive/60',
  warning: 'bg-warning/60',
  error: 'bg-destructive/60',
  inactive: 'bg-muted-foreground/30',
};

const sizes = {
  sm: 'size-1.5',
  default: 'size-2',
  lg: 'size-2.5',
};

/**
 * Animated status indicator dot.
 * Use for showing live states like connection status, sync status, etc.
 */
export function StatusDot({
  status,
  size = 'default',
  pulse = false,
  className,
}: StatusDotProps) {
  const shouldPulse = pulse || status === 'pending' || status === 'active';

  return (
    <span className={cn('relative inline-flex', className)}>
      {shouldPulse && status !== 'inactive' && (
        <span
          className={cn(
            'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
            pulseColors[status]
          )}
          style={{ animationDuration: '1.5s' }}
        />
      )}
      <span
        className={cn(
          'relative inline-flex rounded-full',
          sizes[size],
          statusColors[status]
        )}
      />
    </span>
  );
}
