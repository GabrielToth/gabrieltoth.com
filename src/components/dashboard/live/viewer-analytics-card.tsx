/**
 * ViewerAnalyticsCard Component
 * Displays retention, peak, average viewers, and duration metrics
 */

"use client"

import { calculateViewerRetention, ViewerDataPoint } from "@/lib/live/viewer-analytics"

interface ViewerAnalyticsCardProps {
    history: ViewerDataPoint[]
}

export function ViewerAnalyticsCard({ history }: ViewerAnalyticsCardProps) {
    const stats = calculateViewerRetention(history)

    return (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="text-sm font-semibold text-neutral-200">Viewer Retention & Analytics</h3>
                <span className="text-xs font-mono text-neutral-400">
                    Duration: {stats.durationMinutes}m
                </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg bg-neutral-800/40 p-2.5">
                    <p className="text-neutral-400">Peak Viewers</p>
                    <p className="mt-1 text-sm font-bold text-emerald-400">{stats.peakViewers}</p>
                </div>
                <div className="rounded-lg bg-neutral-800/40 p-2.5">
                    <p className="text-neutral-400">Average Viewers</p>
                    <p className="mt-1 text-sm font-bold text-sky-400">{stats.averageViewers}</p>
                </div>
                <div className="rounded-lg bg-neutral-800/40 p-2.5">
                    <p className="text-neutral-400">Retention Rate</p>
                    <p className="mt-1 text-sm font-bold text-indigo-400">{stats.retentionRate}%</p>
                </div>
            </div>
        </div>
    )
}
