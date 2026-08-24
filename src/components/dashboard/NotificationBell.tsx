"use client"

import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

interface SystemNotification {
    id: string
    type: "error" | "warning" | "info"
    title: string
    message: string
    actionLabel?: string
    actionHref?: string
    platform?: string
    timestamp: string
}

const TYPE_STYLES = {
    error: {
        badge: "bg-error-bg text-error dark:bg-error-bg/20 dark:text-error",
        dot: "bg-error",
        border: "border-error/20",
    },
    warning: {
        badge: "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400",
        dot: "bg-amber-500",
        border: "border-amber-200 dark:border-amber-900/30",
    },
    info: {
        badge: "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400",
        dot: "bg-blue-500",
        border: "border-blue-200 dark:border-blue-900/30",
    },
}

const PLATFORM_ICONS: Record<string, string> = {
    youtube: "🔴",
    facebook: "🔵",
    instagram: "📸",
    tiktok: "🎵",
    kick: "🟢",
    twitch: "💜",
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<SystemNotification[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(true)

    const fetchNotifications = async () => {
        try {
            const response = await fetch("/api/notifications")
            if (response.ok) {
                const data = await response.json()
                setNotifications(data.notifications || [])
            }
        } catch {
            // Silently handle error
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 60000)
        return () => clearInterval(interval)
    }, [])

    const hasNotifications = notifications.length > 0
    const errorCount = notifications.filter(n => n.type === "error").length
    const warningCount = notifications.filter(n => n.type === "warning").length

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex items-center justify-center rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground min-h-11 min-w-11"
                aria-label="System notifications"
            >
                <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>
                {hasNotifications && (
                    <span className="absolute right-1 top-1 flex h-2 w-2">
                        <span
                            className={cn(
                                "inline-flex h-full w-full rounded-full opacity-75 animate-ping",
                                errorCount > 0 ? "bg-error" : "bg-amber-500"
                            )}
                        />
                        <span
                            className={cn(
                                "relative inline-flex h-2 w-2 rounded-full",
                                errorCount > 0 ? "bg-error" : "bg-amber-500"
                            )}
                        />
                    </span>
                )}
                {loading && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center">
                        <span className="h-2 w-2 animate-ping rounded-full bg-muted" />
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-1rem)] rounded-xl border border-border bg-card shadow-lg">
                    <div className="border-b border-border px-4 py-3">
                        <h3 className="text-sm font-semibold text-foreground">
                            Notifications
                        </h3>
                        {hasNotifications && (
                            <p className="text-xs text-muted-foreground">
                                {errorCount > 0 &&
                                    `${errorCount} error${errorCount > 1 ? "s" : ""}`}
                                {errorCount > 0 && warningCount > 0 && " · "}
                                {warningCount > 0 &&
                                    `${warningCount} warning${warningCount > 1 ? "s" : ""}`}
                            </p>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                <svg
                                    className="mx-auto mb-2 h-8 w-8 text-muted-foreground"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                All clear — no issues detected
                            </div>
                        ) : (
                            notifications.map(notification => {
                                const style = TYPE_STYLES[notification.type]
                                return (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "border-b border-border px-4 py-3 last:border-b-0",
                                            notification.type === "error" &&
                                                "bg-error-bg/50"
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span
                                                className={cn(
                                                    "mt-1 flex h-2 w-2 shrink-0 rounded-full",
                                                    style.dot
                                                )}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    {notification.platform && (
                                                        <span className="text-xs">
                                                            {PLATFORM_ICONS[
                                                                notification
                                                                    .platform
                                                            ] || ""}
                                                        </span>
                                                    )}
                                                    <p className="text-sm font-medium text-foreground truncate">
                                                        {notification.title}
                                                    </p>
                                                </div>
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    {notification.message}
                                                </p>
                                                {notification.actionLabel &&
                                                    notification.actionHref && (
                                                        <a
                                                            href={
                                                                notification.actionHref
                                                            }
                                                            className="mt-2 inline-block text-xs font-medium text-primary hover:text-primary"
                                                            onClick={() =>
                                                                setIsOpen(false)
                                                            }
                                                        >
                                                            {
                                                                notification.actionLabel
                                                            }{" "}
                                                            →
                                                        </a>
                                                    )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
