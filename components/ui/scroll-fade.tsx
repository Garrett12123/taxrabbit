'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type ScrollFadeProps = {
  children: React.ReactNode;
  className?: string;
  /** Fade direction - top, bottom, or both */
  fade?: 'top' | 'bottom' | 'both';
  /** Height of the fade gradient */
  fadeHeight?: number;
};

/**
 * Scrollable container with fade edges.
 * Creates a premium scroll experience with gradient indicators.
 */
export function ScrollFade({
  children,
  className,
  fade = 'both',
  fadeHeight = 24,
}: ScrollFadeProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [showTopFade, setShowTopFade] = React.useState(false);
  const [showBottomFade, setShowBottomFade] = React.useState(false);

  const handleScroll = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isScrollable = scrollHeight > clientHeight;

    if (fade === 'top' || fade === 'both') {
      setShowTopFade(isScrollable && scrollTop > 0);
    }
    if (fade === 'bottom' || fade === 'both') {
      setShowBottomFade(isScrollable && scrollTop < scrollHeight - clientHeight - 1);
    }
  }, [fade]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check initial state
    handleScroll();

    // Observe resize
    const observer = new ResizeObserver(handleScroll);
    observer.observe(container);

    return () => observer.disconnect();
  }, [handleScroll]);

  return (
    <div className={cn('relative', className)}>
      {/* Top fade */}
      {(fade === 'top' || fade === 'both') && (
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 top-0 z-10 transition-opacity duration-200',
            'bg-gradient-to-b from-background to-transparent',
            showTopFade ? 'opacity-100' : 'opacity-0'
          )}
          style={{ height: fadeHeight }}
        />
      )}

      {/* Scrollable content */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="overflow-y-auto"
      >
        {children}
      </div>

      {/* Bottom fade */}
      {(fade === 'bottom' || fade === 'both') && (
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-0 z-10 transition-opacity duration-200',
            'bg-gradient-to-t from-background to-transparent',
            showBottomFade ? 'opacity-100' : 'opacity-0'
          )}
          style={{ height: fadeHeight }}
        />
      )}
    </div>
  );
}
