'use client';

import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook to warn users before navigating away with unsaved form changes.
 * Attaches a beforeunload listener when the form is dirty.
 *
 * Usage:
 *   const { markDirty, markClean, isDirty } = useFormGuard();
 *   // Call markDirty() when form values change from initial
 *   // Call markClean() after successful save
 */
export function useFormGuard() {
  const dirtyRef = useRef(false);

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
  }, []);

  const markClean = useCallback(() => {
    dirtyRef.current = false;
  }, []);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  return {
    markDirty,
    markClean,
    get isDirty() {
      return dirtyRef.current;
    },
  };
}
