'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type AnimatedCounterProps = {
  value: number;
  /** Duration in milliseconds */
  duration?: number;
  /** Format function (e.g., for currency) */
  formatter?: (value: number) => string;
  className?: string;
  /** Animate on mount or on value change */
  animateOnMount?: boolean;
};

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/**
 * Check if user prefers reduced motion
 */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Animated number counter with smooth easing.
 * Perfect for dashboard metrics, totals, and statistics.
 *
 * Preserves previous value on data changes so numbers count from
 * old → new instead of resetting to 0 (e.g., when switching tax years).
 */
export function AnimatedCounter({
  value,
  duration = 1000,
  formatter = (v) => v.toLocaleString(),
  className,
  animateOnMount = true,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(animateOnMount ? 0 : value);
  const previousValue = useRef(animateOnMount ? 0 : value);
  const animationRef = useRef<number | null>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    // Skip animation if user prefers reduced motion
    if (prefersReducedMotion()) {
      setDisplayValue(value);
      previousValue.current = value;
      return;
    }

    // Cancel any in-progress animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const startValue = previousValue.current;
    const endValue = value;

    // If values are the same, skip animation
    if (startValue === endValue && hasAnimated.current) {
      return;
    }

    const startTime = performance.now();
    // Use shorter duration for subsequent animations (value changes)
    const animDuration = hasAnimated.current ? Math.min(duration, 600) : duration;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animDuration, 1);
      const easedProgress = easeOutExpo(progress);
      
      const current = startValue + (endValue - startValue) * easedProgress;
      setDisplayValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
        hasAnimated.current = true;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        // Persist the current display value so next animation starts from here
        previousValue.current = displayValue;
      }
    };
    // Intentionally only depend on value and duration, not displayValue
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return (
    <span className={cn('tabular-nums', className)}>
      {formatter(Math.round(displayValue))}
    </span>
  );
}

/**
 * Animated currency counter (in cents)
 */
export function AnimatedCurrency({
  cents,
  duration = 1000,
  className,
  showSign = false,
}: {
  cents: number;
  duration?: number;
  className?: string;
  showSign?: boolean;
}) {
  const formatter = (value: number) => {
    const dollars = value / 100;
    const formatted = dollars.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });
    if (showSign && value > 0) {
      return `+${formatted}`;
    }
    return formatted;
  };

  return (
    <AnimatedCounter
      value={cents}
      duration={duration}
      formatter={formatter}
      className={cn('font-mono tracking-tight', className)}
    />
  );
}

/**
 * Animated percentage
 */
export function AnimatedPercentage({
  value,
  duration = 800,
  decimals = 0,
  className,
}: {
  value: number;
  duration?: number;
  decimals?: number;
  className?: string;
}) {
  const formatter = (v: number) => `${v.toFixed(decimals)}%`;

  return (
    <AnimatedCounter
      value={value}
      duration={duration}
      formatter={formatter}
      className={className}
    />
  );
}
