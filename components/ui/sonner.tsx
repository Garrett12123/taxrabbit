"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"
import { cn } from "@/lib/utils"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <div className="flex size-5 items-center justify-center rounded-full bg-positive/15 text-positive">
            <CircleCheckIcon className="size-3.5 animate-in zoom-in-50 duration-200" />
          </div>
        ),
        info: (
          <div className="flex size-5 items-center justify-center rounded-full bg-primary/15 text-primary">
            <InfoIcon className="size-3.5 animate-in zoom-in-50 duration-200" />
          </div>
        ),
        warning: (
          <div className="flex size-5 items-center justify-center rounded-full bg-warning/15 text-warning-foreground">
            <TriangleAlertIcon className="size-3.5 animate-in zoom-in-50 duration-200" />
          </div>
        ),
        error: (
          <div className="flex size-5 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            <OctagonXIcon className="size-3.5 animate-in zoom-in-50 duration-200" />
          </div>
        ),
        loading: (
          <div className="flex size-5 items-center justify-center">
            <Loader2Icon className="size-4 text-muted-foreground animate-spin" />
          </div>
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "12px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: cn(
            "cn-toast",
            // Premium styling
            "!bg-popover/95 !backdrop-blur-xl !backdrop-saturate-150",
            "!border-border/50",
            "!shadow-[0_8px_30px_-4px_oklch(0_0_0/0.15),0_4px_12px_-2px_oklch(0_0_0/0.1)]",
            // Premium animations
            "data-[state=open]:animate-in data-[state=open]:slide-in-from-top-2",
            "data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-full",
            "data-[state=closed]:fade-out-0",
            "!duration-300 !ease-[cubic-bezier(0.16,1,0.3,1)]",
          ),
          title: "!font-medium !text-foreground",
          description: "!text-muted-foreground",
          actionButton: cn(
            "!bg-primary !text-primary-foreground",
            "!transition-all !duration-200",
            "hover:!brightness-110 hover:!shadow-md",
          ),
          cancelButton: cn(
            "!bg-muted !text-muted-foreground",
            "!transition-all !duration-200",
            "hover:!bg-muted/80",
          ),
          closeButton: cn(
            "!bg-transparent !text-muted-foreground",
            "!transition-all !duration-150",
            "hover:!text-foreground hover:!bg-muted",
          ),
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
