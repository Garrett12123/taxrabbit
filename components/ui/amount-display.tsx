import { cn, formatCents } from '@/lib/utils';

type AmountDisplayProps = {
  /** Amount in cents */
  cents: number;
  /** Show as positive (income) or negative (expense) */
  type?: 'neutral' | 'income' | 'expense';
  /** Size variant */
  size?: 'sm' | 'default' | 'lg' | 'xl' | '2xl';
  /** Additional className */
  className?: string;
  /** Show plus/minus sign */
  showSign?: boolean;
  /** Enable entrance animation */
  animate?: boolean;
};

const sizeClasses = {
  sm: 'text-sm',
  default: 'text-base',
  lg: 'text-lg',
  xl: 'text-2xl font-semibold',
  '2xl': 'text-3xl font-bold tracking-tight',
};

/**
 * Formatted currency display with consistent styling.
 * Use for displaying monetary amounts throughout the app.
 */
export function AmountDisplay({
  cents,
  type = 'neutral',
  size = 'default',
  className,
  showSign = false,
  animate = false,
}: AmountDisplayProps) {
  const isNegative = cents < 0;
  const displayCents = Math.abs(cents);
  
  // Determine color based on type
  const colorClass =
    type === 'income'
      ? 'text-positive'
      : type === 'expense'
        ? 'text-destructive'
        : '';

  // Format the amount
  const formatted = formatCents(displayCents);
  
  // Build the display string
  let prefix = '';
  if (showSign) {
    if (type === 'income' || (!isNegative && type === 'neutral')) {
      prefix = '+';
    } else if (type === 'expense' || isNegative) {
      prefix = '-';
    }
  } else if (isNegative) {
    prefix = '-';
  }

  return (
    <span
      className={cn(
        'font-mono tabular-nums tracking-tight',
        sizeClasses[size],
        colorClass,
        // Premium animation
        animate && 'animate-number',
        className
      )}
    >
      {prefix}
      {formatted}
    </span>
  );
}

/**
 * Compact amount for tables and lists.
 */
export function AmountCompact({
  cents,
  className,
}: {
  cents: number;
  className?: string;
}) {
  return (
    <AmountDisplay
      cents={cents}
      size="sm"
      className={cn('text-right', className)}
    />
  );
}

/**
 * Large amount display for summaries and totals.
 */
export function AmountLarge({
  cents,
  label,
  type = 'neutral',
  className,
}: {
  cents: number;
  label?: string;
  type?: 'neutral' | 'income' | 'expense';
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col', className)}>
      {label && (
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          {label}
        </span>
      )}
      <AmountDisplay cents={cents} size="xl" type={type} />
    </div>
  );
}
