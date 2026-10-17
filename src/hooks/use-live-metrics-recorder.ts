"use client"

/**
 * useLiveMetricsRecorder
 *
 * Records real viewer/chat metrics from the live status polling into
 * POST /api/live/metrics so the dashboard and Insights pages aggregate
 * persisted history instead of in-memory mock data.
 *
 * fire-and-forget: metric persistence failures never break the live page.
 */

import { useEffect, useRef } from "react"

interface LivePlatformMetrics {
    platform: string
    isLive: boolean
    viewerCount: number
}

export function useLiveMetricsRecorder(
    platforms: LivePlatformMetrics[],
    intervalMs = 30000
): void {
    const lastPostedRef = useRef<number>(0)

    useEffect(() => {
        const livePlatforms = platforms.filter(p => p.isLive)
        if (livePlatforms.length === 0) return

        const now = Date.now()
        // Throttle: one POST per interval window (status polls every 30s)
        if (now - lastPostedRef.current < intervalMs - 1000) return
        lastPostedRef.current = now

        for (const p of livePlatforms) {
            fetch("/api/live/metrics", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    platform: p.platform,
                    viewers: p.viewerCount || 0,
                    chatMessagesCount: 0,
                }),
            }).catch(() => {
                // silent: metrics persistence is best-effort
            })
        }
    }, [platforms, intervalMs])
}
