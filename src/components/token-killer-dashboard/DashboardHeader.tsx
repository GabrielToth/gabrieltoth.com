/**
 * Dashboard Header Component
 * Displays dashboard title and controls for auto-refresh and manual refresh
 */

'use client'

import React from 'react'

interface DashboardHeaderProps {
  autoRefresh: boolean
  onAutoRefreshChange: (enabled: boolean) => void
  onRefresh: () => void
}

/**
 * Dashboard header component
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  autoRefresh,
  onAutoRefreshChange,
  onRefresh,
}) => {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Token Killer Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Monitor and analyze token consumption across your applications
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {/* Auto-Refresh Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAutoRefreshChange(!autoRefresh)}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              autoRefresh
                ? 'bg-blue-600'
                : 'bg-slate-300 dark:bg-slate-600'
            }`}
            title={autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                autoRefresh ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Auto-refresh
          </span>
        </div>

        {/* Manual Refresh Button */}
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
          title="Refresh data"
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
          Refresh
        </button>
      </div>
    </div>
  )
}

export default DashboardHeader
