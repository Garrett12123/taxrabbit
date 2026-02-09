import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styles
        "h-9 w-full min-w-0 rounded-md border px-3 py-1.5",
        "text-base md:text-sm",
        "bg-transparent dark:bg-input/30",
        "border-input",
        "shadow-xs",
        "outline-none",
        // Placeholder
        "placeholder:text-muted-foreground/60",
        // Premium transitions
        "transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
        // Hover state
        "hover:border-input/80 hover:shadow-sm",
        // Focus state with animated ring
        "focus-visible:border-ring",
        "focus-visible:ring-[3px] focus-visible:ring-ring/30",
        "focus-visible:shadow-[0_0_0_3px_oklch(from_var(--ring)_l_c_h/0.1),0_1px_2px_0_oklch(0_0_0/0.05)]",
        // Valid/success state
        "data-[valid=true]:border-positive/50",
        "data-[valid=true]:ring-positive/20",
        "data-[valid=true]:shadow-[0_0_0_3px_oklch(from_var(--positive)_l_c_h/0.1)]",
        // Invalid/error state with shake animation
        "aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20",
        "dark:aria-invalid:ring-destructive/40 dark:aria-invalid:border-destructive/50",
        "aria-invalid:animate-shake",
        // File input styling
        "file:h-7 file:text-sm file:font-medium",
        "file:text-foreground file:inline-flex file:border-0 file:bg-transparent",
        "file:mr-2 file:cursor-pointer",
        // Disabled state
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "disabled:bg-muted/50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
