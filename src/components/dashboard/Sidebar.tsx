"use client"

import LanguageSelector from "@/components/ui/language-selector"
import { ThemeToggleClient } from "@/components/theme/theme-toggle-client"
import { Button } from "@/components/ui/button"
import { logger } from "@/lib/logger"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import React, { useEffect, useState } from "react"
import { NotificationBell } from "./NotificationBell"

export interface SidebarProps {
    activeTab: "publish" | "insights" | "channels" | "settings" | "live"
    onTabChange: (
        tab: "publish" | "insights" | "channels" | "settings" | "live"
    ) => void
    isOpen?: boolean
    onClose?: () => void
    organization?: {
        name: string
        plan: "free" | "pro" | "enterprise"
    }
    onLogout?: () => void
}

type ChannelStatus = "connected" | "disconnected" | "attention"

/**
 * Sidebar Component
 * Navigation and organization info sidebar
 * Features:
 * - Logo (40x40)
 * - Navigation Menu (Publish, Insights, Settings)
 * - Connect Channels section
 * - Organization Info
 * - Logout Button
 * - Responsive: 240px on desktop, hamburger on mobile (<768px)
 * - Touch-friendly buttons (44x44px minimum)
 * - Readable text sizes (16px minimum on mobile)
 */
export const Sidebar: React.FC<SidebarProps> = ({
    activeTab,
    onTabChange,
    isOpen = false,
    onClose,
    organization: orgProp,
    onLogout,
}) => {
    const t = useTranslations("dashboard.sidebar")
    const lt = useTranslations("dashboard.layout")
    const organization = orgProp ?? {
        name: lt("myOrganization"),
        plan: "pro",
    }
    const [connectingChannel, setConnectingChannel] = useState<string | null>(
        null
    )
    const [connectionError, setConnectionError] = useState<string | null>(null)
    const [channelStatuses, setChannelStatuses] = useState<Record<string, ChannelStatus>>({})

    useEffect(() => {
        async function fetchStatuses() {
            try {
                const res = await fetch("/api/notifications")
                if (res.ok) {
                    const data = await res.json()
                    const notifications = data.data || []
                    const hasErrors = new Set<string>(
                        notifications
                            .filter((n: { platform?: string; type: string }) => n.platform && n.type === "error")
                            .map((n: { platform: string }) => n.platform)
                    )
                    const hasWarnings = new Set<string>(
                        notifications
                            .filter((n: { platform?: string; type: string }) => n.platform && n.type === "warning")
                            .map((n: { platform: string }) => n.platform)
                    )
                    setChannelStatuses(prev => {
                        const updated = { ...prev }
                        for (const plat of hasErrors) updated[plat] = "attention"
                        for (const plat of hasWarnings) {
                            if (!updated[plat] || updated[plat] !== "attention") updated[plat] = "attention"
                        }
                        return updated
                    })
                }
            } catch {
                // silent
            }
        }
        fetchStatuses()
        const interval = setInterval(fetchStatuses, 60000)
        return () => clearInterval(interval)
    }, [])

    const handleChannelConnect = async (channelId: string) => {
        if (connectingChannel) return
        setConnectingChannel(channelId)
        try {
            const response = await fetch(`/api/oauth/authorize/${channelId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            })
            if (!response.ok) {
                const data = await response.json()
                throw new Error(
                    data.message || `Failed to start ${channelId} linking`
                )
            }
            const data = await response.json()
            if (data.authorizationUrl) {
                window.location.href = data.authorizationUrl
            } else {
                throw new Error("No authorization URL returned")
            }
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : `Failed to connect ${channelId}`
            logger.error(`Failed to connect ${channelId}`, { error: err })
            setConnectionError(message)
            setConnectingChannel(null)
            // Auto-clear error after 5 seconds
            setTimeout(() => setConnectionError(null), 5000)
        }
    }

    const navItems = [
        { id: "publish", label: t("publish"), icon: "📝" },
        { id: "live", label: t("live"), icon: "📡" },
        { id: "insights", label: t("insights"), icon: "📊" },
        { id: "channels", label: t("channels"), icon: "🔗" },
        { id: "settings", label: t("settings"), icon: "⚙️" },
    ] as const

    const channels = [
        { id: "youtube", name: "YouTube", icon: "▶️" },
        { id: "facebook", name: "Facebook", icon: "f" },
        { id: "instagram", name: "Instagram", icon: "📷" },
        { id: "twitter", name: "Twitter/X", icon: "𝕏" },
        { id: "tiktok", name: "TikTok", icon: "♪" },
        { id: "linkedin", name: "LinkedIn", icon: "in" },
    ] as const

    const STATUS_DOT: Record<ChannelStatus, { color: string; label: string }> = {
        connected: { color: "bg-success", label: "Connected" },
        disconnected: { color: "bg-muted", label: "Disconnected" },
        attention: { color: "bg-error", label: "Needs attention" },
    }

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "hidden w-60 flex-col border-r border-border bg-card md:flex dark:border-border dark:bg-background",
                    "overflow-y-auto"
                )}
            >
                {/* Logo Section */}
                <div className="flex items-center justify-between border-b border-border px-4 py-6">
                    <div className="flex items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                            D
                        </div>
                        <span className="ml-3 text-lg font-semibold text-foreground">
                            {lt("dashboard")}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <NotificationBell />
                        <ThemeToggleClient />
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 space-y-1 px-3 py-6">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={cn(
                                "w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors min-h-11",
                                activeTab === item.id
                                    ? "bg-primary/5 text-primary dark:bg-primary/10 dark:text-primary"
                                    : "text-foreground hover:bg-muted dark:text-foreground dark:hover:bg-accent"
                            )}
                            aria-current={
                                activeTab === item.id ? "page" : undefined
                            }
                        >
                            <span className="mr-3">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* Connect Channels Section */}
                <div className="border-t border-border dark:border-border px-6 py-4">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-muted-foreground">
                        {t("connectChannels")}
                    </h3>
                    {connectionError && (
                        <div className="mb-3 rounded-md bg-error-bg p-2 text-xs text-error">
                            {connectionError}
                        </div>
                    )}
                    <div className="grid grid-cols-3 gap-2">
                        {channels.map(channel => (
                            <button
                                key={channel.id}
                                onClick={() => handleChannelConnect(channel.id)}
                                className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-card text-sm font-medium text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-colors min-h-11 min-w-11 dark:border-border dark:bg-card dark:text-muted-foreground dark:hover:bg-primary/20 dark:hover:text-primary"
                                title={channel.name}
                                aria-label={lt("connectChannel", {
                                    channel: channel.name,
                                })}
                                disabled={connectingChannel === channel.id}
                            >
                                {channel.icon}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Organization Info */}
                <div className="border-t border-border dark:border-border px-6 py-4">
                    <div className="rounded-lg bg-muted p-3 dark:bg-card">
                        <p className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground">
                            {lt("organization")}
                        </p>
                        <p className="mt-1 text-sm font-medium text-foreground dark:text-foreground">
                            {organization.name}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground dark:text-muted-foreground capitalize">
                            {t("plan." + organization.plan)}
                        </p>
                    </div>
                </div>

                {/* Logout Button */}
                <div className="border-t border-border dark:border-border px-3 py-4">
                    <Button
                        onClick={onLogout}
                        variant="ghost"
                        className="w-full justify-start text-foreground hover:bg-muted hover:text-foreground min-h-11 dark:text-foreground dark:hover:bg-accent dark:hover:text-foreground"
                    >
                        <span className="mr-2">🚪</span>
                        {t("logout")}
                    </Button>
                </div>
            </aside>

            {/* Mobile Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-40 w-60 flex-col border-r border-border bg-card transition-transform duration-300 ease-in-out md:hidden overflow-y-auto dark:border-border dark:bg-background",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Close Button */}
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <div className="flex items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                            D
                        </div>
                        <span className="ml-3 text-lg font-semibold text-foreground">
                            {lt("dashboard")}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <NotificationBell />
                        <button
                            onClick={onClose}
                            className="rounded-md p-2 text-muted-foreground hover:bg-muted min-h-11 min-w-11 dark:text-muted-foreground dark:hover:bg-accent"
                            aria-label={lt("closeSidebar")}
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
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 space-y-1 px-3 py-6">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={cn(
                                "w-full rounded-lg px-4 py-3 text-left text-base font-medium transition-colors min-h-11",
                                activeTab === item.id
                                    ? "bg-primary/5 text-primary dark:bg-primary/10 dark:text-primary"
                                    : "text-foreground hover:bg-muted dark:text-foreground dark:hover:bg-accent"
                            )}
                            aria-current={
                                activeTab === item.id ? "page" : undefined
                            }
                        >
                            <span className="mr-3">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* Language & Theme (mobile only) */}
                <div className="border-t border-border dark:border-border px-6 py-4">
                    <div className="flex items-center justify-between gap-2">
                        <LanguageSelector variant="default" />
                        <ThemeToggleClient />
                    </div>
                </div>

                    {/* Connect Channels Section */}
                <div className="border-t border-border dark:border-border px-6 py-4">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-muted-foreground">
                        {t("connectChannels")}
                    </h3>
                    {connectionError && (
                        <div className="mb-3 rounded-md bg-error-bg p-2 text-xs text-error">
                            {connectionError}
                        </div>
                    )}
                    <div className="grid grid-cols-3 gap-2">
                        {channels.map(channel => {
                            const status = channelStatuses[channel.id]
                            const dot = status ? STATUS_DOT[status] : null
                            return (
                                <div key={channel.id} className="relative inline-flex">
                                    <button
                                        onClick={() => handleChannelConnect(channel.id)}
                                        className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-card text-sm font-medium text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-colors min-h-11 min-w-11 dark:border-border dark:bg-card dark:text-muted-foreground dark:hover:bg-primary/20 dark:hover:text-primary"
                                        title={channel.name}
                                        aria-label={lt("connectChannel", {
                                            channel: channel.name,
                                        })}
                                        disabled={connectingChannel === channel.id}
                                    >
                                        {channel.icon}
                                    </button>
                                    {dot && (
                                        <span
                                            className={cn(
                                                "absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-card dark:border-background",
                                                dot.color
                                            )}
                                            title={dot.label}
                                        />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Organization Info */}
                <div className="border-t border-border dark:border-border px-6 py-4">
                    <div className="rounded-lg bg-muted p-3 dark:bg-card">
                        <p className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground">
                            {lt("organization")}
                        </p>
                        <p className="mt-1 text-sm font-medium text-foreground dark:text-foreground">
                            {organization.name}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground dark:text-muted-foreground capitalize">
                            {t("plan." + organization.plan)}
                        </p>
                    </div>
                </div>

                {/* Logout Button */}
                <div className="border-t border-border dark:border-border px-3 py-4">
                    <Button
                        onClick={onLogout}
                        variant="ghost"
                        className="w-full justify-start text-foreground hover:bg-muted hover:text-foreground min-h-11 dark:text-foreground dark:hover:bg-accent dark:hover:text-foreground"
                    >
                        <span className="mr-2">🚪</span>
                        {t("logout")}
                    </Button>
                </div>
            </aside>

        </>
    )
}
