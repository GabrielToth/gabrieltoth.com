import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { handleWebhookEvent } from "@/lib/facebook/webhook-handler"
import { createLogger } from "@/lib/logger"

const logger = createLogger("FacebookWebhook")

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const mode = searchParams.get("hub.mode")
    const token = searchParams.get("hub.verify_token")
    const challenge = searchParams.get("hub.challenge")

    if (
        mode === "subscribe" &&
        token === process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN &&
        challenge
    ) {
        logger.info("Facebook webhook verified")
        return new NextResponse(challenge, { status: 200 })
    }

    return new NextResponse("Forbidden", { status: 403 })
}

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text()

        const signature = req.headers.get("x-hub-signature-256")
        if (signature) {
            const appSecret = process.env.FACEBOOK_APP_SECRET
            if (!appSecret) {
                logger.error(
                    "Missing FACEBOOK_APP_SECRET for webhook verification"
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
                    logger.warn("Invalid Facebook webhook signature")
                    return new NextResponse("Forbidden", { status: 403 })
                }
            } catch {
                logger.warn("Facebook webhook signature comparison failed")
                return new NextResponse("Forbidden", { status: 403 })
            }
        } else {
            logger.warn("Facebook webhook request missing signature header")
        }

        let body: unknown
        try {
            body = JSON.parse(rawBody)
        } catch {
            logger.warn("Invalid JSON in Facebook webhook payload")
            return new NextResponse("Bad Request", { status: 400 })
        }

        if (
            !body ||
            typeof body !== "object" ||
            !("object" in body) ||
            !("entry" in body)
        ) {
            logger.warn("Invalid Facebook webhook event structure")
            return new NextResponse("Bad Request", { status: 400 })
        }

        const event = body as {
            object: string
            entry: Array<Record<string, unknown>>
        }

        if (event.object !== "page") {
            logger.warn("Received non-page Facebook webhook event", {
                object: event.object,
            })
            return new NextResponse("OK", { status: 200 })
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await handleWebhookEvent(event as any)

        logger.info("Facebook webhook processed", {
            handled: result.handled,
            errors: result.errors,
        })

        return NextResponse.json({ status: "ok" }, { status: 200 })
    } catch (error) {
        logger.error(
            "Facebook webhook processing error",
            error instanceof Error ? error : new Error(String(error))
        )
        return NextResponse.json({ status: "error" }, { status: 500 })
    }
}
