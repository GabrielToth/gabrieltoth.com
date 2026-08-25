/**
 * POST /api/webhooks/telegram
 * Sends a notification payload to Telegram via Bot API.
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { sendTelegramNotification } from "@/lib/notifications/webhook-notifier"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("TelegramWebhookAPI")

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
        const { botToken, chatId, event } = body

        if (
            !botToken ||
            !chatId ||
            !event ||
            !event.title ||
            !event.eventType
        ) {
            return NextResponse.json(
                { success: false, error: "INVALID_TELEGRAM_PAYLOAD" },
                { status: 400 }
            )
        }

        const result = await sendTelegramNotification(botToken, chatId, event)

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Telegram webhook dispatch failed", err)
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        )
    }
}
