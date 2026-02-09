import { cn } from "@/lib/utils"

function Skeleton({ 
  className, 
  variant = "default",
  ...props 
}: React.ComponentProps<"div"> & {
  variant?: "default" | "shimmer" | "pulse"
}) {
  return (
    <div
      data-slot="skeleton"
      data-variant={variant}
      className={cn(
        "rounded-md",
        // Base background
        "bg-muted/60",
        // Variant-specific animations
        variant === "default" && [
          // Premium shimmer sweep
          "relative overflow-hidden",
          "after:absolute after:inset-0",
          "after:bg-gradient-to-r after:from-transparent after:via-muted-foreground/5 after:to-transparent",
          "after:animate-[shimmer-sweep_2s_ease-in-out_infinite]",
          "after:translate-x-[-100%]",
        ],
        variant === "shimmer" && [
          // More prominent shimmer for important elements
          "relative overflow-hidden",
          "bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60",
          "bg-[length:200%_100%]",
          "animate-[shimmer-sweep_1.5s_ease-in-out_infinite]",
        ],
        variant === "pulse" && [
          // Subtle pulse for minimal distraction
          "animate-pulse",
        ],
        className
      )}
      {...props}
    />
  )
}

/**
 * Skeleton with circular shape for avatars and icons
 */
function SkeletonCircle({ 
  className, 
  size = "default",
  ...props 
}: React.ComponentProps<"div"> & {
  size?: "sm" | "default" | "lg"
}) {
  return (
    <Skeleton
      className={cn(
        "rounded-full",
        size === "sm" && "size-8",
        size === "default" && "size-10",
        size === "lg" && "size-14",
        className
      )}
      {...props}
    />
  )
}

/**
 * Skeleton text line for content placeholders
 */
function SkeletonText({ 
  className, 
  lines = 1,
  ...props 
}: React.ComponentProps<"div"> & {
  lines?: number
}) {
  if (lines === 1) {
    return (
      <Skeleton
        className={cn("h-4 w-full", className)}
        {...props}
      />
    )
  }

  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            // Last line is shorter for natural look
            i === lines - 1 ? "w-3/4" : "w-full"
          )}
          style={{
            // Stagger animation delays
            animationDelay: `${i * 100}ms`,
          }}
        />
      ))}
    </div>
  )
}

/**
 * Card-shaped skeleton for card placeholders
 */
function SkeletonCard({ 
  className,
  ...props 
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-6 space-y-4",
        "animate-in fade-in-0 duration-300",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-4">
        <SkeletonCircle size="default" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" variant="pulse" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  )
}

export { Skeleton, SkeletonCircle, SkeletonText, SkeletonCard }
