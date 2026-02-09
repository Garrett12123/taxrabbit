'use client';

import { cn } from '@/lib/utils';
import { AnimatedCounter, AnimatedCurrency, AnimatedPercentage } from '@/components/ui/animated-counter';

type StatCardProps = {
  label: string;
  value: number;
  /** Type of value for formatting */
  type?: 'number' | 'currency' | 'percentage';
  /** Change from previous period */
  change?: number;
  /** Change type for color */
  changeType?: 'increase' | 'decrease' | 'neutral';
  /** Icon to display */
  icon?: React.ReactNode;
  className?: string;
};

/**
 * Premium stat card with animated counter.
 * Perfect for dashboard metrics and KPIs.
 */
export function StatCard({
  label,
  value,
  type = 'number',
  change,
  changeType = 'neutral',
  icon,
  className,
}: StatCardProps) {
  const changeColor = {
    increase: 'text-positive',
    decrease: 'text-destructive',
    neutral: 'text-muted-foreground',
  }[changeType];

  const changePrefix = {
    increase: '+',
    decrease: '',
    neutral: '',
  }[changeType];

  return (
    <div
      className={cn(
        'group relative rounded-lg border bg-card p-5',
        'transition-all duration-200 ease-out',
        'hover:shadow-card-hover hover:-translate-y-0.5',
        className
      )}
    >
      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <div className="text-2xl font-semibold tracking-tight">
            {type === 'currency' ? (
              <AnimatedCurrency cents={value} />
            ) : type === 'percentage' ? (
              <AnimatedPercentage value={value} decimals={1} />
            ) : (
              <AnimatedCounter value={value} />
            )}
          </div>
          {change !== undefined && (
            <p className={cn('text-xs font-medium', changeColor)}>
              {changePrefix}
              {type === 'percentage' ? `${change.toFixed(1)}%` : change.toLocaleString()}
              {' '}from last period
            </p>
          )}
        </div>
        {icon && (
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-200">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Compact stat for inline display
 */
export function StatInline({
  label,
  value,
  type = 'number',
  className,
}: Omit<StatCardProps, 'change' | 'changeType' | 'icon'>) {
  return (
    <div className={cn('flex items-baseline gap-2', className)}>
      <span className="text-sm text-muted-foreground">{label}:</span>
      <span className="font-semibold tabular-nums">
        {type === 'currency' ? (
          <AnimatedCurrency cents={value} duration={600} />
        ) : type === 'percentage' ? (
          <AnimatedPercentage value={value} duration={600} />
        ) : (
          <AnimatedCounter value={value} duration={600} />
        )}
      </span>
    </div>
  );
}
