'use client';

import { Suspense, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type SuspenseCrossfadeProps = {
  fallback: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Wrapper around Suspense that crossfades from skeleton → content.
 * Skeleton fades out and content slides up gently.
 */
export function SuspenseCrossfade({
  fallback,
  children,
  className,
}: SuspenseCrossfadeProps) {
  return (
    <Suspense
      fallback={
        <div className={cn('animate-in fade-in-0 duration-150', className)}>
          {fallback}
        </div>
      }
    >
      <div
        className={cn(
          'animate-in fade-in-0 slide-in-from-bottom-1 duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          className,
        )}
      >
        {children}
      </div>
    </Suspense>
  );
}
