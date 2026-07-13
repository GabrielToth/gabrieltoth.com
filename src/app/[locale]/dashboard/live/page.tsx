/**
 * Live Dashboard Page
 * Real-time stream management for Twitch and Kick
 * Shows viewer count, uptime, title, game, and unified chat
 */

"use client"

import { UnifiedChat } from "@/components/dashboard/live/unified-chat"
import { StreamStatusCard } from "@/components/dashboard/live/stream-status-card"
import { StreamTitleEditor } from "@/components/dashboard/live/stream-title-editor"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useState } from "react"

interface LivePlatform {
    platform: string
    username: string
    displayName: string
    profileImageUrl: string | null
    isLive: boolean
    viewerCount: number
    title: string
    gameName: string
    startedAt: string | null
}

export default function LiveDashboardPage() {
    const t = useTranslations("dashboard.live")
    const locale = useLocale()
    const [platforms, setPlatforms] = useState<LivePlatform[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activePlatform, setActivePlatform] = useState<string>("twitch")
    const [refreshInterval, setRefreshInterval] = useState<ReturnType<
        typeof setInterval
    > | null>(null)

    useEffect(() => {
        fetchStatus()

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchStatus, 30000)
        setRefreshInterval(interval)

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [])

    async function fetchStatus() {
        try {
            const response = await fetch("/api/live/status")
            if (!response.ok) throw new Error("Failed to fetch status")
            const data = await response.json()
            if (data.success) {
                setPlatforms(data.data)
                if (data.data.length > 0 && !activePlatform) {
                    setActivePlatform(data.data[0].platform)
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error")
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"></div>
                    <p className="text-gray-600">{t("loading")}</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="rounded-lg bg-red-50 p-6 text-center dark:bg-red-950/30">
                <p className="text-red-600 dark:text-red-400">
                    {t("error")}: {error}
                </p>
                <button
                    onClick={fetchStatus}
                    className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                    {t("retry")}
                </button>
            </div>
        )
    }

    if (platforms.length === 0) {
        return (
            <div className="rounded-lg bg-gray-50 p-6 text-center dark:bg-gray-900">
                <p className="text-gray-600 dark:text-gray-400">
                    {t("noPlatforms")}
                </p>
                <a
                    href={`/${locale}/dashboard/channels`}
                    className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                    {t("connectPlatforms")}
                </a>
            </div>
        )
    }

    const currentPlatform =
        platforms.find(p => p.platform === activePlatform) || platforms[0]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t("title")}
                </h1>
                <div className="flex gap-2">
                    {platforms.map(p => (
                        <button
                            key={p.platform}
                            onClick={() => setActivePlatform(p.platform)}
                            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                                activePlatform === p.platform
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                        >
                            {p.platform === "twitch" ? "Twitch" : "Kick"}
                            {p.isLive && (
                                <span className="ml-2 inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stream Status Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {platforms.map(p => (
                    <StreamStatusCard
                        key={p.platform}
                        platform={p.platform}
                        username={p.username}
                        displayName={p.displayName}
                        isLive={p.isLive}
                        viewerCount={p.viewerCount}
                        title={p.title}
                        gameName={p.gameName}
                        startedAt={p.startedAt}
                    />
                ))}
            </div>

            {/* Stream Management */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                        {t("streamSettings")}
                    </h2>
                    <StreamTitleEditor
                        platform={currentPlatform.platform}
                        currentTitle={currentPlatform.title}
                        currentGame={currentPlatform.gameName}
                        onUpdate={() => fetchStatus()}
                    />
                </div>

                {/* Unified Chat */}
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                        {t("unifiedChat")}
                    </h2>
                    <UnifiedChat
                        platforms={platforms.map(p => p.platform)}
                        activePlatform={activePlatform}
                    />
                </div>
            </div>
        </div>
    )
}
