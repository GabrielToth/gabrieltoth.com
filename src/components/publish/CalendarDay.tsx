"use client"

import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

export interface CalendarDayProps {
    day: number
    isCurrentMonth: boolean
    isToday: boolean
    postCount: number
    isWeekend?: boolean
    onSelect: () => void
}

export default function CalendarDay({
    day,
    isCurrentMonth,
    isToday,
    postCount,
    isWeekend = false,
    onSelect,
}: CalendarDayProps) {
    const t = useTranslations("dashboard.publish")
    if (!isCurrentMonth) {
        return <div className="h-10 sm:h-14" />
    }

    return (
        <button
            onClick={onSelect}
            className={cn(
                "relative flex h-10 sm:h-14 flex-col items-center justify-center rounded-lg text-sm transition-colors",
                "hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-blue-950/50 dark:hover:text-blue-400",
                isWeekend && "text-gray-500 dark:text-gray-500",
                isToday &&
                    "bg-blue-100 font-semibold text-blue-700 ring-2 ring-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:ring-blue-700",
                !isToday && "text-gray-900 dark:text-gray-200"
            )}
            aria-label={`${day}${postCount > 0 ? `, ${postCount} ${postCount !== 1 ? "posts" : "post"}` : ""}`}
        >
            <span>{day}</span>
            {postCount > 0 && (
                <span className="absolute -bottom-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-blue-500" />
            )}
        </button>
    )
}
