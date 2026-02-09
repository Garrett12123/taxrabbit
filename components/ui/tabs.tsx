"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "gap-2 group/tabs flex data-[orientation=horizontal]:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  [
    "group/tabs-list inline-flex w-fit items-center justify-center",
    "text-muted-foreground",
    "group-data-horizontal/tabs:h-10",
    "group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col",
    "data-[variant=line]:rounded-none",
  ],
  {
    variants: {
      variant: {
        default: [
          "rounded-lg p-1 gap-1",
          "bg-muted/60",
          // Subtle inner shadow for depth
          "shadow-[inset_0_1px_2px_0_oklch(0_0_0/0.05)]",
        ],
        line: [
          "gap-1 bg-transparent",
          "border-b border-border",
        ],
        pills: [
          "gap-2 bg-transparent",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // Base styles
        "relative inline-flex h-8 flex-1 items-center justify-center",
        "gap-1.5 px-3 py-1.5",
        "text-sm font-medium whitespace-nowrap select-none",
        "rounded-md border border-transparent",
        "[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        // Default state
        "text-muted-foreground",
        // Premium transitions
        "transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
        // Hover state
        "hover:text-foreground",
        // Focus state with premium ring
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        "focus-visible:border-ring",
        // Disabled
        "disabled:pointer-events-none disabled:opacity-50",
        // Vertical orientation
        "group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start",
        
        // === DEFAULT VARIANT (pill container) ===
        "group-data-[variant=default]/tabs-list:data-active:bg-background",
        "group-data-[variant=default]/tabs-list:data-active:text-foreground",
        "group-data-[variant=default]/tabs-list:data-active:shadow-sm",
        // Subtle scale on active
        "group-data-[variant=default]/tabs-list:data-active:scale-[1.02]",
        "group-data-[variant=default]/tabs-list:active:scale-[0.98]",
        
        // === LINE VARIANT (underline indicator) ===
        "group-data-[variant=line]/tabs-list:rounded-none",
        "group-data-[variant=line]/tabs-list:bg-transparent",
        "group-data-[variant=line]/tabs-list:border-b-2 group-data-[variant=line]/tabs-list:border-transparent",
        "group-data-[variant=line]/tabs-list:-mb-px",
        "group-data-[variant=line]/tabs-list:data-active:border-primary",
        "group-data-[variant=line]/tabs-list:data-active:text-foreground",
        // Animated underline
        "group-data-[variant=line]/tabs-list:after:absolute",
        "group-data-[variant=line]/tabs-list:after:bottom-0 group-data-[variant=line]/tabs-list:after:left-0 group-data-[variant=line]/tabs-list:after:right-0",
        "group-data-[variant=line]/tabs-list:after:h-0.5 group-data-[variant=line]/tabs-list:after:bg-primary",
        "group-data-[variant=line]/tabs-list:after:scale-x-0 group-data-[variant=line]/tabs-list:after:transition-transform",
        "group-data-[variant=line]/tabs-list:after:duration-200 group-data-[variant=line]/tabs-list:after:ease-[cubic-bezier(0.16,1,0.3,1)]",
        "group-data-[variant=line]/tabs-list:data-active:after:scale-x-100",
        
        // === PILLS VARIANT ===
        "group-data-[variant=pills]/tabs-list:rounded-full",
        "group-data-[variant=pills]/tabs-list:px-4",
        "group-data-[variant=pills]/tabs-list:bg-transparent",
        "group-data-[variant=pills]/tabs-list:hover:bg-muted",
        "group-data-[variant=pills]/tabs-list:data-active:bg-primary",
        "group-data-[variant=pills]/tabs-list:data-active:text-primary-foreground",
        "group-data-[variant=pills]/tabs-list:data-active:shadow-md",
        "group-data-[variant=pills]/tabs-list:data-active:shadow-primary/25",
        
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "text-sm flex-1 outline-none",
        // Crossfade with subtle slide for content change
        "data-[state=active]:animate-in data-[state=active]:fade-in-0",
        "data-[state=active]:slide-in-from-bottom-1",
        "data-[state=inactive]:animate-out data-[state=inactive]:fade-out-0",
        "data-[state=inactive]:hidden",
        "duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
        // Focus visible
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
