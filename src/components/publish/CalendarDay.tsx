"use client"

import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

export interface CalendarDayProps {
    day: number
    isCurrentMonth: boolean
    isToday: boolean
    postCount: number
    draftCount?: number
    isWeekend?: boolean
    onSelect: () => void
}

export default function CalendarDay({
    day,
    isCurrentMonth,
    isToday,
    postCount,
    draftCount = 0,
    isWeekend = false,
    onSelect,
}: CalendarDayProps) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const t = useTranslations("dashboard.publish")
    if (!isCurrentMonth) {
        return <div className="h-10 sm:h-14" />
    }

    const onlyDrafts = postCount > 0 && draftCount === postCount
    const hasNonDrafts = postCount > 0 && draftCount < postCount

    return (
        <button
            onClick={onSelect}
            className={cn(
                "relative flex h-10 sm:h-14 flex-col items-center justify-center rounded-lg text-sm transition-colors",
                "hover:bg-primary/5 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-primary/20 dark:hover:text-primary",
                isWeekend && "text-muted-foreground dark:text-muted-foreground",
                isToday &&
                    "bg-primary/10 font-semibold text-primary ring-2 ring-ring dark:bg-primary/10 dark:text-primary dark:ring-ring",
                !isToday && "text-foreground dark:text-muted-foreground"
            )}
            aria-label={`${day}${postCount > 0 ? `, ${postCount} ${postCount !== 1 ? "posts" : "post"}` : ""}`}
        >
            <span>{day}</span>
            {postCount > 0 && (
                <span
                    className={cn(
                        "absolute -bottom-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full",
                        onlyDrafts && "bg-muted dark:bg-muted0",
                        hasNonDrafts && "bg-primary/50"
                    )}
                />
            )}
        </button>
    )
}
