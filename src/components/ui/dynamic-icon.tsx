"use client"

import { IconName, getIconByName } from "@/lib/icons"
import { cn } from "@/lib/utils"

interface DynamicIconProps {
    name: IconName
    size?: number
    className?: string
}

export const DynamicIcon = ({
    name,
    size = 24,
    className,
}: DynamicIconProps) => {
    const IconComponent = getIconByName(name)

    if (!IconComponent) {
        return (
            <div
                className={cn(
                    "flex items-center justify-center",
                    className
                )}
                style={{ width: size, height: size }}
                aria-hidden="true"
            />
        )
    }

    return (
        <div className={cn("flex items-center justify-center", className)}>
            <IconComponent size={size} />
        </div>
    )
}
