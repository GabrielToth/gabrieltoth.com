"use client"

import { fetchChannels } from "@/lib/api"
import { useTranslations } from "next-intl"
import React, { useCallback, useEffect, useState } from "react"
import { ChannelComparison } from "./ChannelComparison"
import { ChannelGraphs } from "./ChannelGraphs"
import { MetricsGrid } from "./MetricsGrid"
import { TimePeriodSelector } from "./TimePeriodSelector"
import { AdvancedMetricDetail } from "@/lib/analytics/normalized-analytics-service"
import { Filter, Layers, LayoutGrid, SlidersHorizontal } from "lucide-react"

export interface SocialChannel {
    id: string
    platform: "facebook" | "instagram" | "twitter" | "tiktok" | "linkedin"
    accountId: string
    accountName: string
    isConnected: boolean
    connectedAt?: Date
}

export interface ChannelGroup {
    id: string
    name: string
    members?: Array<{ channel_id: string }>
}

export interface Metric {
    id: string
    name: string
    value: number
    change: number
    changePercent: number
    icon: string
    channel?: string
}

export interface GraphData {
    date: string
    followers?: number
    engagement?: number
    reach?: number
    impressions?: number
    channel: string
}

export interface InsightsContainerProps {
    children?: React.ReactNode
}

export const InsightsContainer: React.FC<InsightsContainerProps> = ({
    children,
}) => {
    const [metrics, setMetrics] = useState<Metric[]>([])
    const [advancedMetrics, setAdvancedMetrics] = useState<
        AdvancedMetricDetail[]
    >([])
    const [graphData, setGraphData] = useState<GraphData[]>([])
    const [availableChannels, setAvailableChannels] = useState<SocialChannel[]>(
        []
    )
    const [channelGroups, setChannelGroups] = useState<ChannelGroup[]>([])
    const [selectedPlatform, setSelectedPlatform] = useState<string>("all")
    const [selectedGroup, setSelectedGroup] = useState<string>("all")
    const [viewMode, setViewMode] = useState<"simple" | "advanced">("simple")
    const [timePeriod, setTimePeriod] = useState<"7d" | "30d" | "90d">("7d")
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const t = useTranslations("dashboard.insights")

    const metricLabel = (id: string, fallback: string) => {
        const key = (
            {
                followers: "followers",
                engagement: "engagement",
                reach: "reach",
                impressions: "impressions",
                viral_coefficient: "viralCoefficient",
                avg_watch_time: "avgWatchTime",
                click_through_rate: "clickThroughRate",
            } as Record<string, string>
        )[id]
        return key ? t(`metrics.${key}`) : fallback
    }

    const handleFetchChannelsAndGroups = useCallback(async () => {
        try {
            const data = await fetchChannels()
            setAvailableChannels(data)

            const groupRes = await fetch("/api/channel-groups")
            if (groupRes.ok) {
                const gJson = await groupRes.json()
                if (gJson.success && gJson.data) {
                    setChannelGroups(gJson.data)
                }
            }
        } catch (err) {
            console.error("Failed to fetch channels/groups:", err)
        }
    }, [])

    const handleFetchAnalytics = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)

            let url = `/api/platform/analytics?period=${timePeriod}`
            if (selectedPlatform !== "all") {
                url += `&platform=${selectedPlatform}`
            }
            if (selectedGroup !== "all") {
                url += `&groupId=${selectedGroup}`
            }

            const res = await fetch(url)
            if (!res.ok) {
                throw new Error(`Analytics API returned HTTP ${res.status}`)
            }

            const json = await res.json()
            if (json.success && json.data) {
                setMetrics(json.data.simpleMetrics || [])
                setAdvancedMetrics(json.data.advancedMetrics || [])
                setGraphData(json.data.graphData || [])
            } else {
                setMetrics([])
                setAdvancedMetrics([])
                setGraphData([])
            }
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to fetch analytics"
            )
        } finally {
            setIsLoading(false)
        }
    }, [timePeriod, selectedPlatform, selectedGroup])

    const handleTimePeriodChange = (period: "7d" | "30d" | "90d") => {
        setTimePeriod(period)
    }

    const handleRetry = () => {
        handleFetchAnalytics()
    }

    useEffect(() => {
        handleFetchChannelsAndGroups()
    }, [handleFetchChannelsAndGroups])

    useEffect(() => {
        handleFetchAnalytics()
    }, [handleFetchAnalytics])

    if (children) {
        return <div className="space-y-6">{children}</div>
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header Controls */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                        {t("containerTitle")}
                    </h1>
                    <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                        {t("subtitle")}
                    </p>
                </div>

                {/* View Mode & Filter Controls */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* View Mode Toggle: Simple vs Advanced */}
                    <div className="inline-flex rounded-lg border border-border p-1 bg-card">
                        <button
                            type="button"
                            onClick={() => setViewMode("simple")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                viewMode === "simple"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                            {t("simpleView")}
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("advanced")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                viewMode === "advanced"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            {t("advancedView")}
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Bar: Platform & Channel Groups */}
            <div className="flex flex-wrap items-center gap-3 bg-muted/40 p-3 rounded-lg border border-border/80">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <Filter className="w-3.5 h-3.5 text-primary" />
                    {t("filters")}
                </div>

                {/* Platform Filter */}
                <select
                    value={selectedPlatform}
                    onChange={e => setSelectedPlatform(e.target.value)}
                    className="h-8 px-2.5 py-1 text-xs rounded-md border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                    <option value="all">{t("allPlatforms")}</option>
                    <option value="twitch">{t("platforms.twitch")}</option>
                    <option value="youtube">{t("platforms.youtube")}</option>
                    <option value="kick">{t("platforms.kick")}</option>
                    <option value="instagram">
                        {t("platforms.instagram")}
                    </option>
                    <option value="facebook">{t("platforms.facebook")}</option>
                    <option value="tiktok">{t("platforms.tiktok")}</option>
                    <option value="linkedin">{t("platforms.linkedin")}</option>
                </select>

                {/* Channel Group Filter */}
                <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                    <select
                        value={selectedGroup}
                        onChange={e => setSelectedGroup(e.target.value)}
                        className="h-8 px-2.5 py-1 text-xs rounded-md border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                        <option value="all">{t("allGroups")}</option>
                        {channelGroups.map(g => (
                            <option key={g.id} value={g.id}>
                                {g.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Time Period Selector */}
            {!isLoading && !error && (
                <TimePeriodSelector
                    selectedPeriod={timePeriod}
                    onPeriodChange={handleTimePeriodChange}
                />
            )}

            {/* Simple View Rendering */}
            {viewMode === "simple" && (
                <>
                    <MetricsGrid
                        metrics={metrics}
                        isLoading={isLoading}
                        error={error}
                        onRetry={handleRetry}
                    />

                    <ChannelGraphs
                        channels={availableChannels}
                        data={graphData}
                        isLoading={isLoading}
                        error={error}
                        onRetry={handleRetry}
                    />

                    <ChannelComparison
                        channels={availableChannels}
                        selectedChannels={availableChannels.map(c => c.id)}
                        metrics={metrics}
                        onChannelSelectionChange={() => {}}
                        isLoading={isLoading}
                    />
                </>
            )}

            {/* Advanced View Rendering */}
            {viewMode === "advanced" && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {advancedMetrics.map(adv => (
                            <div
                                key={adv.id}
                                className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                                        {t(`categories.${adv.category}`)}
                                    </span>
                                    <span
                                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                            adv.change >= 0
                                                ? "bg-emerald-500/10 text-emerald-500"
                                                : "bg-red-500/10 text-red-500"
                                        }`}
                                    >
                                        {adv.change >= 0 ? "+" : ""}
                                        {adv.changePercent}%
                                    </span>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">
                                        {metricLabel(adv.id, adv.name)}
                                    </h4>
                                    <div className="text-2xl font-bold text-foreground mt-1">
                                        {adv.value}
                                    </div>
                                </div>

                                <div className="border-t border-border/40 pt-2 space-y-1.5 text-xs text-muted-foreground">
                                    <div className="font-medium text-[11px] uppercase tracking-wide">
                                        {t("platformBreakdown")}
                                    </div>
                                    {Object.entries(adv.platformBreakdown).map(
                                        ([plat, val]) => (
                                            <div
                                                key={plat}
                                                className="flex items-center justify-between capitalize"
                                            >
                                                <span>{plat}</span>
                                                <span className="font-semibold text-foreground">
                                                    {val}
                                                </span>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <ChannelGraphs
                        channels={availableChannels}
                        data={graphData}
                        isLoading={isLoading}
                        error={error}
                        onRetry={handleRetry}
                    />
                </div>
            )}
        </div>
    )
}
