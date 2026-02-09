'use client';

import { useEffect } from 'react';

/**
 * Hook to intercept Cmd+S / Ctrl+S and trigger a save callback.
 * Prevents the browser's default "save page" behavior.
 *
 * Usage:
 *   useSaveShortcut(handleSave);
 */
export function useSaveShortcut(
  onSave: () => void,
  enabled: boolean = true,
) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        onSave();
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onSave, enabled]);
}
