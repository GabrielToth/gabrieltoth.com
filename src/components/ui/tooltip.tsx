"use client"

import { cn } from "@/lib/utils"
import * as React from "react"

const TooltipProvider = ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
)

const Tooltip = ({ children }: { children: React.ReactNode }) => <>{children}</>

const TooltipTrigger = React.forwardRef<
    HTMLElement,
    React.HTMLAttributes<HTMLElement> & { asChild?: boolean }
>(({ className, asChild, children, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, {
            ...props,
            ref,
            className: cn(
                (children.props as { className?: string }).className,
                className
            ),
        } as React.HTMLAttributes<HTMLElement>)
    }

    return (
        <span
            ref={ref as React.Ref<HTMLSpanElement>}
            role="presentation"
            className={cn("inline-flex", className)}
            {...props}
        >
            {children}
        </span>
    )
})
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
