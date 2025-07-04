"use client"

import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"
import { IconType } from "react-icons"

interface IconProps {
    icon: LucideIcon | IconType
    size?: number
    className?: string
}

export const Icon = ({
    icon: IconComponent,
    size = 24,
    className,
}: IconProps) => {
    return (
        <div className={cn("flex items-center justify-center", className)}>
            <IconComponent size={size} />
        </div>
    )
}
