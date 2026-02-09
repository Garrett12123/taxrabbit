"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from "lucide-react"

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  )
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        // Base styles
        "flex w-fit items-center justify-between gap-2",
        "rounded-md border border-input bg-transparent",
        "py-2 pr-2.5 pl-3 text-sm",
        "shadow-xs outline-none whitespace-nowrap",
        "dark:bg-input/30",
        // Size variants
        "data-[size=default]:h-9 data-[size=sm]:h-8",
        // Placeholder styling
        "data-[placeholder]:text-muted-foreground/60",
        // Value styling
        "*:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center",
        "*:data-[slot=select-value]:gap-1.5 *:data-[slot=select-value]:line-clamp-1",
        // Icon styling
        "[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        // Premium transitions
        "transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
        // Hover state
        "hover:border-input/80 hover:shadow-sm",
        "dark:hover:bg-input/50",
        // Focus state with animated ring
        "focus-visible:border-ring",
        "focus-visible:ring-[3px] focus-visible:ring-ring/30",
        "focus-visible:shadow-[0_0_0_3px_oklch(from_var(--ring)_l_c_h/0.1)]",
        // Open state
        "data-[state=open]:border-ring data-[state=open]:ring-[3px] data-[state=open]:ring-ring/30",
        // Invalid state
        "aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20",
        "dark:aria-invalid:ring-destructive/40 dark:aria-invalid:border-destructive/50",
        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon 
          className={cn(
            "size-4 text-muted-foreground pointer-events-none",
            "transition-transform duration-200",
            "group-data-[state=open]:rotate-180"
          )} 
        />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = "item-aligned",
  align = "center",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        data-align-trigger={position === "item-aligned"}
        className={cn(
          "relative z-50",
          "min-w-36 max-h-(--radix-select-content-available-height)",
          "rounded-lg p-1",
          // Premium styling
          "bg-popover text-popover-foreground",
          "ring-1 ring-foreground/5 dark:ring-white/10",
          "shadow-[0_8px_30px_-4px_oklch(0_0_0/0.15),0_4px_12px_-2px_oklch(0_0_0/0.1)]",
          "dark:shadow-[0_8px_30px_-4px_oklch(0_0_0/0.4),0_4px_12px_-2px_oklch(0_0_0/0.25)]",
          // Scrolling
          "overflow-x-hidden overflow-y-auto",
          "scrollbar-premium",
          "origin-(--radix-select-content-transform-origin)",
          // Premium animations
          "data-open:animate-in data-closed:animate-out",
          "data-closed:fade-out-0 data-open:fade-in-0",
          "data-closed:zoom-out-95 data-open:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2",
          "data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2",
          "data-[side=top]:slide-in-from-bottom-2",
          "duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "data-[align-trigger=true]:animate-none",
          position === "popper" && [
            "data-[side=bottom]:translate-y-1",
            "data-[side=left]:-translate-x-1",
            "data-[side=right]:translate-x-1",
            "data-[side=top]:-translate-y-1",
          ],
          className
        )}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          data-position={position}
          className={cn(
            "data-[position=popper]:h-[var(--radix-select-trigger-height)]",
            "data-[position=popper]:w-full",
            "data-[position=popper]:min-w-[var(--radix-select-trigger-width)]"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full items-center gap-2",
        "rounded-md py-2 pr-8 pl-2.5 text-sm",
        "cursor-default select-none outline-hidden",
        // Icon styling
        "[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        "*:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        // Premium transitions
        "transition-all duration-150 ease-out",
        // Focus/hover state with premium highlight
        "focus:bg-primary/10 focus:text-foreground",
        "not-data-[variant=destructive]:focus:**:text-accent-foreground",
        // Highlight selected state
        "data-[state=checked]:bg-primary/5",
        "data-[state=checked]:font-medium",
        // Disabled state
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4 text-primary animate-in zoom-in-50 duration-150" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("bg-border -mx-1 my-1 h-px pointer-events-none", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn("bg-popover z-10 flex cursor-default items-center justify-center py-1 [&_svg:not([class*='size-'])]:size-4", className)}
      {...props}
    >
      <ChevronUpIcon
      />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn("bg-popover z-10 flex cursor-default items-center justify-center py-1 [&_svg:not([class*='size-'])]:size-4", className)}
      {...props}
    >
      <ChevronDownIcon
      />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
