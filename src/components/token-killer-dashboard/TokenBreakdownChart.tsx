/**
 * Token Breakdown Chart Component
 * Displays token distribution by agent type, request type, or model
 * Implements Requirement 6.2-6.3: Token breakdown visualization
 */

"use client"

import React, { useEffect, useRef, useState } from "react"
import uPlot from "uplot"
import "uplot/dist/uPlot.min.css"
import type {
    AggregatedTokenData,
    TimeWindow,
    TokenBreakdownResponse,
} from "./types"

interface TokenBreakdownChartProps {
    data: AggregatedTokenData
    breakdownType: "agent-type" | "request-type" | "model" | "strategy"
    timeWindow: TimeWindow
}

/**
 * Token breakdown chart component
 */
export const TokenBreakdownChart: React.FC<TokenBreakdownChartProps> = ({
    data,
    breakdownType,
    timeWindow,
}) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<uPlot | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const fetchAndRenderChart = async () => {
            try {
                setIsLoading(true)
                setError(null)

                // Fetch breakdown data from API
                const response = await fetch(
                    `/api/token-killer/breakdown/${timeWindow}/${breakdownType}`
                )

                if (!response.ok) {
                    throw new Error(
                        `Failed to fetch breakdown data: ${response.statusText}`
                    )
                }

                const breakdownData: TokenBreakdownResponse =
                    await response.json()

                // Prepare data for chart
                const categories = breakdownData.breakdown.map(
                    item => item.category
                )
                const tokens = breakdownData.breakdown.map(
                    item => item.totalTokens
                )

                // Create uPlot instance for bar chart
                const opts: uPlot.Options = {
                    title: `Tokens by ${formatBreakdownType(breakdownType)}`,
                    id: `token-breakdown-${breakdownType}`,
                    class: "token-breakdown-chart",
                    width: container.offsetWidth,
                    height: 300,
                    series: [
                        {
                            label: "Category",
                        },
                        {
                            label: "Tokens",
                            stroke: "#3b82f6",
                            fill: "rgba(59, 130, 246, 0.3)",
                            width: 2,
                            value: (self, rawValue) =>
                                rawValue.toLocaleString(),
                        },
                    ],
                    axes: [
                        {
                            label: formatBreakdownType(breakdownType),
                            labelSize: 30,
                            values: (self, splits) => {
                                return splits.map(i => {
                                    const idx = Math.floor(i)
                                    return categories[idx] || ""
                                })
                            },
                        },
                        {
                            label: "Tokens",
                            labelSize: 50,
                            values: (self, splits) => {
                                return splits.map(i => formatTokenValue(i))
                            },
                        },
                    ],
                    scales: {
                        x: {
                            time: false,
                        },
                        y: {
                            auto: true,
                        },
                    },
                    cursor: {
                        lock: false,
                    },
                    legend: {
                        show: true,
                        live: true,
                    },
                }

                // Prepare data for uPlot
                const chartData: [number[], number[]] = [
                    Array.from({ length: categories.length }, (_, i) => i),
                    tokens,
                ]

                // Destroy existing chart if it exists
                if (chartRef.current) {
                    chartRef.current.destroy()
                }

                // Create new chart
                chartRef.current = new uPlot(opts, chartData, container)

                setIsLoading(false)
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err)
                setError(message)
                console.error("Failed to create breakdown chart:", err)
                setIsLoading(false)
            }
        }

        fetchAndRenderChart()

        // Handle window resize
        const handleResize = () => {
            if (chartRef.current && container) {
                chartRef.current.setSize({
                    width: container.offsetWidth,
                    height: 300,
                })
            }
        }

        window.addEventListener("resize", handleResize)

        return () => {
            window.removeEventListener("resize", handleResize)
            if (chartRef.current) {
                chartRef.current.destroy()
                chartRef.current = null
            }
        }
    }, [breakdownType, timeWindow])

    if (error) {
        return (
            <div className="flex items-center justify-center h-80 bg-red-50 dark:bg-red-900/20 rounded">
                <div className="text-red-600 dark:text-red-400 text-center">
                    <p className="font-semibold">Failed to load chart</p>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full">
            {isLoading && (
                <div className="flex items-center justify-center h-80 bg-slate-50 dark:bg-slate-700 rounded">
                    <div className="text-slate-500 dark:text-slate-400">
                        Loading chart...
                    </div>
                </div>
            )}
            <div
                ref={containerRef}
                className="w-full bg-white dark:bg-slate-800 rounded"
                style={{ display: isLoading ? "none" : "block" }}
            />
        </div>
    )
}

/**
 * Format breakdown type for display
 */
function formatBreakdownType(type: string): string {
    const typeMap: Record<string, string> = {
        "agent-type": "Agent Type",
        "request-type": "Request Type",
        model: "Model",
        strategy: "Optimization Strategy",
    }
    return typeMap[type] || type
}

/**
 * Format token value for display
 */
function formatTokenValue(value: number): string {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`
    }
    return value.toFixed(0)
}

export default TokenBreakdownChart
