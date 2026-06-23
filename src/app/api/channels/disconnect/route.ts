/**
 * POST /api/channels/disconnect
 * Disconnect a social media channel
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 8.3
 */

import {
    AuthErrorType,
    createErrorResponse,
    createSuccessResponse,
    handleUnexpectedError,
} from "@/lib/auth/error-handling"
import { db } from "@/lib/db"
import { createLogger } from "@/lib/logger"
import {
    addCsrfTokenToResponse,
    createCsrfErrorResponse,
    regenerateCsrfToken,
    validateCsrfFromRequest,
} from "@/lib/middleware/api-csrf-middleware"
import { buildClientKey, rateLimitByKey } from "@/lib/rate-limit"
import { NextRequest, NextResponse } from "next/server"

const VALID_PLATFORMS = new Set([
    "youtube",
    "facebook",
    "instagram",
    "twitter",
    "linkedin",
    "twitch",
    "tiktok",
])

const logger = createLogger("DisconnectChannel")

export async function POST(request: NextRequest) {
    try {
        const sessionToken = request.cookies.get("session")?.value
        if (!sessionToken)
            return createErrorResponse(AuthErrorType.UNAUTHORIZED)

        const session = await db.queryOne<{
            user_id: string
            expires_at: Date
        }>("SELECT user_id, expires_at FROM sessions WHERE session_id = $1", [
            sessionToken,
        ])
        if (!session) return createErrorResponse(AuthErrorType.UNAUTHORIZED)
        if (new Date(session.expires_at) < new Date())
            return createErrorResponse(AuthErrorType.SESSION_EXPIRED)

        const clientIp =
            request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"
        const rateLimit = await rateLimitByKey(
            buildClientKey({
                ip: clientIp,
                path: "/api/channels/disconnect",
                userAgent: request.headers.get("user-agent"),
            })
        )
        if (!rateLimit.success)
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429 }
            )

        const { valid } = await validateCsrfFromRequest(request)
        if (!valid) return createCsrfErrorResponse()

        let body: Record<string, unknown>
        try {
            body = await request.json()
        } catch {
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }
        if (typeof body !== "object" || body === null || Array.isArray(body))
            return createErrorResponse(AuthErrorType.INVALID_INPUT)

        const allowed = new Set(["platform"])
        for (const key of Object.keys(body))
            if (!allowed.has(key))
                return createErrorResponse(AuthErrorType.INVALID_INPUT)

        const { platform } = body
        if (typeof platform !== "string" || !VALID_PLATFORMS.has(platform))
            return createErrorResponse(AuthErrorType.INVALID_INPUT)

        await db.query(
            "DELETE FROM linked_accounts WHERE user_id = $1 AND platform = $2",
            [session.user_id, platform]
        )
        await db.query(
            "DELETE FROM oauth_tokens WHERE user_id = $1 AND platform = $2",
            [session.user_id, platform]
        )

        logger.info("Channel disconnected", {
            userId: session.user_id,
            platform,
        })
        const response = createSuccessResponse({
            message: `Disconnected from ${platform}`,
        })
        const newCsrfToken = regenerateCsrfToken(request)
        if (newCsrfToken) return addCsrfTokenToResponse(response, newCsrfToken)
        return response
    } catch (err) {
        return handleUnexpectedError(
            err,
            "DisconnectChannel",
            "/api/channels/disconnect"
        )
    }
}
