/**
 * POST /api/auth/logout
 * User logout endpoint
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.5, 3.1, 7.1, 7.2, 7.3, 7.4, 7.5,
 *            8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5
 *
 * This endpoint:
 * 1. Extracts session token from cookie
 * 2. Validates CSRF token
 * 3. Validates session exists and not expired
 * 4. Deletes session from database
 * 5. Clears session cookie with maxAge=0 and empty value
 * 6. Creates audit log entry (non-blocking)
 * 7. Returns success response with redirect instruction
 * 8. Implements comprehensive error handling
 */

import { logAuditEvent } from "@/lib/auth/audit-logging"
import {
    AuthErrorType,
    createErrorResponse,
    handleUnexpectedError,
} from "@/lib/auth/error-handling"
import {
    deleteRememberMeToken,
    removeSession,
    validateSession,
} from "@/lib/auth/session"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { validateCsrfToken } from "@/lib/middleware/csrf-protection"
import { getClientIp } from "@/lib/middleware/security-headers"
import { NextRequest, NextResponse } from "next/server"

const { queryOne } = db

export async function POST(request: NextRequest) {
    const clientIp = getClientIp(request)

    try {
        // 1. Extract session token from cookie (check both possible names for compatibility)
        const sessionToken =
            request.cookies.get("auth_session")?.value ||
            request.cookies.get("session")?.value

        if (!sessionToken) {
            logger.warn("Logout attempt without session", {
                context: "Auth",
                data: { ip: clientIp },
            })
            return NextResponse.json(
                {
                    success: false,
                    error: "No active session",
                },
                { status: 401 }
            )
        }

        // 2. Validate CSRF token
        const csrfToken = request.headers.get("X-CSRF-Token")
        if (!csrfToken || !validateCsrfToken(sessionToken, csrfToken)) {
            logger.warn("Logout attempt with invalid CSRF token", {
                context: "Auth",
                data: { ip: clientIp, hasCsrfToken: !!csrfToken },
            })
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid CSRF token",
                },
                { status: 403 }
            )
        }

        // 3. Validate session exists and not expired
        const session = await validateSession(sessionToken)

        if (!session) {
            logger.warn("Logout attempt with invalid session token", {
                context: "Auth",
                data: { ip: clientIp },
            })
            return createErrorResponse(AuthErrorType.INVALID_SESSION)
        }

        // Get user email for logging
        const user = await queryOne<{ google_email: string; email: string }>(
            "SELECT google_email, email FROM users WHERE id = $1",
            [session.user_id]
        )

        const userEmail = user?.google_email || user?.email

        // 4. Delete session from database
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

        // 5. Delete remember_me_token from database if exists
        const rememberMeToken = request.cookies.get("remember_me_token")?.value
        if (rememberMeToken) {
            try {
                await deleteRememberMeToken(rememberMeToken)
            } catch (error) {
                logger.warn("Failed to delete Remember Me token on logout", {
                    context: "Auth",
                    error: error as Error,
                    data: { userId: session.user_id },
                })
                // Continue with logout even if token deletion fails
            }
        }

        // 6. Create audit log entry (non-blocking)
        if (userEmail) {
            try {
                await logAuditEvent(
                    "LOGOUT",
                    userEmail,
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

        // 7. Return success response with redirect instruction
        const response = NextResponse.json(
            {
                success: true,
                redirect: "/auth/login",
            },
            { status: 200 }
        )

        // 5. Clear session and remember me cookies
        // Maintains security attributes: httpOnly, secure, sameSite, path
        response.cookies.set("auth_session", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 0,
            path: "/",
        })

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
