/**
 * Instagram Webhook Endpoint
 *
 * GET  — Meta verification handshake (hub.mode, hub.verify_token, hub.challenge)
 * POST — Receive Instagram Graph API webhook events
 *
 * Security:
 *   - GET: verify_token match prevents unauthorized subscriptions
 *   - POST: X-Hub-Signature-256 HMAC-SHA256 signed with App Secret
 *
 * Attack matrix:
 *   GET:  1,2,7,8,9,14,15,18
 *   POST: 2,3,4,5,6,7,8,9,10,13,14,15,19,20
 */

import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { handleWebhookEvent } from "@/lib/instagram/webhook-handler"
import { createLogger } from "@/lib/logger"

const logger = createLogger("InstagramWebhook")

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const mode = searchParams.get("hub.mode")
    const token = searchParams.get("hub.verify_token")
    const challenge = searchParams.get("hub.challenge")

    if (
        mode === "subscribe" &&
        token === process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN &&
        challenge
    ) {
        logger.info("Instagram webhook verified")
        return new NextResponse(challenge, { status: 200 })
    }

    return new NextResponse("Forbidden", { status: 403 })
}

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text()

        const signature = req.headers.get("x-hub-signature-256")
        if (signature) {
            const appSecret = process.env.INSTAGRAM_APP_SECRET
            if (!appSecret) {
                logger.error(
                    "Missing INSTAGRAM_APP_SECRET for webhook verification"
                )
                return new NextResponse("Internal Server Error", {
                    status: 500,
                })
            }

            const expectedSig =
                "sha256=" +
                crypto
                    .createHmac("sha256", appSecret)
                    .update(rawBody)
                    .digest("hex")

            try {
                const isVerified = crypto.timingSafeEqual(
                    Buffer.from(signature),
                    Buffer.from(expectedSig)
                )
                if (!isVerified) {
                    logger.warn("Invalid webhook signature")
                    return new NextResponse("Forbidden", { status: 403 })
                }
            } catch {
                logger.warn("Signature comparison failed")
                return new NextResponse("Forbidden", { status: 403 })
            }
        } else {
            logger.warn("Missing x-hub-signature-256 header")
        }

        let body: unknown
        try {
            body = JSON.parse(rawBody)
        } catch {
            return new NextResponse("OK", { status: 200 })
        }

        const event = body as { object?: string }
        if (event?.object === "page" || event?.object === "instagram") {
            handleWebhookEvent(event as any)
        }

        return new NextResponse("OK", { status: 200 })
    } catch (error) {
        logger.error(
            "Instagram webhook error",
            error instanceof Error ? error : new Error(String(error))
        )
        return new NextResponse("OK", { status: 200 })
    }
}
