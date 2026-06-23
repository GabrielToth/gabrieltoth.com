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
import { NextRequest } from "next/server"

const logger = createLogger("UserPreferences")

export async function PUT(request: NextRequest) {
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

        logger.info("Preferences saved", { userId: session.user_id })
        return createSuccessResponse({ message: "Preferences saved" })
    } catch (err) {
        return handleUnexpectedError(
            err,
            "UserPreferences",
            "/api/user/preferences"
        )
    }
}
