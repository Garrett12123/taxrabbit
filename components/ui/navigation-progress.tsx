'use client';

import { useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * Simple progress store to avoid setState-in-effect lint issues.
 */
let progressState = { progress: 0, visible: false };
const listeners = new Set<() => void>();

function setProgressState(next: Partial<typeof progressState>) {
  progressState = { ...progressState, ...next };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return progressState;
}

/**
 * Thin navigation progress bar (GitHub/YouTube style).
 * Shows during route transitions to eliminate "did anything happen?" anxiety.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { progress, visible } = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPath = useRef(pathname);
  const prevSearch = useRef(searchParams.toString());

  const cleanup = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  // When route completes, finish the bar
  useEffect(() => {
    const currentSearch = searchParams.toString();
    if (prevPath.current === pathname && prevSearch.current === currentSearch) {
      return;
    }

    prevPath.current = pathname;
    prevSearch.current = currentSearch;

    if (!visible) return;

    cleanup();
    setProgressState({ progress: 100 });

    timerRef.current = setTimeout(() => {
      setProgressState({ visible: false, progress: 0 });
    }, 300);

    return cleanup;
  }, [pathname, searchParams, visible, cleanup]);

  // Start progress on navigation start (detected via click on links)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http')) return;
      if (target.getAttribute('target') === '_blank') return;

      // Only trigger for internal navigation that changes the path
      const url = new URL(href, window.location.origin);
      if (url.pathname !== pathname || url.search !== window.location.search) {
        cleanup();
        setProgressState({ visible: true, progress: 15 });

        // Trickle progress
        let current = 15;
        intervalRef.current = setInterval(() => {
          current += Math.random() * 8;
          if (current > 85) current = 85;
          setProgressState({ progress: current });
        }, 200);
      }
    };

    document.addEventListener('click', handleClick, { capture: true });

    return () => {
      document.removeEventListener('click', handleClick, { capture: true });
      cleanup();
    };
  }, [pathname, cleanup]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] h-[2px] pointer-events-none"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
    >
      <div
        className={cn(
          'h-full bg-primary',
          'transition-all ease-[cubic-bezier(0.16,1,0.3,1)]',
          progress >= 100 ? 'duration-200 opacity-0' : 'duration-500',
        )}
        style={{ width: `${progress}%` }}
      >
        {/* Glow tip */}
        <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-r from-transparent to-primary/50 blur-sm" />
      </div>
    </div>
  );
}
