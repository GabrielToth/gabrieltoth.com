"use client"

import { cn } from "@/lib/utils"
import React from "react"

export interface NavItem {
    id: string
    label: string
    icon?: React.ReactNode
}

export interface NavMenuProps {
    items: NavItem[]
    activeItem: string
    onItemClick: (itemId: string) => void
    className?: string
}

/**
 * NavMenu Component
 * Main navigation tabs for dashboard sections
 * Features:
 * - Accepts items array with id, label, and optional icon
 * - Active state indicator
 * - Click callback for navigation
 * - Tailwind CSS styling with Vercel color palette
 * - Accessible with ARIA attributes
 */
export const NavMenu: React.FC<NavMenuProps> = ({
    items,
    activeItem,
    onItemClick,
    className,
}) => {
    return (
        <nav
            className={cn("flex flex-col space-y-1", className)}
            role="navigation"
            aria-label="Main navigation"
        >
            {items.map(item => (
                <button
                    key={item.id}
                    onClick={() => onItemClick(item.id)}
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                        activeItem === item.id
                            ? "bg-blue-50 text-blue-600"
                            : "text-gray-700 hover:bg-gray-50"
                    )}
                    aria-current={activeItem === item.id ? "page" : undefined}
                    aria-label={item.label}
                >
                    {item.icon && (
                        <span className="flex h-5 w-5 items-center justify-center">
                            {item.icon}
                        </span>
                    )}
                    <span>{item.label}</span>
                </button>
            ))}
        </nav>
    )
}
