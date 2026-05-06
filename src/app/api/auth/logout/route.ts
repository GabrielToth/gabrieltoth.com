/**
 * POST /api/auth/logout
 * User logout endpoint
 *
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 13.1, 13.2, 13.3, 13.4
 */

import { logAuditEvent } from "@/lib/auth/audit-logging"
import {
    AuthErrorType,
    createErrorResponse,
    createSuccessResponse,
    handleUnexpectedError,
} from "@/lib/auth/error-handling"
import { removeSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { getClientIp } from "@/lib/middleware/security-headers"
import { NextRequest } from "next/server"

const { queryOne } = db

export async function POST(request: NextRequest) {
    const clientIp = getClientIp(request)

    try {
        // Get session token from cookie (check both possible names for compatibility)
        const sessionToken =
            request.cookies.get("auth_session")?.value ||
            request.cookies.get("session")?.value

        if (!sessionToken) {
            logger.warn("Logout attempt without session", {
                context: "Auth",
                data: { ip: clientIp },
            })
            return createErrorResponse(AuthErrorType.UNAUTHORIZED)
        }

        // Find session and get user info
        const session = await queryOne<{ user_id: string }>(
            "SELECT user_id FROM sessions WHERE token_hash = $1",
            [sessionToken]
        )

        if (!session) {
            logger.warn("Logout attempt with invalid session token", {
                context: "Auth",
                data: { ip: clientIp },
            })
            return createErrorResponse(AuthErrorType.INVALID_SESSION)
        }

        // Get user email for logging
        const user = await queryOne<{ email: string }>(
            "SELECT email FROM users WHERE id = $1",
            [session.user_id]
        )

        // Delete session
        try {
            await removeSession(sessionToken)
        } catch (error) {
            logger.error("Failed to remove session", {
                context: "Auth",
                error: error as Error,
                data: { userId: session.user_id },
            })
            // Continue with logout even if session removal fails
        }

        // Log logout event
        if (user) {
            try {
                await logAuditEvent(
                    "LOGOUT",
                    user.email,
                    clientIp,
                    { action: "User logged out" },
                    session.user_id
                )
            } catch (error) {
                logger.error("Failed to log logout event", {
                    context: "Auth",
                    error: error as Error,
                    data: { userId: session.user_id },
                })
                // Don't fail the logout if audit logging fails
            }
        }

        logger.info("User logged out successfully", {
            context: "Auth",
            data: { userId: session.user_id },
        })

        // Create response and clear cookies
        const response = createSuccessResponse(undefined, "Logout successful")

        // Clear session cookies (both possible names for compatibility)
        response.cookies.set("auth_session", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 0,
            path: "/",
        })

        response.cookies.set("session", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 0,
            path: "/",
        })

        // Also clear remember me token if it exists
        response.cookies.set("remember_me_token", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 0,
            path: "/",
        })

        return response
    } catch (err) {
        return handleUnexpectedError(err, "Auth", "/api/auth/logout")
    }
}
