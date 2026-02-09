'use client';

import { cn } from '@/lib/utils';

type SuccessCheckProps = {
  className?: string;
  size?: 'sm' | 'default' | 'lg';
};

/**
 * Animated success checkmark with draw-in effect.
 * Use after successful form submissions or completed actions.
 */
export function SuccessCheck({ className, size = 'default' }: SuccessCheckProps) {
  const sizeClasses = {
    sm: 'size-4',
    default: 'size-6',
    lg: 'size-8',
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn(sizeClasses[size], 'text-positive', className)}
    >
      {/* Circle */}
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        className="animate-circle-draw"
        style={{
          strokeDasharray: 63,
          strokeDashoffset: 63,
        }}
      />
      {/* Checkmark */}
      <path
        d="M8 12l2.5 2.5L16 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-check-draw"
        style={{
          strokeDasharray: 14,
          strokeDashoffset: 14,
        }}
      />
    </svg>
  );
}
