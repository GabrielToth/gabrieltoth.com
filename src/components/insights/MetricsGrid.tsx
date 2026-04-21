"use client"

import { Button } from "@/components/ui/button"
import React from "react"
import { MetricCard } from "./MetricCard"

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
 * MetricsGridProps
 */
export interface MetricsGridProps {
    metrics: Metric[]
    isLoading?: boolean
    error?: string | null
    onRetry?: () => void
}

/**
 * MetricsGrid Component
 * Container for metric cards
 *
 * Features:
 * - Display metric cards in a responsive grid
 * - Show loading skeleton
 * - Show error message with retry button
 * - Responsive design (1 column on mobile, 2 on tablet, 4 on desktop)
 */
export const MetricsGrid: React.FC<MetricsGridProps> = ({
    metrics,
    isLoading = false,
    error = null,
    onRetry,
}) => {
    // Loading skeleton
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                    <div
                        key={i}
                        className="h-32 animate-pulse rounded-lg bg-gray-200"
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
    if (metrics.length === 0) {
        return (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
                <p className="text-sm text-gray-600">
                    No metrics available. Connect social channels to see data.
                </p>
            </div>
        )
    }

    // Render metrics grid
    return (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map(metric => (
                <MetricCard key={metric.id} metric={metric} />
            ))}
        </div>
    )
}

export default MetricsGrid
