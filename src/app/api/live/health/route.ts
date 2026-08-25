import { NextResponse } from "next/server"
import { evaluateStreamHealth } from "@/lib/live/stream-health"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const {
            bitrateKbps = 6000,
            fps = 60,
            droppedFrames = 0,
            totalFrames = 3600,
            latencyMs = 1500,
            resolution = "1080p",
            codec = "h264",
        } = body

        const health = evaluateStreamHealth({
            bitrateKbps,
            fps,
            droppedFrames,
            totalFrames,
            latencyMs,
            resolution,
            codec,
            timestamp: Date.now(),
        })

        return NextResponse.json({ success: true, health })
    } catch (_err) {
        return NextResponse.json(
            { error: "Invalid stream health metrics provided" },
            { status: 400 }
        )
    }
}
