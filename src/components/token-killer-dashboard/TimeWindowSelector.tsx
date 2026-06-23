/**
 * Time Window Selector Component
 * Allows users to select different time windows for data visualization
 * Implements Requirement 6.1: Time window selector (24h, 7d, 30d, 90d, all-time)
 */

"use client"

import React from "react"
import type { TimeWindow } from "./types"

interface TimeWindowSelectorProps {
    selectedWindow: TimeWindow
    onWindowChange: (window: TimeWindow) => void
}

const TIME_WINDOWS: Array<{
    value: TimeWindow
    label: string
    description: string
}> = [
    { value: "24h", label: "24 Hours", description: "Last 24 hours" },
    { value: "7d", label: "7 Days", description: "Last 7 days (default)" },
    { value: "30d", label: "30 Days", description: "Last 30 days" },
    { value: "90d", label: "90 Days", description: "Last 90 days" },
    { value: "all-time", label: "All Time", description: "All available data" },
]

/**
 * Time window selector component
 */
export const TimeWindowSelector: React.FC<TimeWindowSelectorProps> = ({
    selectedWindow,
    onWindowChange,
}) => {
    return (
        <div className="flex flex-wrap gap-2">
            {TIME_WINDOWS.map(window => (
                <button
                    key={window.value}
                    onClick={() => onWindowChange(window.value)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        selectedWindow === window.value
                            ? "bg-blue-600 text-white shadow-lg"
                            : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-400"
                    }`}
                    title={window.description}
                >
                    {window.label}
                </button>
            ))}
        </div>
    )
}

export default TimeWindowSelector
