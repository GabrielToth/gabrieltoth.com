/**
 * GET /api/live/metrics
 * Returns real-time stream metrics and aggregated engagement statistics.
 * Requires authenticated session.
 *
 * Aggregates from persisted snapshots (live_metrics_snapshots) so history
 * survives serverless restarts. When the table has no rows yet, returns
 * honest zeros — no synthetic data.
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import {
    aggregateMetricsSnapshots,
    StreamMetricSnapshot,
} from "@/lib/live/stream-analytics"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("LiveMetricsAPI")

function getSupabaseAdmin() {
    if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
        return null
    }
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    )
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "UNAUTHORIZED" },
                { status: 401 }
            )
        }

        const supabase = getSupabaseAdmin()
        if (!supabase) {
            return NextResponse.json(
                { success: false, error: "SERVER_ERROR" },
                { status: 500 }
            )
        }

        // Load the user's persisted snapshots (all history; aggregation is cheap)
        const { data: rows, error } = await supabase
            .from("live_metrics_snapshots")
            .select("timestamp, viewers, chat_messages_count, platform")
            .eq("user_id", session.user.id)
            .order("timestamp", { ascending: true })

        if (error) {
            // Table may not be migrated yet — fall back to honest zeros
            logger.warn("live_metrics_snapshots read failed", {
                error: error.message,
            })
            const empty = aggregateMetricsSnapshots([])
            return NextResponse.json({ success: true, data: empty })
        }

        const snapshots: StreamMetricSnapshot[] = (rows || []).map(r => ({
            timestamp: new Date(r.timestamp).getTime(),
            viewers: r.viewers || 0,
            chatMessagesCount: r.chat_messages_count || 0,
            platform: r.platform || "unknown",
        }))

        const metrics = aggregateMetricsSnapshots(snapshots)

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

        const supabase = getSupabaseAdmin()
        if (!supabase) {
            return NextResponse.json(
                { success: false, error: "SERVER_ERROR" },
                { status: 500 }
            )
        }

        const { error: insertError } = await supabase
            .from("live_metrics_snapshots")
            .insert({
                user_id: session.user.id,
                viewers: Math.round(viewers),
                chat_messages_count:
                    typeof chatMessagesCount === "number"
                        ? Math.round(chatMessagesCount)
                        : 0,
                platform,
                timestamp: new Date().toISOString(),
            })

        if (insertError) {
            logger.error("Failed to persist live metric snapshot", {
                error: insertError.message,
            })
            return NextResponse.json(
                { success: false, error: insertError.message },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to save stream metric", err)
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        )
    }
}
