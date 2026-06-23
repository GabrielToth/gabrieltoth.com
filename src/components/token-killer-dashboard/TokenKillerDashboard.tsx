/**
 * Token Killer Web Dashboard
 * Main dashboard component for visualizing token consumption with uPlot charts
 * Implements Requirements 6.1-6.7: Interactive dashboard with time windows, anomaly highlighting, real-time updates
 */

"use client"

import React, { useState, useEffect, useCallback } from "react"
import { TimeWindowSelector } from "./TimeWindowSelector"
import { TokenStatsChart } from "./TokenStatsChart"
import { TokenBreakdownChart } from "./TokenBreakdownChart"
import { AnomalyHighlight } from "./AnomalyHighlight"
import { LoadingIndicator } from "./LoadingIndicator"
import { ErrorState } from "./ErrorState"
import { DashboardHeader } from "./DashboardHeader"
import type {
    TimeWindow,
    AggregatedTokenData,
    AnomalyDetectionResult,
} from "./types"

/**
 * Main dashboard component
 */
export const TokenKillerDashboard: React.FC = () => {
    const [timeWindow, setTimeWindow] = useState<TimeWindow>("7d")
    const [statsData, setStatsData] = useState<AggregatedTokenData | null>(null)
    const [anomalies, setAnomalies] = useState<AnomalyDetectionResult | null>(
        null
    )
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [autoRefresh, setAutoRefresh] = useState(true)

    /**
     * Fetch token statistics for the selected time window
     */
    const fetchStats = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch(
                `/api/token-killer/stats/${timeWindow}`
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(
                    errorData.message ||
                        `Failed to fetch stats: ${response.statusText}`
                )
            }

            const data: AggregatedTokenData = await response.json()
            setStatsData(data)
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            setError(message)
            console.error("Failed to fetch token stats:", err)
        } finally {
            setLoading(false)
        }
    }, [timeWindow])

    /**
     * Fetch anomaly detection results
     */
    const fetchAnomalies = useCallback(async () => {
        try {
            const response = await fetch(
                `/api/token-killer/anomalies/${timeWindow}`
            )

            if (!response.ok) {
                console.warn("Failed to fetch anomalies:", response.statusText)
                return
            }

            const data: AnomalyDetectionResult = await response.json()
            setAnomalies(data)
        } catch (err) {
            console.warn("Failed to fetch anomalies:", err)
        }
    }, [timeWindow])

    /**
     * Fetch all data when time window changes
     */
    useEffect(() => {
        fetchStats()
        fetchAnomalies()
    }, [timeWindow, fetchStats, fetchAnomalies])

    /**
     * Set up auto-refresh interval
     */
    useEffect(() => {
        if (!autoRefresh) return

        const interval = setInterval(() => {
            fetchStats()
            fetchAnomalies()
        }, 30000) // Refresh every 30 seconds

        return () => clearInterval(interval)
    }, [autoRefresh, fetchStats, fetchAnomalies])

    return (
        <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <DashboardHeader
                    autoRefresh={autoRefresh}
                    onAutoRefreshChange={setAutoRefresh}
                    onRefresh={() => {
                        fetchStats()
                        fetchAnomalies()
                    }}
                />

                {/* Time Window Selector */}
                <div className="mb-8">
                    <TimeWindowSelector
                        selectedWindow={timeWindow}
                        onWindowChange={setTimeWindow}
                    />
                </div>

                {/* Loading State */}
                {loading && <LoadingIndicator />}

                {/* Error State */}
                {error && !loading && (
                    <ErrorState
                        error={error}
                        onRetry={() => {
                            fetchStats()
                            fetchAnomalies()
                        }}
                    />
                )}

                {/* Dashboard Content */}
                {!loading && !error && statsData && (
                    <div className="space-y-8">
                        {/* Anomalies Section */}
                        {anomalies && anomalies.anomalies.length > 0 && (
                            <AnomalyHighlight anomalies={anomalies} />
                        )}

                        {/* Main Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Token Stats Chart */}
                            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                    Token Consumption Over Time
                                </h2>
                                <TokenStatsChart
                                    data={statsData}
                                    timeWindow={timeWindow}
                                />
                            </div>

                            {/* Token Breakdown Chart */}
                            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                    Tokens by Agent Type
                                </h2>
                                <TokenBreakdownChart
                                    data={statsData}
                                    breakdownType="agent-type"
                                    timeWindow={timeWindow}
                                />
                            </div>
                        </div>

                        {/* Stats Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <StatCard
                                label="Total Tokens"
                                value={statsData.totalTokens.toLocaleString()}
                                subtext={`${statsData.inputTokens.toLocaleString()} input, ${statsData.outputTokens.toLocaleString()} output`}
                            />
                            <StatCard
                                label="Total Cost"
                                value={`$${statsData.costUSD.toFixed(2)}`}
                                subtext={`R$ ${statsData.costBRL.toFixed(2)}`}
                            />
                            <StatCard
                                label="Requests"
                                value={statsData.requestCount.toLocaleString()}
                                subtext={`${statsData.taskCount} tasks`}
                            />
                            <StatCard
                                label="Avg Cost/Request"
                                value={`$${(statsData.costUSD / Math.max(statsData.requestCount, 1)).toFixed(4)}`}
                                subtext={`${(statsData.totalTokens / Math.max(statsData.requestCount, 1)).toFixed(0)} tokens/req`}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

/**
 * Stat card component for displaying key metrics
 */
interface StatCardProps {
    label: string
    value: string
    subtext: string
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subtext }) => (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {label}
        </p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {value}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
            {subtext}
        </p>
    </div>
)

export default TokenKillerDashboard
