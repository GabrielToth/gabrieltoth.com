/**
 * GET /api/live/metrics
 * Returns real-time stream metrics and aggregated engagement statistics.
 * Requires authenticated session.
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import {
    aggregateMetricsSnapshots,
    StreamMetricSnapshot,
} from "@/lib/live/stream-analytics"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("LiveMetricsAPI")

// Mock in-memory recent metrics cache for live streams
const recentMetricsCache: StreamMetricSnapshot[] = []

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "UNAUTHORIZED" },
                { status: 401 }
            )
        }

        const metrics = aggregateMetricsSnapshots(recentMetricsCache)

        return NextResponse.json({
            success: true,
            data: metrics,
        })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to fetch stream metrics", err)
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "UNAUTHORIZED" },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { viewers, chatMessagesCount, platform } = body

        if (typeof viewers !== "number" || !platform) {
            return NextResponse.json(
                { success: false, error: "INVALID_METRIC_DATA" },
                { status: 400 }
            )
        }

        const snapshot: StreamMetricSnapshot = {
            timestamp: Date.now(),
            viewers,
            chatMessagesCount: chatMessagesCount || 0,
            platform,
        }

        recentMetricsCache.push(snapshot)
        if (recentMetricsCache.length > 500) {
            recentMetricsCache.shift()
        }

        return NextResponse.json({
            success: true,
            data: snapshot,
        })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to record stream metric", err)
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        )
    }
}
