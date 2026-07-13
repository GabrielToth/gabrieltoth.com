"use client"

import LanguageSelector from "@/components/ui/language-selector"
import { ThemeToggleClient } from "@/components/theme/theme-toggle-client"
import { Button } from "@/components/ui/button"
import { logger } from "@/lib/logger"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import React, { useState } from "react"

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
    ]

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "hidden w-60 flex-col border-r border-gray-200 bg-white md:flex dark:border-gray-800 dark:bg-gray-900",
                    "overflow-y-auto"
                )}
            >
                {/* Logo Section */}
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-4 py-6">
                    <div className="flex items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
                            D
                        </div>
                        <span className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
                            {lt("dashboard")}
                        </span>
                    </div>
                    <ThemeToggleClient />
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
                                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                                    : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
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
                <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                        {t("connectChannels")}
                    </h3>
                    {connectionError && (
                        <div className="mb-3 rounded-md bg-red-50 p-2 text-xs text-red-600 dark:bg-red-950 dark:text-red-400">
                            {connectionError}
                        </div>
                    )}
                    <div className="grid grid-cols-3 gap-2">
                        {channels.map(channel => (
                            <button
                                key={channel.id}
                                onClick={() => handleChannelConnect(channel.id)}
                                className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-colors min-h-11 min-w-11 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-blue-950/50 dark:hover:text-blue-400"
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
                <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4">
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                            {lt("organization")}
                        </p>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                            {organization.name}
                        </p>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 capitalize">
                            {t("plan." + organization.plan)}
                        </p>
                    </div>
                </div>

                {/* Logout Button */}
                <div className="border-t border-gray-200 dark:border-gray-800 px-3 py-4">
                    <Button
                        onClick={onLogout}
                        variant="ghost"
                        className="w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900 min-h-11 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                    >
                        <span className="mr-2">🚪</span>
                        {t("logout")}
                    </Button>
                </div>
            </aside>

            {/* Mobile Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-40 w-60 flex-col border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out md:hidden overflow-y-auto dark:border-gray-800 dark:bg-gray-900",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Close Button */}
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4">
                    <div className="flex items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
                            D
                        </div>
                        <span className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
                            {lt("dashboard")}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-md p-2 text-gray-600 hover:bg-gray-100 min-h-11 min-w-11 dark:text-gray-400 dark:hover:bg-gray-800"
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

                {/* Navigation Menu */}
                <nav className="flex-1 space-y-1 px-3 py-6">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={cn(
                                "w-full rounded-lg px-4 py-3 text-left text-base font-medium transition-colors min-h-11",
                                activeTab === item.id
                                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                                    : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
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
                <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4">
                    <div className="flex items-center justify-between gap-2">
                        <LanguageSelector variant="default" />
                        <ThemeToggleClient />
                    </div>
                </div>

                {/* Connect Channels Section */}
                <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                        {t("connectChannels")}
                    </h3>
                    {connectionError && (
                        <div className="mb-3 rounded-md bg-red-50 p-2 text-xs text-red-600 dark:bg-red-950 dark:text-red-400">
                            {connectionError}
                        </div>
                    )}
                    <div className="grid grid-cols-3 gap-2">
                        {channels.map(channel => (
                            <button
                                key={channel.id}
                                onClick={() => handleChannelConnect(channel.id)}
                                className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-colors min-h-11 min-w-11 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-blue-950/50 dark:hover:text-blue-400"
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
                <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4">
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                            {lt("organization")}
                        </p>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                            {organization.name}
                        </p>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 capitalize">
                            {t("plan." + organization.plan)}
                        </p>
                    </div>
                </div>

                {/* Logout Button */}
                <div className="border-t border-gray-200 dark:border-gray-800 px-3 py-4">
                    <Button
                        onClick={onLogout}
                        variant="ghost"
                        className="w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900 min-h-11 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                    >
                        <span className="mr-2">🚪</span>
                        {t("logout")}
                    </Button>
                </div>
            </aside>
        </>
    )
}
