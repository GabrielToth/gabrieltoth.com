/**
 * POST /api/webhooks/discord
 * Sends a notification payload to a configured Discord webhook URL.
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { sendDiscordNotification } from "@/lib/notifications/webhook-notifier"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("DiscordWebhookAPI")

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
        const { webhookUrl, event } = body

        if (!webhookUrl || !event || !event.title || !event.eventType) {
            return NextResponse.json(
                { success: false, error: "INVALID_WEBHOOK_PAYLOAD" },
                { status: 400 }
            )
        }

        const result = await sendDiscordNotification(webhookUrl, event)

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Discord webhook dispatch failed", err)
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        )
    }
}
