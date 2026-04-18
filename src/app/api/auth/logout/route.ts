/**
 * POST /api/auth/logout
 * User logout endpoint
 *
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 13.1, 13.2, 13.3, 13.4
 */

import { logAuditEvent } from "@/lib/auth/audit-logging"
import { removeSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import {
    getClientIp,
    getSecurityHeaders,
} from "@/lib/middleware/security-headers"
import { NextRequest, NextResponse } from "next/server"

const { queryOne } = db

interface LogoutResponse {
    success: boolean
    message?: string
    error?: string
}

export async function POST(
    request: NextRequest
): Promise<NextResponse<LogoutResponse>> {
    const clientIp = getClientIp(request)
    const userAgent = request.headers.get("user-agent") || "unknown"

    try {
        // Get session token from cookie
        const sessionToken = request.cookies.get("session")?.value

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
                { status: 401, headers: getSecurityHeaders() }
            )
        }

        // Find session and get user info
        const session = await queryOne<{ user_id: string }>(
            "SELECT user_id FROM sessions WHERE session_id = $1",
            [sessionToken]
        )

        if (!session) {
            logger.warn("Logout attempt with invalid session token", {
                context: "Auth",
                data: { ip: clientIp },
            })
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid session",
                },
                { status: 401, headers: getSecurityHeaders() }
            )
        }

        // Get user email for logging
        const user = await queryOne<{ google_email: string }>(
            "SELECT google_email FROM users WHERE id = $1",
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
                    user.google_email,
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

        // Create response and clear cookie
        const response = NextResponse.json(
            {
                success: true,
                message: "Logout successful",
            },
            { status: 200, headers: getSecurityHeaders() }
        )

        // Clear session cookie
        response.cookies.set("session", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 0,
            path: "/",
        })

        return response
    } catch (err) {
        logger.error("Logout endpoint error", {
            context: "Auth",
            error: err as Error,
            data: { ip: clientIp },
        })

        return NextResponse.json(
            {
                success: false,
                error: "An error occurred. Please try again later",
            },
            { status: 500, headers: getSecurityHeaders() }
        )
    }
}
