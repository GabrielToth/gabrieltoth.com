"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useTranslations } from "next-intl"
import React, { useMemo } from "react"

/**
 * SocialChannel type definition
 */
export interface SocialChannel {
    id: string
    platform: "facebook" | "instagram" | "twitter" | "tiktok" | "linkedin"
    accountId: string
    accountName: string
    isConnected: boolean
    connectedAt?: Date
}

/**
 * Metric type definition
 */
export interface Metric {
    id: string
    name: string
    value: number
    change: number
    changePercent: number
    icon: string
    channel?: string
}

/**
 * ChannelComparisonProps
 */
export interface ChannelComparisonProps {
    channels: SocialChannel[]
    selectedChannels: string[]
    metrics: Metric[]
    onChannelSelectionChange: (channels: string[]) => void
    isLoading?: boolean
    error?: string | null
    onRetry?: () => void
}

/**
 * ChannelComparison Component
 * Compare metrics across different social channels
 *
 * Features:
 * - Compare metrics across different social channels
 * - Side-by-side comparison view
 * - Allow users to select which channels to compare
 * - Display summary showing highest value for each metric
 * - Responsive design
 */
export const ChannelComparison: React.FC<ChannelComparisonProps> = ({
    channels,
    selectedChannels,
    metrics,
    onChannelSelectionChange,
    isLoading = false,
    error = null,
    onRetry,
}) => {
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

    // Find highest value for each metric
    const highestValues = useMemo(() => {
        const highest: Record<string, number> = {}

        metrics.forEach(metric => {
            if (!highest[metric.id] || metric.value > highest[metric.id]) {
                highest[metric.id] = metric.value
            }
        })

        return highest
    }, [metrics])

    // Handle channel selection toggle
    const handleChannelToggle = (channelId: string) => {
        const newSelected = selectedChannels.includes(channelId)
            ? selectedChannels.filter(id => id !== channelId)
            : [...selectedChannels, channelId]

        onChannelSelectionChange(newSelected)
    }

    // Loading skeleton
    if (isLoading) {
        return <div className="h-64 animate-pulse rounded-lg bg-accent" />
    }

    // Error state
    if (error) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
                {onRetry && (
                    <Button
                        onClick={onRetry}
                        variant="outline"
                        size="sm"
                        className="mt-2"
                    >
                        {t("retry")}
                    </Button>
                )}
            </div>
        )
    }

    // Empty state
    if (channels.length === 0) {
        return (
            <div className="rounded-lg border border-border bg-muted p-8 text-center">
                <p className="text-sm text-muted-foreground">
                    {t("noChannelsCompare")}
                </p>
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("channelComparison")}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Channel Selection */}
                    <div>
                        <h3 className="mb-3 text-xs sm:text-sm font-medium text-foreground">
                            {t("selectChannels")}
                        </h3>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {channels.map(channel => (
                                <label
                                    key={channel.id}
                                    className="flex items-center gap-2 rounded-lg border border-border p-2 sm:p-3 hover:bg-muted cursor-pointer min-h-11"
                                >
                                    <Checkbox
                                        checked={selectedChannels.includes(
                                            channel.id
                                        )}
                                        onCheckedChange={() =>
                                            handleChannelToggle(channel.id)
                                        }
                                    />
                                    <span className="text-xs sm:text-sm font-medium text-foreground">
                                        {channel.accountName}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        ({channel.platform})
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Comparison Table */}
                    {selectedChannels.length > 0 && metrics.length > 0 && (
                        <div>
                            <h3 className="mb-3 text-xs sm:text-sm font-medium text-foreground">
                                {t("metricsComparison")}
                            </h3>
                            <div className="overflow-x-auto -mx-4 sm:mx-0">
                                <table className="w-full text-xs sm:text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="px-3 sm:px-4 py-2 text-left font-medium text-foreground">
                                                {t("metric")}
                                            </th>
                                            {channels
                                                .filter(ch =>
                                                    selectedChannels.includes(
                                                        ch.id
                                                    )
                                                )
                                                .map(channel => (
                                                    <th
                                                        key={channel.id}
                                                        className="px-3 sm:px-4 py-2 text-right font-medium text-foreground"
                                                    >
                                                        {channel.accountName}
                                                    </th>
                                                ))}
                                            <th className="px-3 sm:px-4 py-2 text-right font-medium text-foreground">
                                                {t("highest")}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {metrics.map(metric => {
                                            const isHighest =
                                                metric.value ===
                                                highestValues[metric.id]

                                            return (
                                                <tr
                                                    key={metric.id}
                                                    className="border-b border-gray-100 hover:bg-muted"
                                                >
                                                    <td className="px-3 sm:px-4 py-2 font-medium text-foreground">
                                                        {metricLabel(
                                                            metric.id,
                                                            metric.name
                                                        )}
                                                    </td>
                                                    {channels
                                                        .filter(ch =>
                                                            selectedChannels.includes(
                                                                ch.id
                                                            )
                                                        )
                                                        .map(channel => (
                                                            <td
                                                                key={channel.id}
                                                                className={`px-3 sm:px-4 py-2 text-right ${
                                                                    isHighest
                                                                        ? "bg-green-50 font-semibold text-green-700"
                                                                        : "text-foreground"
                                                                }`}
                                                            >
                                                                {metric.value.toLocaleString()}
                                                            </td>
                                                        ))}
                                                    <td className="px-3 sm:px-4 py-2 text-right font-semibold text-foreground">
                                                        {highestValues[
                                                            metric.id
                                                        ].toLocaleString()}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Empty comparison state */}
                    {selectedChannels.length === 0 && (
                        <div className="rounded-lg border border-border bg-muted p-4 text-center">
                            <p className="text-sm text-muted-foreground">
                                Select channels above to see comparison data
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export default ChannelComparison
