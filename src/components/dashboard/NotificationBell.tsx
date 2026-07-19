"use client"

import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"

interface Notification {
    id: string
    type: "error" | "warning" | "info"
    title: string
    message: string
    actionLabel?: string
    actionHref?: string
    platform?: string
}

const TYPE_STYLES = {
    error: {
        dot: "bg-red-500",
        bg: "bg-red-50 dark:bg-red-950/30",
        text: "text-red-800 dark:text-red-400",
        border: "border-red-200 dark:border-red-800",
    },
    warning: {
        dot: "bg-yellow-500",
        bg: "bg-yellow-50 dark:bg-yellow-950/30",
        text: "text-yellow-800 dark:text-yellow-400",
        border: "border-yellow-200 dark:border-yellow-800",
    },
    info: {
        dot: "bg-primary/50",
        bg: "bg-primary/5 dark:bg-primary/10",
        text: "text-primary dark:text-primary",
        border: "dark:border-white/10 dark:border-border",
    },
}

const PLATFORM_ICONS: Record<string, string> = {
    youtube: "▶️",
    twitch: "📺",
    kick: "🦶",
    facebook: "f",
    instagram: "📷",
    twitter: "𝕏",
    tiktok: "♪",
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    async function fetchNotifications() {
        try {
            const res = await fetch("/api/notifications")
            if (res.ok) {
                const data = await res.json()
                setNotifications(data.data || [])
            }
        } catch {
            // Silently fail
        } finally {
            setLoading(false)
        }
    }

    const hasNotifications = notifications.length > 0
    const errorCount = notifications.filter(n => n.type === "error").length
    const warningCount = notifications.filter(n => n.type === "warning").length
    const totalCount = notifications.length

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted dark:text-muted-foreground dark:hover:bg-accent transition-colors"
                aria-label={`Notifications (${totalCount} unread)`}
            >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {hasNotifications && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {totalCount > 9 ? "9+" : totalCount}
                    </span>
                )}
                {loading && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center">
                        <span className="h-2 w-2 animate-ping rounded-full bg-muted" />
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-white shadow-lg dark:border-border dark:bg-background">
                    <div className="border-b border-border px-4 py-3 dark:border-border">
                        <h3 className="text-sm font-semibold text-foreground dark:text-foreground">
                            Notifications
                        </h3>
                        {hasNotifications && (
                            <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                                {errorCount > 0 && `${errorCount} error${errorCount > 1 ? "s" : ""}`}
                                {errorCount > 0 && warningCount > 0 && " · "}
                                {warningCount > 0 && `${warningCount} warning${warningCount > 1 ? "s" : ""}`}
                            </p>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-sm text-muted-foreground dark:text-muted-foreground">
                                <svg className="mx-auto mb-2 h-8 w-8 text-muted-foreground dark:text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                                            "border-b border-gray-100 px-4 py-3 last:border-b-0 dark:border-border",
                                            notification.type === "error" && "bg-red-50/50 dark:bg-red-950/20"
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className={cn("mt-1 flex h-2 w-2 shrink-0 rounded-full", style.dot)} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    {notification.platform && (
                                                        <span className="text-xs">{PLATFORM_ICONS[notification.platform] || ""}</span>
                                                    )}
                                                    <p className="text-sm font-medium text-foreground dark:text-foreground truncate">
                                                        {notification.title}
                                                    </p>
                                                </div>
                                                <p className="mt-0.5 text-xs text-muted-foreground dark:text-muted-foreground">
                                                    {notification.message}
                                                </p>
                                                {notification.actionLabel && notification.actionHref && (
                                                    <a
                                                        href={notification.actionHref}
                                                        className="mt-2 inline-block text-xs font-medium text-primary hover:text-primary dark:text-primary"
                                                        onClick={() => setIsOpen(false)}
                                                    >
                                                        {notification.actionLabel} →
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
