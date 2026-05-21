"use client"

import { cn } from "@/lib/utils"
import * as React from "react"

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: string
    onValueChange?: (value: string) => void
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn("grid gap-2", className)}
            role="radiogroup"
            {...props}
        />
    )
)
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
    <input
        ref={ref}
        type="radio"
        className={cn(
            "h-4 w-4 border border-primary text-primary focus:ring-2 focus:ring-ring",
            className
        )}
        {...props}
    />
))
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
