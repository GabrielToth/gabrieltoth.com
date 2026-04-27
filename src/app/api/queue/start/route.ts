import { startBackgroundProcessing } from "@/lib/queue/background-processor"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Start background queue processing
 *
 * This endpoint should be called once when your server starts.
 * It will start a background interval that processes the queue.
 *
 * NOTE: This only works in long-running Node.js processes.
 * It will NOT work in serverless environments (Vercel, AWS Lambda, etc.)
 *
 * For serverless, use client-side polling or external webhooks instead.
 */
export async function POST(request: NextRequest) {
    try {
        // Verify authorization
        const authHeader = request.headers.get("authorization")
        const expectedToken = process.env.QUEUE_TRIGGER_SECRET

        if (!expectedToken) {
            return NextResponse.json(
                { error: "Queue trigger not configured" },
                { status: 500 }
            )
        }

        if (authHeader !== `Bearer ${expectedToken}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Start background processing
        const processor = startBackgroundProcessing(60000) // 1 minute interval

        return NextResponse.json({
            success: true,
            message: "Background processing started",
            interval: 60000,
        })
    } catch (error) {
        console.error("Error starting background processing:", error)
        return NextResponse.json(
            {
                error: "Failed to start background processing",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        )
    }
}
