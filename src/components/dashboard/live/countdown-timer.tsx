/**
 * CountdownTimer Component
 * Displays a live countdown to a target time with two display modes
 */

"use client"

import { useTranslations } from "next-intl"
import { useCallback, useEffect, useRef, useState } from "react"

interface CountdownTimerProps {
    targetTime: string
    onExpired?: () => void
    compact?: boolean
}

interface TimeRemaining {
    days: number
    hours: number
    minutes: number
    seconds: number
}

function calculateTimeRemaining(targetTime: string): TimeRemaining | null {
    const target = new Date(targetTime).getTime()
    const now = Date.now()
    const diff = target - now

    if (diff <= 0) {
        return null
    }

    const totalSeconds = Math.floor(diff / 1000)
    return {
        days: Math.floor(totalSeconds / 86400),
        hours: Math.floor((totalSeconds % 86400) / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
    }
}

export function CountdownTimer({
    targetTime,
    onExpired,
    compact = false,
}: CountdownTimerProps) {
    const t = useTranslations("dashboard.live")
    const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(
        () => calculateTimeRemaining(targetTime)
    )
    const [expired, setExpired] = useState(false)
    const onExpiredRef = useRef(onExpired)
    onExpiredRef.current = onExpired

    const tick = useCallback(() => {
        const remaining = calculateTimeRemaining(targetTime)
        if (remaining === null) {
            if (!expired) {
                setExpired(true)
                onExpiredRef.current?.()
            }
            setTimeRemaining(null)
        } else {
            setTimeRemaining(remaining)
        }
    }, [targetTime, expired])

    useEffect(() => {
        // Initial calculation
        tick()

        // Set up interval
        const interval = setInterval(tick, 1000)

        return () => {
            clearInterval(interval)
        }
    }, [tick])

    if (expired || timeRemaining === null) {
        return (
            <div className="text-center">
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    {t("startingNow")}
                </span>
            </div>
        )
    }

    if (compact) {
        return (
            <div className="text-center">
                <span className="font-mono text-sm font-medium text-gray-700 dark:text-gray-300">
                    {timeRemaining.hours > 0 && `${timeRemaining.hours}h `}
                    {timeRemaining.minutes}m {timeRemaining.seconds}s
                </span>
            </div>
        )
    }

    return (
        <div className="text-center">
            <div className="flex items-center justify-center gap-4">
                {timeRemaining.days > 0 && (
                    <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                            {timeRemaining.days}
                        </div>
                        <div className="text-xs text-gray-500">days</div>
                    </div>
                )}
                <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {String(timeRemaining.hours).padStart(2, "0")}
                    </div>
                    <div className="text-xs text-gray-500">hours</div>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {String(timeRemaining.minutes).padStart(2, "0")}
                    </div>
                    <div className="text-xs text-gray-500">min</div>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {String(timeRemaining.seconds).padStart(2, "0")}
                    </div>
                    <div className="text-xs text-gray-500">sec</div>
                </div>
            </div>
        </div>
    )
}
