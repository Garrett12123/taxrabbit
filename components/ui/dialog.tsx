"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50",
        // Premium backdrop with blur and subtle vignette
        "bg-black/20 dark:bg-black/40",
        "supports-backdrop-filter:backdrop-blur-md supports-backdrop-filter:backdrop-saturate-150",
        // Subtle radial vignette effect
        "bg-[radial-gradient(circle_at_center,transparent_0%,oklch(0_0_0/0.15)_100%)]",
        // Smooth animations
        "data-open:animate-in data-closed:animate-out",
        "data-closed:fade-out-0 data-open:fade-in-0",
        "duration-200 ease-out",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          // Base styles
          "fixed top-1/2 left-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2",
          "max-w-[calc(100%-2rem)] max-h-[calc(100dvh-2rem)] sm:max-w-md",
          "flex flex-col gap-6 p-6 text-sm outline-none overflow-hidden",
          // Premium card styling
          "bg-background rounded-xl",
          "ring-1 ring-foreground/5 dark:ring-white/10",
          // Elevated shadow with depth
          "shadow-[0_24px_48px_-12px_oklch(0_0_0/0.25),0_12px_24px_-8px_oklch(0_0_0/0.15),0_0_0_1px_oklch(0_0_0/0.05)]",
          "dark:shadow-[0_24px_48px_-12px_oklch(0_0_0/0.5),0_12px_24px_-8px_oklch(0_0_0/0.3),0_0_0_1px_oklch(1_0_0/0.05)]",
          // Scale from center animation (no slide)
          "data-open:animate-in data-closed:animate-out",
          "data-closed:fade-out-0 data-open:fade-in-0",
          "data-closed:zoom-out-95 data-open:zoom-in-95",
          "duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <Button 
              variant="ghost" 
              className={cn(
                "absolute top-3 right-3",
                "text-muted-foreground/60 hover:text-foreground",
                "hover:bg-muted/80",
                "transition-colors duration-150",
              )}
              size="icon-sm"
            >
              <XIcon className="size-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "gap-2 flex flex-col flex-shrink-0",
        // Stagger animation for header content
        "[&>*]:animate-slide-up",
        "[&>*:nth-child(1)]:animation-delay-[0ms]",
        "[&>*:nth-child(2)]:animation-delay-[50ms]",
        className
      )}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:justify-end flex-shrink-0",
        // Subtle entrance animation
        "animate-slide-up animation-delay-[100ms]",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogBody({ className, stagger = false, ...props }: React.ComponentProps<"div"> & { stagger?: boolean }) {
  return (
    <div
      data-slot="dialog-body"
      className={cn(
        "flex-1 min-h-0 overflow-y-auto -mx-6 px-6",
        // Premium scrollbar
        "scrollbar-premium",
        // Content animation
        "animate-slide-up animation-delay-[75ms]",
        // Stagger children when enabled (form fields cascade in)
        stagger && [
          "[&>[data-slot=field]]:opacity-0 [&>[data-slot=field]]:animate-slide-up",
          "[&>[data-slot=field]:nth-child(1)]:animation-delay-[50ms]",
          "[&>[data-slot=field]:nth-child(2)]:animation-delay-[80ms]",
          "[&>[data-slot=field]:nth-child(3)]:animation-delay-[110ms]",
          "[&>[data-slot=field]:nth-child(4)]:animation-delay-[140ms]",
          "[&>[data-slot=field]:nth-child(5)]:animation-delay-[170ms]",
          "[&>[data-slot=field]:nth-child(6)]:animation-delay-[200ms]",
          "[&>[data-slot=field]:nth-child(7)]:animation-delay-[230ms]",
          "[&>[data-slot=field]:nth-child(8)]:animation-delay-[260ms]",
          "[&>div]:opacity-0 [&>div]:animate-slide-up",
          "[&>div:nth-child(1)]:animation-delay-[50ms]",
          "[&>div:nth-child(2)]:animation-delay-[80ms]",
          "[&>div:nth-child(3)]:animation-delay-[110ms]",
          "[&>div:nth-child(4)]:animation-delay-[140ms]",
          "[&>div:nth-child(5)]:animation-delay-[170ms]",
          "[&>div:nth-child(6)]:animation-delay-[200ms]",
          "[&>div:nth-child(7)]:animation-delay-[230ms]",
          "[&>div:nth-child(8)]:animation-delay-[260ms]",
        ],
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "text-lg font-semibold leading-none tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground",
        "*:[a]:text-foreground *:[a]:underline *:[a]:underline-offset-3",
        "*:[a]:transition-colors *:[a]:hover:text-primary",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
