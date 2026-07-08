"use client"

import { Button } from "@/components/ui/button"
import {
    addMonths,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isSameDay,
    isSameMonth,
    isToday,
    startOfMonth,
    startOfWeek,
    subMonths,
} from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useCallback, useMemo, useState } from "react"
import CalendarDay from "./CalendarDay"

export interface CalendarPost {
    id: string
    scheduledTime: number
    status?: string
}

export interface CalendarViewProps {
    posts: CalendarPost[]
    selectedDate: Date | null
    onSelectDate: (date: Date) => void
}

export default function CalendarView({
    posts,
    selectedDate,
    onSelectDate,
}: CalendarViewProps) {
    const t = useTranslations("dashboard.publish")
    const locale = useLocale()
    const DAY_HEADERS = useMemo(() => {
        const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" })
        return Array.from({ length: 7 }, (_, i) =>
            formatter.format(new Date(2024, 0, i + 1))
        )
    }, [locale])
    const [currentMonth, setCurrentMonth] = useState(new Date())

    const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth])
    const monthEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth])
    const calendarStart = useMemo(
        () => startOfWeek(monthStart, { weekStartsOn: 0 }),
        [monthStart]
    )
    const calendarEnd = useMemo(
        () => endOfWeek(monthEnd, { weekStartsOn: 0 }),
        [monthEnd]
    )

    const days = useMemo(
        () => eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
        [calendarStart, calendarEnd]
    )

    const postDays = useMemo(() => {
        const map = new Map<string, number>()
        const draftMap = new Map<string, number>()
        for (const post of posts) {
            const dateKey = format(new Date(post.scheduledTime), "yyyy-MM-dd")
            map.set(dateKey, (map.get(dateKey) || 0) + 1)
            if (post.status === "draft") {
                draftMap.set(dateKey, (draftMap.get(dateKey) || 0) + 1)
            }
        }
        return { all: map, drafts: draftMap }
    }, [posts])

    const goToPrevMonth = useCallback(
        () => setCurrentMonth(d => subMonths(d, 1)),
        []
    )
    const goToNextMonth = useCallback(
        () => setCurrentMonth(d => addMonths(d, 1)),
        []
    )
    const goToToday = useCallback(() => setCurrentMonth(new Date()), [])

    const weeks = useMemo(() => {
        const result: Date[][] = []
        for (let i = 0; i < days.length; i += 7) {
            result.push(days.slice(i, i + 7))
        }
        return result
    }, [days])

    return (
        <div className="rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {format(currentMonth, "MMMM yyyy")}
                </h2>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={goToPrevMonth}
                        aria-label={t("previousMonth")}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={goToToday}
                        className="text-xs"
                    >
                        {t("today")}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={goToNextMonth}
                        aria-label={t("nextMonth")}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-px">
                {DAY_HEADERS.map(header => (
                    <div
                        key={header}
                        className="py-2 text-center text-xs font-medium text-gray-600 dark:text-gray-400"
                    >
                        {header}
                    </div>
                ))}

                {weeks.map((week, weekIdx) =>
                    week.map((day, dayIdx) => {
                        const dateKey = format(day, "yyyy-MM-dd")
                        const count = postDays.all.get(dateKey) || 0
                        const draftCount = postDays.drafts.get(dateKey) || 0
                        const today = isToday(day)
                        const currentMonth = isSameMonth(day, monthStart)

                        return (
                            <CalendarDay
                                key={`${weekIdx}-${dayIdx}`}
                                day={day.getDate()}
                                isCurrentMonth={currentMonth}
                                isToday={today}
                                postCount={count}
                                draftCount={draftCount}
                                isWeekend={
                                    day.getDay() === 0 || day.getDay() === 6
                                }
                                onSelect={() => onSelectDate(day)}
                            />
                        )
                    })
                )}
            </div>

            <div className="mt-3 flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                    <span>{t("hasScheduledPosts")}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500" />
                    <span>{t("hasDrafts")}</span>
                </div>
                {selectedDate && (
                    <div className="flex items-center gap-1 text-blue-700 dark:text-blue-400">
                        <span>
                            {t("selected", {
                                date: format(selectedDate, "MMM d, yyyy"),
                            })}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}
