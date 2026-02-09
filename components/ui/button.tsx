import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    // Base styles
    "rounded-md border border-transparent bg-clip-padding text-sm font-medium",
    "inline-flex items-center justify-center whitespace-nowrap select-none shrink-0",
    "[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    "outline-none group/button relative overflow-hidden",
    // Premium transitions
    "transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
    // Active press with spring feel
    "active:scale-[0.97] active:duration-75",
    // Focus ring with glow
    "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring",
    "focus-visible:shadow-[0_0_0_2px_var(--background),0_0_12px_0_oklch(from_var(--ring)_l_c_h/0.25)]",
    // Invalid states
    "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
    "aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 aria-invalid:ring-[3px]",
    // Disabled
    "disabled:pointer-events-none disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground",
          // Premium hover with shine effect
          "hover:brightness-105 hover:shadow-[0_4px_12px_-2px_oklch(from_var(--primary)_l_c_h/0.4)]",
          "active:brightness-95 active:shadow-[0_2px_4px_-1px_oklch(from_var(--primary)_l_c_h/0.3)]",
          // Shine sweep on hover
          "after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent",
          "after:translate-x-[-200%] after:skew-x-[-25deg] after:transition-transform after:duration-500 after:ease-out",
          "hover:after:translate-x-[200%]",
        ],
        outline: [
          "border-border bg-background shadow-xs",
          "dark:bg-input/30 dark:border-input",
          "hover:bg-muted hover:text-foreground hover:shadow-sm hover:border-border/80",
          "dark:hover:bg-input/50",
          "aria-expanded:bg-muted aria-expanded:text-foreground",
          "active:bg-muted/80",
        ],
        secondary: [
          "bg-secondary text-secondary-foreground",
          "hover:bg-secondary/80 hover:shadow-sm",
          "active:bg-secondary/70",
          "aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ],
        ghost: [
          "hover:bg-muted hover:text-foreground",
          "dark:hover:bg-muted/50",
          "aria-expanded:bg-muted aria-expanded:text-foreground",
          "active:bg-muted/80",
        ],
        destructive: [
          "bg-destructive/15 text-destructive",
          "hover:bg-destructive/25 hover:shadow-[0_2px_8px_-2px_oklch(from_var(--destructive)_l_c_h/0.3)]",
          "dark:bg-destructive/20 dark:hover:bg-destructive/30",
          "focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
          "focus-visible:border-destructive/40",
          "active:bg-destructive/35",
        ],
        link: [
          "text-primary underline-offset-4",
          "hover:underline",
          "active:opacity-80",
        ],
        success: [
          "bg-positive/15 text-positive",
          "hover:bg-positive/25 hover:shadow-[0_2px_8px_-2px_oklch(from_var(--positive)_l_c_h/0.3)]",
          "dark:bg-positive/20 dark:hover:bg-positive/30",
          "focus-visible:ring-positive/20",
          "active:bg-positive/30",
        ],
        premium: [
          "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground",
          "hover:shadow-[0_4px_16px_-2px_oklch(from_var(--primary)_l_c_h/0.5),0_0_0_1px_oklch(from_var(--primary)_l_c_h/0.2)]",
          "hover:-translate-y-0.5",
          "active:translate-y-0 active:shadow-[0_2px_8px_-2px_oklch(from_var(--primary)_l_c_h/0.4)]",
          // Glow effect
          "before:absolute before:inset-0 before:rounded-[inherit] before:opacity-0",
          "before:bg-gradient-to-r before:from-primary/0 before:via-primary/30 before:to-primary/0",
          "before:blur-xl before:transition-opacity before:duration-300",
          "hover:before:opacity-100",
        ],
      },
      size: {
        default: "h-9 gap-1.5 px-3 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xs: "h-6 gap-1 rounded-md px-2 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 rounded-md px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
        lg: "h-10 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 text-base",
        xl: "h-12 gap-2 px-6 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4 text-base font-semibold",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-md in-data-[slot=button-group]:rounded-md",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
