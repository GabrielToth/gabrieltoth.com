/**
 * Loading Indicator Component
 * Displays loading state while data is being fetched
 * Implements Requirement 6.6: Loading indicators
 */

'use client'

import React from 'react'

/**
 * Loading indicator component
 */
export const LoadingIndicator: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 animate-pulse" />

      {/* Time Window Selector Skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-24 animate-pulse"
          />
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6"
          >
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4 animate-pulse" />
            <div className="h-64 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 rounded-lg shadow p-4"
          >
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2 animate-pulse" />
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-2 animate-pulse" />
            <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-1/2 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default LoadingIndicator
