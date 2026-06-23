/**
 * Anomaly Highlight Component
 * Displays detected anomalies in token consumption with context
 * Implements Requirement 6.4-6.5: Anomaly highlighting and context display
 */

"use client"

import React from "react"
import type { AnomalyDetectionResult } from "./types"

interface AnomalyHighlightProps {
    anomalies: AnomalyDetectionResult
}

/**
 * Anomaly highlight component
 */
export const AnomalyHighlight: React.FC<AnomalyHighlightProps> = ({
    anomalies,
}) => {
    if (!anomalies.anomalies || anomalies.anomalies.length === 0) {
        return null
    }

    return (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
            <div className="flex items-start gap-4">
                {/* Alert Icon */}
                <div className="flex-shrink-0">
                    <svg
                        className="h-6 w-6 text-amber-600 dark:text-amber-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4v2m0 0v2m0-6v-2m0 0V7a2 2 0 012-2h2.586a1 1 0 00.707-.293l-2.414-2.414a1 1 0 00-1.414 1.414L10.586 7H8a2 2 0 00-2 2v2m0 0v2m0-6v-2m0 0V7a2 2 0 012-2h2.586a1 1 0 00.707-.293l-2.414-2.414a1 1 0 00-1.414 1.414L10.586 7H8a2 2 0 00-2 2v2"
                        />
                    </svg>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                        Anomalies Detected
                    </h3>
                    <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                        {anomalies.anomalies.length} unusual token consumption
                        pattern
                        {anomalies.anomalies.length !== 1 ? "s" : ""} detected
                    </p>

                    {/* Statistics */}
                    <div className="mt-4 grid grid-cols-3 gap-4">
                        <div>
                            <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                                Mean
                            </p>
                            <p className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                                {anomalies.mean.toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                                Std Dev
                            </p>
                            <p className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                                {anomalies.stdDev.toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                                Threshold
                            </p>
                            <p className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                                {anomalies.threshold.toFixed(1)}σ
                            </p>
                        </div>
                    </div>

                    {/* Anomaly List */}
                    <div className="mt-4 space-y-2">
                        {anomalies.anomalies.map((anomaly, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-slate-800 rounded p-3 border border-amber-100 dark:border-amber-800"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                                            {anomaly.timestamp.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                            {anomaly.context}
                                        </p>
                                    </div>
                                    <div className="text-right ml-4">
                                        <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                                            {anomaly.totalTokens.toLocaleString()}{" "}
                                            tokens
                                        </p>
                                        <p className="text-xs text-amber-600 dark:text-amber-400">
                                            {anomaly.deviation}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Recommendation */}
                    <div className="mt-4 p-3 bg-white dark:bg-slate-800 rounded border border-amber-100 dark:border-amber-800">
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                            <span className="font-semibold">
                                Recommendation:
                            </span>{" "}
                            Review these anomalies to identify potential
                            optimization opportunities or unexpected usage
                            patterns.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AnomalyHighlight
