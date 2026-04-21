"use client"

import { Button } from "@/components/ui/button"
import React from "react"

/**
 * TimePeriodSelectorProps
 */
export interface TimePeriodSelectorProps {
    selectedPeriod: "7d" | "30d" | "90d"
    onPeriodChange: (period: "7d" | "30d" | "90d") => void
}

/**
 * TimePeriodSelector Component
 * Select time period for analytics
 *
 * Features:
 * - Select time period (Last 7 days, Last 30 days, Last 90 days)
 * - Update metrics and graphs when period changes
 * - Display selected period
 * - Responsive design
 */
export const TimePeriodSelector: React.FC<TimePeriodSelectorProps> = ({
    selectedPeriod,
    onPeriodChange,
}) => {
    const periods: Array<{
        value: "7d" | "30d" | "90d"
        label: string
    }> = [
        { value: "7d", label: "Last 7 days" },
        { value: "30d", label: "Last 30 days" },
        { value: "90d", label: "Last 90 days" },
    ]

    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <span className="text-xs sm:text-sm font-medium text-gray-700">
                Time Period:
            </span>
            <div className="flex flex-wrap gap-2">
                {periods.map(period => (
                    <Button
                        key={period.value}
                        variant={
                            selectedPeriod === period.value
                                ? "default"
                                : "outline"
                        }
                        size="sm"
                        onClick={() => onPeriodChange(period.value)}
                        className={`text-xs sm:text-sm min-h-10 ${
                            selectedPeriod === period.value
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                        {period.label}
                    </Button>
                ))}
            </div>
        </div>
    )
}

export default TimePeriodSelector
