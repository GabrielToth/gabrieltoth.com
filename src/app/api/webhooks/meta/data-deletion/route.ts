import { createLogger } from "@/lib/logger"
import {
    processMetaUserDataDeletion,
    type DeletionResult,
} from "@/lib/facebook/deletion-service"
import { parseMetaSignedRequest } from "@/lib/facebook/crypto"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("MetaDataDeletionCallback")

/**
 * POST /api/webhooks/meta/data-deletion
 *
 * Meta User Data Deletion Callback.
 * Accepts signed_request (form or JSON) and returns url + confirmation_code.
 *
 * Attack matrix: 1, 2, 3, 4, 5, 6, 7, 8, 9, 13, 14, 15, 19
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const contentType = request.headers.get("content-type") || ""
        let signedRequest: string | null = null

        if (contentType.includes("application/x-www-form-urlencoded")) {
            const formData = await request.formData()
            const raw = formData.get("signed_request")
            signedRequest = typeof raw === "string" ? raw : null
        } else if (contentType.includes("application/json")) {
            const body = await request.json().catch(() => null)
            if (
                body &&
                typeof body === "object" &&
                !Array.isArray(body) &&
                "signed_request" in body
            ) {
                const value = (body as Record<string, unknown>).signed_request
                signedRequest = typeof value === "string" ? value : null
            }
        } else {
            return NextResponse.json(
                { error: "UNSUPPORTED_CONTENT_TYPE" },
                { status: 415 }
            )
        }

        if (!signedRequest) {
            logger.warn("Meta data deletion callback missing signed_request")
            return NextResponse.json(
                { error: "MISSING_SIGNED_REQUEST" },
                { status: 400 }
            )
        }

        if (signedRequest.length > 8192) {
            return NextResponse.json(
                { error: "SIGNED_REQUEST_TOO_LARGE" },
                { status: 413 }
            )
        }

        const appSecret =
            process.env.FACEBOOK_APP_SECRET ||
            process.env.INSTAGRAM_APP_SECRET ||
            ""
        if (!appSecret) {
            logger.error("Missing app secret for signed_request verification")
            return NextResponse.json(
                { error: "SERVER_CONFIGURATION_ERROR" },
                { status: 500 }
            )
        }

        const parsed = parseMetaSignedRequest(signedRequest, appSecret)
        if (!parsed.valid || !parsed.payload) {
            logger.warn(
                "Invalid Meta signed_request in data deletion callback",
                {
                    error: parsed.error,
                }
            )
            return NextResponse.json(
                { error: "INVALID_SIGNATURE" },
                { status: 403 }
            )
        }

        const userIdValue = parsed.payload.user_id
        const metaUserId =
            typeof userIdValue === "string" ? userIdValue.trim() : ""

        if (!metaUserId || metaUserId.length > 128) {
            logger.warn("Meta data deletion callback missing user_id")
            return NextResponse.json(
                { error: "MISSING_USER_ID" },
                { status: 400 }
            )
        }

        const result: DeletionResult =
            await processMetaUserDataDeletion(metaUserId)

        return NextResponse.json(
            {
                url: result.statusUrl,
                confirmation_code: result.confirmationCode,
            },
            { status: 200 }
        )
    } catch (error) {
        logger.error(
            "Meta data deletion callback error",
            error instanceof Error ? error : new Error(String(error))
        )
        return NextResponse.json(
            { error: "INTERNAL_SERVER_ERROR" },
            { status: 500 }
        )
    }
}
