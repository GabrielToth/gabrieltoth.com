"use client"

import { cn } from "@/lib/utils"
import * as React from "react"

const TooltipProvider = ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
)

const Tooltip = ({ children }: { children: React.ReactNode }) => <>{children}</>

const TooltipTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, asChild: _asChild, ...props }, ref) => (
    <button ref={ref} type="button" className={cn(className)} {...props} />
))
TooltipTrigger.displayName = "TooltipTrigger"

const TooltipContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md",
            className
        )}
        {...props}
    />
))
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }

