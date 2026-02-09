'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { SuccessCheck } from '@/components/ui/success-check';
import { cn } from '@/lib/utils';

type LoadingButtonProps = React.ComponentProps<typeof Button> & {
  loading?: boolean;
  success?: boolean;
  loadingText?: string;
  successText?: string;
};

/**
 * Button with integrated loading and success states.
 * Provides premium visual feedback during async operations.
 */
export function LoadingButton({
  children,
  loading = false,
  success = false,
  loadingText,
  successText,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  // Auto-reset success state after showing
  const [showSuccess, setShowSuccess] = React.useState(false);

  React.useEffect(() => {
    if (success) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const isDisabled = disabled || loading;

  return (
    <Button
      disabled={isDisabled}
      className={cn(
        'relative overflow-hidden',
        // Premium transitions
        'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
        // Success state with glow
        showSuccess && [
          'bg-positive text-white hover:bg-positive',
          'shadow-[0_0_16px_-2px_oklch(from_var(--positive)_l_c_h/0.4)]',
        ],
        // Loading state with premium shimmer
        loading && 'shimmer-premium',
        className
      )}
      {...props}
    >
      {/* Default content */}
      <span
        className={cn(
          'flex items-center gap-2',
          'transition-all duration-200 ease-out',
          (loading || showSuccess) && 'opacity-0 scale-95'
        )}
      >
        {children}
      </span>
      
      {/* Loading state with smooth entrance */}
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center gap-2',
          'transition-all duration-200 ease-out',
          loading ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        )}
      >
        <Spinner className="size-4" />
        {loadingText && (
          <span className="animate-pulse">{loadingText}</span>
        )}
      </span>
      
      {/* Success state with celebration feel */}
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center gap-2',
          'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          showSuccess && !loading 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-90 pointer-events-none'
        )}
      >
        <SuccessCheck size="sm" />
        {successText && (
          <span className="font-medium">{successText}</span>
        )}
      </span>
    </Button>
  );
}
