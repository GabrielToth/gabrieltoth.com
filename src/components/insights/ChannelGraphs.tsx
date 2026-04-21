"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
 * GraphData type definition
 */
export interface GraphData {
    date: string
    followers?: number
    engagement?: number
    reach?: number
    impressions?: number
    channel: string
}

/**
 * ChannelGraphsProps
 */
export interface ChannelGraphsProps {
    channels: SocialChannel[]
    data: GraphData[]
    isLoading?: boolean
    error?: string | null
    onRetry?: () => void
}

/**
 * ChannelGraphs Component
 * Display performance graphs per channel
 *
 * Features:
 * - Display line or bar charts for performance trends
 * - Separate graphs for each social channel
 * - Show data points for: Followers, Engagement, Reach, Impressions
 * - Clear axes labels and legend
 * - Responsive design
 *
 * Note: This component uses a simple table-based visualization.
 * For advanced charting with Recharts, install: npm install recharts
 */
export const ChannelGraphs: React.FC<ChannelGraphsProps> = ({
    channels,
    data,
    isLoading = false,
    error = null,
    onRetry,
}) => {
    // Group data by channel
    const dataByChannel = useMemo(() => {
        const grouped: Record<string, GraphData[]> = {}

        data.forEach(item => {
            if (!grouped[item.channel]) {
                grouped[item.channel] = []
            }
            grouped[item.channel].push(item)
        })

        return grouped
    }, [data])

    // Loading skeleton
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2].map(i => (
                    <div
                        key={i}
                        className="h-64 animate-pulse rounded-lg bg-gray-200"
                    />
                ))}
            </div>
        )
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
                        Retry
                    </Button>
                )}
            </div>
        )
    }

    // Empty state
    if (channels.length === 0 || data.length === 0) {
        return (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
                <p className="text-sm text-gray-600">
                    No graph data available. Connect social channels to see
                    performance trends.
                </p>
            </div>
        )
    }

    // Render graphs for each channel
    return (
        <div className="space-y-6">
            {channels.map(channel => {
                const channelData = dataByChannel[channel.id] || []

                if (channelData.length === 0) {
                    return null
                }

                // Calculate statistics
                const followers = channelData.map(d => d.followers || 0)
                const engagement = channelData.map(d => d.engagement || 0)
                const reach = channelData.map(d => d.reach || 0)
                const impressions = channelData.map(d => d.impressions || 0)

                const avgFollowers =
                    followers.reduce((a, b) => a + b, 0) / followers.length
                const avgEngagement =
                    engagement.reduce((a, b) => a + b, 0) / engagement.length
                const avgReach = reach.reduce((a, b) => a + b, 0) / reach.length
                const avgImpressions =
                    impressions.reduce((a, b) => a + b, 0) / impressions.length

                return (
                    <Card key={channel.id}>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                {channel.accountName} ({channel.platform})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Stats Summary */}
                                <div className="grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-4">
                                    <div className="rounded-lg bg-blue-50 p-2 sm:p-3">
                                        <p className="text-xs text-gray-600">
                                            Avg Followers
                                        </p>
                                        <p className="text-base sm:text-lg font-semibold text-gray-900">
                                            {Math.round(
                                                avgFollowers
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-green-50 p-2 sm:p-3">
                                        <p className="text-xs text-gray-600">
                                            Avg Engagement
                                        </p>
                                        <p className="text-base sm:text-lg font-semibold text-gray-900">
                                            {Math.round(
                                                avgEngagement
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-purple-50 p-2 sm:p-3">
                                        <p className="text-xs text-gray-600">
                                            Avg Reach
                                        </p>
                                        <p className="text-base sm:text-lg font-semibold text-gray-900">
                                            {Math.round(
                                                avgReach
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-orange-50 p-2 sm:p-3">
                                        <p className="text-xs text-gray-600">
                                            Avg Impressions
                                        </p>
                                        <p className="text-base sm:text-lg font-semibold text-gray-900">
                                            {Math.round(
                                                avgImpressions
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                {/* Data Table */}
                                <div className="overflow-x-auto -mx-4 sm:mx-0">
                                    <table className="w-full text-xs sm:text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="px-3 sm:px-4 py-2 text-left font-medium text-gray-700">
                                                    Date
                                                </th>
                                                <th className="px-3 sm:px-4 py-2 text-right font-medium text-gray-700">
                                                    Followers
                                                </th>
                                                <th className="px-3 sm:px-4 py-2 text-right font-medium text-gray-700">
                                                    Engagement
                                                </th>
                                                <th className="px-3 sm:px-4 py-2 text-right font-medium text-gray-700">
                                                    Reach
                                                </th>
                                                <th className="px-3 sm:px-4 py-2 text-right font-medium text-gray-700">
                                                    Impressions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {channelData
                                                .slice(-7)
                                                .reverse()
                                                .map((row, idx) => (
                                                    <tr
                                                        key={idx}
                                                        className="border-b border-gray-100 hover:bg-gray-50"
                                                    >
                                                        <td className="px-3 sm:px-4 py-2 text-gray-900">
                                                            {row.date}
                                                        </td>
                                                        <td className="px-3 sm:px-4 py-2 text-right text-gray-900">
                                                            {(
                                                                row.followers ||
                                                                0
                                                            ).toLocaleString()}
                                                        </td>
                                                        <td className="px-3 sm:px-4 py-2 text-right text-gray-900">
                                                            {(
                                                                row.engagement ||
                                                                0
                                                            ).toLocaleString()}
                                                        </td>
                                                        <td className="px-3 sm:px-4 py-2 text-right text-gray-900">
                                                            {(
                                                                row.reach || 0
                                                            ).toLocaleString()}
                                                        </td>
                                                        <td className="px-3 sm:px-4 py-2 text-right text-gray-900">
                                                            {(
                                                                row.impressions ||
                                                                0
                                                            ).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}

export default ChannelGraphs
