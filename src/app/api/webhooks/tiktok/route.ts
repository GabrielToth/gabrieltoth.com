import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { handleTikTokWebhookEvent } from "@/lib/tiktok/webhook-handler"
import type { TikTokWebhookEventType } from "@/lib/tiktok/webhook-types"
import { createLogger } from "@/lib/logger"

const logger = createLogger("TikTokWebhook")

/**
 * TikTok signs webhook POSTs with HMAC-SHA256 of the raw body using the
 * app's Client Secret. The signature arrives in the `X-Tiktok-Signature`
 * header as `sha256=<hex>`. A missing or mismatched signature means the
 * request did not come from TikTok, so it is rejected before any parsing.
 */
function verifySignature(rawBody: string, signature: string | null): boolean {
    const secret = process.env.TIKTOK_CLIENT_SECRET
    if (!secret || !signature) return false

    const expected =
        "sha256=" +
        crypto.createHmac("sha256", secret).update(rawBody).digest("hex")

    const provided = Buffer.from(signature)
    const computed = Buffer.from(expected)
    if (provided.length !== computed.length) return false

    return crypto.timingSafeEqual(provided, computed)
}

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

        const signature = req.headers.get("x-tiktok-signature")
        if (!verifySignature(rawBody, signature)) {
            logger.warn("Invalid or missing TikTok webhook signature")
            return new NextResponse("Forbidden", { status: 403 })
        }

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
            event: event.event as TikTokWebhookEventType,
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
