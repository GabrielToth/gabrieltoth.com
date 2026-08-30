import { NextResponse } from "next/server"
import {
    evaluateStreamHealth,
    StreamHealthMetrics,
} from "@/lib/live/stream-health"

const PLATFORM_METRICS: Record<
    string,
    Omit<StreamHealthMetrics, "timestamp">
> = {
    twitch: {
        bitrateKbps: 6000,
        fps: 60,
        droppedFrames: 0,
        totalFrames: 3600,
        latencyMs: 1800,
        resolution: "1080p60",
        codec: "h264",
    },
    youtube: {
        bitrateKbps: 8500,
        fps: 60,
        droppedFrames: 2,
        totalFrames: 3600,
        latencyMs: 2900,
        resolution: "1440p60",
        codec: "av1",
    },
    kick: {
        bitrateKbps: 6000,
        fps: 60,
        droppedFrames: 0,
        totalFrames: 3600,
        latencyMs: 2200,
        resolution: "1080p60",
        codec: "h264",
    },
    facebook: {
        bitrateKbps: 4500,
        fps: 60,
        droppedFrames: 5,
        totalFrames: 3600,
        latencyMs: 3500,
        resolution: "720p60",
        codec: "h264",
    },
    instagram: {
        bitrateKbps: 3500,
        fps: 30,
        droppedFrames: 1,
        totalFrames: 1800,
        latencyMs: 4100,
        resolution: "720p30",
        codec: "h264",
    },
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const platform = searchParams.get("platform")?.toLowerCase() || "twitch"
        const isLive = searchParams.get("isLive") === "true"

        const platformData =
            PLATFORM_METRICS[platform] || PLATFORM_METRICS.twitch
        const metrics: StreamHealthMetrics = {
            ...platformData,
            timestamp: Date.now(),
        }

        const health = evaluateStreamHealth(metrics)

        return NextResponse.json({
            success: true,
            platform,
            isLive,
            metrics,
            health,
        })
    } catch (_err) {
        return NextResponse.json(
            { error: "Failed to fetch platform stream health" },
            { status: 500 }
        )
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const {
            platform = "default",
            bitrateKbps = 6000,
            fps = 60,
            droppedFrames = 0,
            totalFrames = 3600,
            latencyMs = 1500,
            resolution = "1080p",
            codec = "h264",
        } = body

        const metrics: StreamHealthMetrics = {
            bitrateKbps,
            fps,
            droppedFrames,
            totalFrames,
            latencyMs,
            resolution,
            codec,
            timestamp: Date.now(),
        }

        const health = evaluateStreamHealth(metrics)

        return NextResponse.json({
            success: true,
            platform,
            metrics,
            health,
        })
    } catch (_err) {
        return NextResponse.json(
            { error: "Invalid stream health metrics provided" },
            { status: 400 }
        )
    }
}
