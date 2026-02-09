import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  [
    "bg-card text-card-foreground rounded-lg border",
    "py-6 gap-6 data-[size=sm]:gap-4 data-[size=sm]:py-4",
    "has-[>img:first-child]:pt-0 *:[img:first-child]:rounded-t-lg *:[img:last-child]:rounded-b-lg",
    "group/card flex flex-col text-sm overflow-hidden",
    "transition-all duration-200 ease-out",
  ],
  {
    variants: {
      variant: {
        default: "shadow-sm",
        elevated: [
          "shadow-[0_1px_3px_0_oklch(0_0_0/0.04),0_1px_2px_-1px_oklch(0_0_0/0.04)]",
          "hover:shadow-[0_8px_16px_-4px_oklch(0_0_0/0.08),0_4px_8px_-4px_oklch(0_0_0/0.04)]",
          "hover:-translate-y-0.5",
        ],
        glass: [
          "bg-card/80 backdrop-blur-xl backdrop-saturate-150",
          "border-white/10 dark:border-white/5",
          "shadow-[0_4px_24px_-4px_oklch(0_0_0/0.08)]",
        ],
        glow: [
          "shadow-sm",
          "hover:shadow-[0_4px_12px_-2px_oklch(0_0_0/0.06),0_0_0_1px_oklch(from_var(--border)_l_c_h/0.5),0_0_24px_-4px_oklch(from_var(--primary)_l_c_h/0.12)]",
          "hover:-translate-y-0.5",
        ],
        metric: [
          "shadow-sm relative overflow-hidden",
          "before:absolute before:inset-0 before:bg-gradient-to-br before:from-transparent before:to-muted/30 before:opacity-0 before:transition-opacity before:duration-300",
          "hover:before:opacity-100",
        ],
      },
      size: {
        default: "",
        sm: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Card({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      data-size={size}
      data-variant={variant}
      className={cn(cardVariants({ variant, size }), className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "px-6 group-data-[size=sm]/card:px-4",
        "gap-1.5",
        "[.border-b]:pb-6 group-data-[size=sm]/card:[.border-b]:pb-4",
        "group/card-header @container/card-header",
        "grid auto-rows-min items-start",
        "has-data-[slot=card-action]:grid-cols-[1fr_auto]",
        "has-data-[slot=card-description]:grid-rows-[auto_auto]",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "text-base leading-normal font-semibold",
        "group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6 group-data-[size=sm]/card:px-4", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "px-6 group-data-[size=sm]/card:px-4",
        "[.border-t]:pt-6 group-data-[size=sm]/card:[.border-t]:pt-4",
        "flex items-center",
        className
      )}
      {...props}
    />
  )
}

/**
 * Interactive card variant with hover lift effect.
 * Use for clickable cards like navigation items or selectable options.
 */
function CardInteractive({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "bg-card text-card-foreground rounded-lg border",
        "py-6 gap-6 data-[size=sm]:gap-4 data-[size=sm]:py-4",
        "has-[>img:first-child]:pt-0 *:[img:first-child]:rounded-t-lg *:[img:last-child]:rounded-b-lg",
        "group/card flex flex-col text-sm overflow-hidden",
        // Premium interactive enhancements
        "cursor-pointer",
        "shadow-[0_1px_3px_0_oklch(0_0_0/0.03),0_1px_2px_-1px_oklch(0_0_0/0.03)]",
        "transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
        // Hover state with glow
        "hover:shadow-[0_8px_24px_-4px_oklch(0_0_0/0.1),0_4px_8px_-4px_oklch(0_0_0/0.04),0_0_0_1px_oklch(from_var(--primary)_l_c_h/0.08)]",
        "hover:-translate-y-1",
        // Active state
        "active:scale-[0.98] active:shadow-[0_2px_8px_-2px_oklch(0_0_0/0.08)] active:translate-y-0",
        "active:transition-[transform,box-shadow] active:duration-75",
        // Focus state
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "focus-visible:shadow-[0_0_0_2px_var(--background),0_0_0_4px_var(--ring),0_0_12px_0_oklch(from_var(--ring)_l_c_h/0.3)]",
        // Gradient border on hover
        "relative before:absolute before:inset-0 before:rounded-[inherit] before:p-px",
        "before:bg-gradient-to-br before:from-transparent before:via-transparent before:to-primary/20",
        "before:opacity-0 before:transition-opacity before:duration-300 before:pointer-events-none",
        "hover:before:opacity-100",
        className
      )}
      tabIndex={0}
      role="button"
      {...props}
    />
  )
}

/**
 * Metric card for displaying animated statistics.
 * Features a subtle gradient overlay and optimized for number displays.
 */
function CardMetric({
  className,
  size = "default",
  trend,
  ...props
}: React.ComponentProps<"div"> & { 
  size?: "default" | "sm"
  trend?: "up" | "down" | "neutral"
}) {
  return (
    <div
      data-slot="card"
      data-size={size}
      data-trend={trend}
      className={cn(
        "bg-card text-card-foreground rounded-lg border",
        "py-6 gap-6 data-[size=sm]:gap-4 data-[size=sm]:py-4",
        "group/card flex flex-col text-sm overflow-hidden",
        "shadow-[0_1px_2px_0_oklch(0_0_0/0.03)]",
        "transition-shadow duration-200 ease-out",
        "hover:shadow-[0_2px_8px_-2px_oklch(0_0_0/0.08)]",
        className
      )}
      {...props}
    />
  )
}

/**
 * Glass card variant with backdrop blur effect.
 * Best used over colorful or image backgrounds.
 */
function CardGlass({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "text-card-foreground rounded-lg",
        "py-6 gap-6 data-[size=sm]:gap-4 data-[size=sm]:py-4",
        "group/card flex flex-col text-sm overflow-hidden",
        // Glassmorphism effect
        "bg-card/70 dark:bg-card/60",
        "backdrop-blur-xl backdrop-saturate-150",
        "border border-white/20 dark:border-white/10",
        "shadow-[0_4px_24px_-4px_oklch(0_0_0/0.1),inset_0_1px_0_0_oklch(1_0_0/0.1)]",
        "transition-all duration-300 ease-out",
        // Hover state
        "hover:bg-card/80 dark:hover:bg-card/70",
        "hover:shadow-[0_8px_32px_-4px_oklch(0_0_0/0.12),inset_0_1px_0_0_oklch(1_0_0/0.15)]",
        "hover:-translate-y-0.5",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  CardInteractive,
  CardMetric,
  CardGlass,
  cardVariants,
}
