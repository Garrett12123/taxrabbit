'use client';

import { useCallback, useRef } from 'react';
import { toast } from 'sonner';

type UseUndoToastOptions = {
  /** Duration before the action becomes permanent (ms) */
  timeout?: number;
};

/**
 * Hook for undo-able toast pattern.
 * Shows a toast with an "Undo" button after a destructive action.
 * If not undone within the timeout, executes the permanent action.
 *
 * Usage:
 *   const { trigger } = useUndoToast();
 *   trigger({
 *     message: 'Item removed.',
 *     onUndo: () => restoreItem(id),
 *     onConfirm: () => permanentlyDelete(id),
 *   });
 */
export function useUndoToast({ timeout = 5000 }: UseUndoToastOptions = {}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoneRef = useRef(false);

  const trigger = useCallback(
    ({
      message,
      onUndo,
      onConfirm,
    }: {
      message: string;
      onUndo: () => void;
      onConfirm?: () => void;
    }) => {
      undoneRef.current = false;

      // Clear any previous timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      toast(message, {
        action: {
          label: 'Undo',
          onClick: () => {
            undoneRef.current = true;
            if (timerRef.current) clearTimeout(timerRef.current);
            onUndo();
          },
        },
        duration: timeout,
        onDismiss: () => {
          // When the toast naturally dismisses (timeout or swipe), finalize
          if (!undoneRef.current) {
            onConfirm?.();
          }
        },
      });

      // Auto-finalize after timeout as a backup
      timerRef.current = setTimeout(() => {
        if (!undoneRef.current) {
          onConfirm?.();
        }
      }, timeout + 500);
    },
    [timeout]
  );

  return { trigger };
}
