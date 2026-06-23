/**
 * POST /api/channels/connect
 * Connect a social media channel (returns OAuth redirect URL)
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
import { NextRequest } from "next/server"

const VALID_PLATFORMS = new Set([
    "youtube",
    "facebook",
    "instagram",
    "twitter",
    "linkedin",
    "twitch",
    "tiktok",
])

const logger = createLogger("ConnectChannel")

export async function POST(request: NextRequest) {
    try {
        const sessionToken = request.cookies.get("session")?.value
        if (!sessionToken) return createErrorResponse(AuthErrorType.UNAUTHORIZED)

        const session = await db.queryOne<{ user_id: string; expires_at: Date }>(
            "SELECT user_id, expires_at FROM sessions WHERE session_id = $1",
            [sessionToken]
        )
        if (!session) return createErrorResponse(AuthErrorType.UNAUTHORIZED)
        if (new Date(session.expires_at) < new Date())
            return createErrorResponse(AuthErrorType.SESSION_EXPIRED)

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
        if (
            typeof platform !== "string" ||
            !VALID_PLATFORMS.has(platform)
        )
            return createErrorResponse(AuthErrorType.INVALID_INPUT)

        logger.info("Channel connect initiated", {
            userId: session.user_id,
            platform,
        })
        return createSuccessResponse({
            redirectUrl: `/api/auth/oauth/authorize?platform=${platform}`,
        })
    } catch (err) {
        return handleUnexpectedError(
            err,
            "ConnectChannel",
            "/api/channels/connect"
        )
    }
}
