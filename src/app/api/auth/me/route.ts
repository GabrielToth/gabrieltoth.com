/**
 * GET /api/auth/me
 * Get current authenticated user endpoint
 *
 * Validates: Requirements 6.1, 6.2, 6.3
 */

import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { NextRequest } from "next/server"

const { queryOne } = db

export async function GET(request: NextRequest) {
    try {
        // Get session token from cookie
        const sessionToken = request.cookies.get("session")?.value

        if (!sessionToken) {
            logger.debug("GET /me request without session", {
                context: "Auth",
            })
            return createErrorResponse(AuthErrorType.UNAUTHORIZED)
        }

        // Find session
        const session = await queryOne<{ user_id: string; expires_at: Date }>(
            "SELECT user_id, expires_at FROM sessions WHERE session_id = $1",
            [sessionToken]
        )

        if (!session) {
            logger.debug("GET /me request with invalid session token", {
                context: "Auth",
            })
            return createErrorResponse(AuthErrorType.UNAUTHORIZED)
        }

        // Check if session is expired
        if (new Date(session.expires_at) < new Date()) {
            logger.debug("GET /me request with expired session", {
                context: "Auth",
                data: { userId: session.user_id },
            })
            return createErrorResponse(AuthErrorType.SESSION_EXPIRED)
        }

        // Get user data
        const user = await queryOne<{
            id: string
            google_email: string
            google_name: string
            google_picture?: string
        }>(
            "SELECT id, google_email, google_name, google_picture FROM users WHERE id = $1",
            [session.user_id]
        )

        if (!user) {
            logger.error("User not found for session", {
                context: "Auth",
                data: { userId: session.user_id },
            })
            return createErrorResponse(AuthErrorType.UNAUTHORIZED)
        }

        logger.debug("GET /me request successful", {
            context: "Auth",
            data: { userId: user.id },
        })

        return createSuccessResponse({
            id: user.id,
            google_email: user.google_email,
            google_name: user.google_name,
            google_picture: user.google_picture,
        })
    } catch (err) {
        return handleUnexpectedError(err, "Auth", "/api/auth/me")
    }
}
