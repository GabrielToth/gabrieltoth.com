import { NextRequest, NextResponse } from "next/server"
import { handleTikTokWebhookEvent } from "@/lib/tiktok/webhook-handler"
import { createLogger } from "@/lib/logger"

const logger = createLogger("TikTokWebhook")

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const challenge = searchParams.get("challenge")

    if (challenge) {
        logger.info("TikTok webhook verified")
        return new NextResponse(challenge, { status: 200 })
    }

    return new NextResponse("Forbidden", { status: 403 })
}

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text()

        let body: unknown
        try {
            body = JSON.parse(rawBody)
        } catch {
            logger.warn("Invalid JSON in TikTok webhook payload")
            return new NextResponse("Bad Request", { status: 400 })
        }

        if (
            !body ||
            typeof body !== "object" ||
            !("event" in body) ||
            !("create_time" in body)
        ) {
            logger.warn("Invalid TikTok webhook event structure")
            return new NextResponse("Bad Request", { status: 400 })
        }

        const event = body as {
            event: string
            create_time: number
            content: string
        }

        const result = await handleTikTokWebhookEvent({
            event: event.event as any,
            create_time: event.create_time,
            content: event.content,
        })

        logger.info("TikTok webhook processed", {
            handled: result.handled,
            errors: result.errors,
        })

        return NextResponse.json({ status: "ok" }, { status: 200 })
    } catch (error) {
        logger.error(
            "TikTok webhook processing error",
            error instanceof Error ? error : new Error(String(error))
        )
        return NextResponse.json({ status: "error" }, { status: 500 })
    }
}
