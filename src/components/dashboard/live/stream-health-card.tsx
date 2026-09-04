/**
 * StreamHealthCard Component
 * Displays real-time bitrate, fps, latency, dropped frames, and health status
 */

"use client"

import {
    evaluateStreamHealth,
    StreamHealthMetrics,
} from "@/lib/live/stream-health"

interface StreamHealthCardProps {
    metrics: StreamHealthMetrics
}

export function StreamHealthCard({ metrics }: StreamHealthCardProps) {
    const health = evaluateStreamHealth(metrics)

    const statusColors = {
        excellent: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        good: "bg-green-500/10 text-green-500 border-green-500/20",
        fair: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        poor: "bg-orange-500/10 text-orange-500 border-orange-500/20",
        critical: "bg-red-500/10 text-red-500 border-red-500/20",
    }

    return (
        <div className="rounded-xl border border-neutral-800 bg-background p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="text-sm font-semibold text-neutral-200">
                    Stream Health
                </h3>
                <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider ${
                        statusColors[health.level]
                    }`}
                >
                    {health.level} ({health.score}/100)
                </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                <div className="rounded-lg bg-card p-2.5">
                    <p className="text-neutral-400">Bitrate</p>
                    <p className="mt-1 text-sm font-bold text-neutral-100">
                        {metrics.bitrateKbps} Kbps
                    </p>
                </div>
                <div className="rounded-lg bg-card p-2.5">
                    <p className="text-neutral-400">Frame Rate</p>
                    <p className="mt-1 text-sm font-bold text-neutral-100">
                        {metrics.fps} FPS
                    </p>
                </div>
                <div className="rounded-lg bg-card p-2.5">
                    <p className="text-neutral-400">Latency</p>
                    <p className="mt-1 text-sm font-bold text-neutral-100">
                        {(metrics.latencyMs / 1000).toFixed(1)}s
                    </p>
                </div>
                <div className="rounded-lg bg-card p-2.5">
                    <p className="text-neutral-400">Dropped Frames</p>
                    <p className="mt-1 text-sm font-bold text-neutral-100">
                        {metrics.droppedFrames}
                    </p>
                </div>
            </div>

            {health.issues.length > 0 && (
                <div className="mt-3 rounded-lg bg-red-500/10 p-2.5 text-xs text-red-400">
                    <p className="font-semibold">Issues Detected:</p>
                    <ul className="mt-1 list-disc pl-4 space-y-0.5">
                        {health.issues.map((issue, idx) => (
                            <li key={idx}>{issue}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
