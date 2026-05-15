/**
 * Authentication Middleware
 * Protects routes and validates sessions
 */

import { validateSession as validateSessionFromLib } from "@/lib/auth/session"
import { logger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"

/**
 * Validate session token
 * Queries the sessions database table for the session token and verifies
 * that the expires_at timestamp is in the future.
 *
 * @param sessionId - The session ID
 * @returns Session data if valid and not expired, null otherwise
 *
 * Validates: Requirements 10.2, 10.3
 */
export async function validateSession(
    sessionId: string
): Promise<{ user_id: string; expires_at: Date } | null> {
    try {
        const session = await validateSessionFromLib(sessionId)

        if (!session) {
            return null
        }

        // Verify expires_at timestamp is in the future
        const now = new Date()
        const expiresAt = new Date(session.expires_at)

        if (expiresAt <= now) {
            logger.warn("Session validation failed: session expired", {
                context: "Auth",
                data: {
                    sessionId: sessionId.substring(0, 8) + "...",
                    expiresAt: expiresAt.toISOString(),
                    now: now.toISOString(),
                },
            })
            return null
        }

        // Return only the fields needed by middleware
        return {
            user_id: session.user_id,
            expires_at: session.expires_at,
        }
    } catch (error) {
        logger.error("Session validation error", {
            context: "Auth",
            error: error as Error,
        })
        return null
    }
}

/**
 * Middleware to protect routes
 * Validates sessions before allowing access to protected routes.
 * Queries the sessions database table for the session token and verifies
 * that the expires_at timestamp is in the future.
 *
 * @param request - The incoming request
 * @returns NextResponse with redirect to /auth/login (302) if not authenticated, null if authenticated
 *
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4
 */
export async function authMiddleware(
    request: NextRequest
): Promise<NextResponse | null> {
    // Get session token from cookie
    const sessionToken = request.cookies.get("session")?.value

    if (!sessionToken) {
        logger.warn("Access attempt without session", {
            context: "Auth",
            data: { path: request.nextUrl.pathname },
        })
        // Redirect to /auth/login with 302 status for invalid sessions
        return NextResponse.redirect(new URL("/auth/login", request.url), {
            status: 302,
        })
    }

    // Validate session and verify expires_at is in the future
    const session = await validateSession(sessionToken)

    if (!session) {
        logger.warn("Access attempt with invalid session", {
            context: "Auth",
            data: { path: request.nextUrl.pathname },
        })
        // Redirect to /auth/login with 302 status for invalid sessions
        return NextResponse.redirect(new URL("/auth/login", request.url), {
            status: 302,
        })
    }

    // Return null for valid sessions to allow request to proceed
    return null
}

/**
 * Get authenticated user from request
 * @param request - The incoming request
 * @returns User ID if authenticated, null otherwise
 */
export async function getAuthenticatedUser(
    request: NextRequest
): Promise<string | null> {
    const sessionToken = request.cookies.get("session")?.value

    if (!sessionToken) {
        return null
    }

    const session = await validateSession(sessionToken)

    if (!session) {
        return null
    }

    return session.user_id
}
