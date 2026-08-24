/**
 * StreamHealthHeader Component
 * Minimalist, standardized stream health indicator for header integration
 */

"use client"

import {
    evaluateStreamHealth,
    StreamHealthMetrics,
} from "@/lib/live/stream-health"
import { useState } from "react"

interface StreamHealthHeaderProps {
    metrics?: StreamHealthMetrics
}

const DEFAULT_METRICS: StreamHealthMetrics = {
    bitrateKbps: 6000,
    fps: 60,
    droppedFrames: 0,
    totalFrames: 12000,
    latencyMs: 1800,
    resolution: "1080p60",
    codec: "h264",
    timestamp: Date.now(),
}

export function StreamHealthHeader({
    metrics = DEFAULT_METRICS,
}: StreamHealthHeaderProps) {
    const health = evaluateStreamHealth(metrics)
    const [open, setOpen] = useState(false)

    const statusColors = {
        excellent: "bg-emerald-500",
        good: "bg-green-500",
        fair: "bg-amber-500",
        poor: "bg-orange-500",
        critical: "bg-rose-500",
    }

    const statusBadgeText = {
        excellent: "Health: Excellent",
        good: "Health: Good",
        fair: "Health: Fair",
        poor: "Health: Poor",
        critical: "Health: Critical",
    }

    return (
        <div className="relative inline-flex items-center">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center space-x-2 rounded-full border border-border/40 bg-muted/40 px-2.5 py-1 text-xs transition-colors hover:bg-accent focus:outline-none"
                title="Stream Health Status"
            >
                <span className="relative flex h-2 w-2">
                    <span
                        className={`absolute inline-flex h-full w-full animate-ping rounded-full ${statusColors[health.level]} opacity-75`}
                    />
                    <span
                        className={`relative inline-flex h-2 w-2 rounded-full ${statusColors[health.level]}`}
                    />
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                    {metrics.bitrateKbps} kbps · {metrics.fps} FPS
                </span>
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-lg border border-border bg-card p-3 shadow-lg text-xs">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                        <span className="font-semibold text-foreground">
                            {statusBadgeText[health.level]}
                        </span>
                        <span className="font-mono font-bold text-primary">
                            {health.score}/100
                        </span>
                    </div>
                    <div className="mt-2 space-y-1 text-muted-foreground">
                        <p>Resolution: {metrics.resolution}</p>
                        <p>Bitrate: {metrics.bitrateKbps} Kbps</p>
                        <p>FPS: {metrics.fps}</p>
                        <p>Latency: {metrics.latencyMs}ms</p>
                    </div>
                    {health.issues.length > 0 && (
                        <div className="mt-2 border-t border-border pt-2 text-rose-500">
                            {health.issues.map((issue, idx) => (
                                <p key={idx}>• {issue}</p>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
