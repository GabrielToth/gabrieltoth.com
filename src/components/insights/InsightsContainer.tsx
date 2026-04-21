"use client"

import { fetchChannels } from "@/lib/api"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { ChannelComparison } from "./ChannelComparison"
import { ChannelGraphs } from "./ChannelGraphs"
import { MetricsGrid } from "./MetricsGrid"
import { TimePeriodSelector } from "./TimePeriodSelector"

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
 * InsightsContainerProps
 */
export interface InsightsContainerProps {
    children?: React.ReactNode
}

/**
 * InsightsContainer Component
 * Main container for Insights tab
 * Manages state for metrics and analytics data
 * Coordinates child components
 *
 * Features:
 * - Manages metrics state
 * - Manages time period selection
 * - Manages graph data
 * - Provides filtering logic
 * - API integration for fetching analytics
 * - Loading and error states
 * - Data caching
 * - Responsive layout
 */
export const InsightsContainer: React.FC<InsightsContainerProps> = ({
    children,
}) => {
    // State management
    const [metrics, setMetrics] = useState<Metric[]>([])
    const [graphData, setGraphData] = useState<GraphData[]>([])
    const [availableChannels, setAvailableChannels] = useState<SocialChannel[]>(
        []
    )
    const [selectedChannels, setSelectedChannels] = useState<string[]>([])
    const [timePeriod, setTimePeriod] = useState<"7d" | "30d" | "90d">("7d")
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    /**
     * Fetch available channels from API
     */
    const handleFetchChannels = useCallback(async () => {
        try {
            const data = await fetchChannels()
            setAvailableChannels(data)
            // Set all channels as selected by default
            setSelectedChannels(data.map(ch => ch.id))
        } catch (err) {
            console.error("Failed to fetch channels:", err)
        }
    }, [])

    /**
     * Fetch analytics data from API
     * This is a placeholder - in real implementation, would call analytics API
     */
    const handleFetchAnalytics = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)

            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 500))

            // Generate mock data based on time period
            const mockMetrics: Metric[] = [
                {
                    id: "followers",
                    name: "Followers",
                    value: 12500,
                    change: 250,
                    changePercent: 2.04,
                    icon: "users",
                },
                {
                    id: "engagement",
                    name: "Engagement",
                    value: 3450,
                    change: 120,
                    changePercent: 3.6,
                    icon: "heart",
                },
                {
                    id: "reach",
                    name: "Reach",
                    value: 45000,
                    change: -500,
                    changePercent: -1.1,
                    icon: "trending-up",
                },
                {
                    id: "impressions",
                    name: "Impressions",
                    value: 125000,
                    change: 5000,
                    changePercent: 4.17,
                    icon: "eye",
                },
            ]

            setMetrics(mockMetrics)

            // Generate mock graph data
            const days =
                timePeriod === "7d" ? 7 : timePeriod === "30d" ? 30 : 90
            const mockGraphData: GraphData[] = []

            for (let i = 0; i < days; i++) {
                const date = new Date()
                date.setDate(date.getDate() - (days - i))

                availableChannels.forEach(channel => {
                    mockGraphData.push({
                        date: date.toISOString().split("T")[0],
                        followers: Math.floor(Math.random() * 1000) + 10000,
                        engagement: Math.floor(Math.random() * 500) + 2000,
                        reach: Math.floor(Math.random() * 5000) + 40000,
                        impressions: Math.floor(Math.random() * 10000) + 100000,
                        channel: channel.id,
                    })
                })
            }

            setGraphData(mockGraphData)
            setIsLoading(false)
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to fetch analytics"
            )
            setIsLoading(false)
        }
    }, [timePeriod, availableChannels])

    // Fetch data on mount
    useEffect(() => {
        handleFetchChannels()
    }, [handleFetchChannels])

    // Fetch analytics when time period or channels change
    useEffect(() => {
        if (availableChannels.length > 0) {
            handleFetchAnalytics()
        }
    }, [timePeriod, availableChannels, handleFetchAnalytics])

    // Handle time period change
    const handleTimePeriodChange = (period: "7d" | "30d" | "90d") => {
        setTimePeriod(period)
    }

    // Handle channel selection change
    const handleChannelSelectionChange = (channels: string[]) => {
        setSelectedChannels(channels)
    }

    // Filter graph data based on selected channels
    const filteredGraphData = useMemo(() => {
        if (selectedChannels.length === 0) {
            return graphData
        }

        return graphData.filter(data => selectedChannels.includes(data.channel))
    }, [graphData, selectedChannels])

    // Handle retry
    const handleRetry = () => {
        handleFetchAnalytics()
    }

    // If children are provided, render them
    if (children) {
        return <div className="space-y-6">{children}</div>
    }

    // Default render with all components
    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        Insights
                    </h1>
                    <p className="mt-1 text-xs sm:text-sm text-gray-600">
                        Track your social media performance and analytics
                    </p>
                </div>
            </div>

            {/* Time Period Selector */}
            {!isLoading && !error && (
                <TimePeriodSelector
                    selectedPeriod={timePeriod}
                    onPeriodChange={handleTimePeriodChange}
                />
            )}

            {/* Metrics Grid */}
            <MetricsGrid
                metrics={metrics}
                isLoading={isLoading}
                error={error}
                onRetry={handleRetry}
            />

            {/* Channel Graphs */}
            <ChannelGraphs
                channels={availableChannels}
                data={filteredGraphData}
                isLoading={isLoading}
                error={error}
                onRetry={handleRetry}
            />

            {/* Channel Comparison */}
            <ChannelComparison
                channels={availableChannels}
                selectedChannels={selectedChannels}
                metrics={metrics}
                onChannelSelectionChange={handleChannelSelectionChange}
                isLoading={isLoading}
                error={error}
                onRetry={handleRetry}
            />
        </div>
    )
}

export default InsightsContainer
