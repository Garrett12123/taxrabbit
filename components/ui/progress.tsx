"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

type ProgressProps = React.ComponentProps<typeof ProgressPrimitive.Root> & {
  variant?: 'default' | 'success' | 'warning' | 'error';
};

const variantClasses = {
  default: 'bg-primary',
  success: 'bg-positive',
  warning: 'bg-warning',
  error: 'bg-destructive',
};

function Progress({
  className,
  value,
  variant = 'default',
  ...props
}: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-muted h-1.5 rounded-full relative flex w-full items-center overflow-x-hidden",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "size-full flex-1 rounded-full transition-all duration-500 ease-out",
          variantClasses[variant]
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
