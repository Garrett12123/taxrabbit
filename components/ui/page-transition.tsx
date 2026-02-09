'use client';

import { cn } from '@/lib/utils';

type PageTransitionProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Wraps page content with a smooth entrance animation.
 * Use in page.tsx files to add premium page transitions.
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <div className={cn('animate-page-enter', className)}>
      {children}
    </div>
  );
}

/**
 * Staggered entrance for multiple items.
 * Children animate in sequence with delays.
 */
export function StaggeredEntrance({ 
  children, 
  className,
  staggerDelay = 50,
}: PageTransitionProps & { staggerDelay?: number }) {
  return (
    <div 
      className={cn('contents', className)}
      style={{ '--stagger-delay': `${staggerDelay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/**
 * Individual stagger item - use inside StaggeredEntrance
 */
export function StaggerItem({ 
  children, 
  index = 0,
  className,
}: { 
  children: React.ReactNode; 
  index?: number;
  className?: string;
}) {
  return (
    <div 
      className={cn('animate-slide-up', className)}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
    >
      {children}
    </div>
  );
}
