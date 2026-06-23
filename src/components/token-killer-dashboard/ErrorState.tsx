/**
 * Error State Component
 * Displays error messages with retry functionality
 * Implements Requirement 6.7: Error states
 */

"use client"

import React from "react"

interface ErrorStateProps {
    error: string
    onRetry: () => void
}

/**
 * Error state component
 */
export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
    return (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8">
            <div className="flex items-start gap-4">
                {/* Error Icon */}
                <div className="flex-shrink-0">
                    <svg
                        className="h-6 w-6 text-red-600 dark:text-red-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
                        Failed to Load Dashboard
                    </h3>
                    <p className="text-sm text-red-800 dark:text-red-200 mt-2">
                        {error}
                    </p>

                    {/* Troubleshooting Steps */}
                    <div className="mt-4 bg-white dark:bg-slate-800 rounded p-4">
                        <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                            Troubleshooting steps:
                        </p>
                        <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1 list-disc list-inside">
                            <li>Check your internet connection</li>
                            <li>Verify the API server is running</li>
                            <li>Check browser console for detailed errors</li>
                            <li>Try refreshing the page</li>
                        </ul>
                    </div>

                    {/* Retry Button */}
                    <div className="mt-4">
                        <button
                            onClick={onRetry}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ErrorState
