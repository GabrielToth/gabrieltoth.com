/**
 * PUT /api/user/preferences
 * Save user preferences (stored client-side via localStorage)
 *
 * Validates: Requirements 6.1, 6.2, 6.3
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

const logger = createLogger("UserPreferences")

export async function PUT(request: NextRequest) {
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
            request.headers.get("x-forwarded-for")?.split(",")[0] ||
            "unknown"
        const rateLimit = await rateLimitByKey(
            buildClientKey({
                ip: clientIp,
                path: "/api/user/preferences",
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

        logger.info("Preferences saved", { userId: session.user_id })
        const response = createSuccessResponse({ message: "Preferences saved" })
        const newCsrfToken = regenerateCsrfToken(request)
        if (newCsrfToken) return addCsrfTokenToResponse(response, newCsrfToken)
        return response
    } catch (err) {
        return handleUnexpectedError(
            err,
            "UserPreferences",
            "/api/user/preferences"
        )
    }
}
