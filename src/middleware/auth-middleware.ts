/**
 * Authentication Middleware
 * Validates sessions before route handlers execute
 *
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4
 *
 * Features:
 * - Session token validation from database
 * - Expiration timestamp verification
 * - Redirect to login for invalid sessions
 * - Allows valid sessions to proceed
 *
 * Security Considerations:
 * 1. Session Validation: Session tokens are validated against the database
 *    on every protected route access. Invalid or expired tokens result in
 *    redirect to login page.
 *
 * 2. Expiration Check: The middleware verifies that the expires_at timestamp
 *    is in the future. Sessions with past expiration dates are rejected.
 *
 * 3. Database Query: Session validation queries the sessions table with
 *    parameterized queries to prevent SQL injection.
 *
 * 4. Middleware Execution Order: This middleware executes before route
 *    handlers, ensuring authentication is enforced consistently.
 *
 * 5. Error Handling: All errors are caught and logged. Users are redirected
 *    to login page on any validation error.
 */

import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { Session } from "@/types/auth"
import { NextRequest, NextResponse } from "next/server"

const { queryOne } = db

/**
 * Validate a session by session_id from the database
 *
 * This function:
 * 1. Queries the sessions table for the session token
 * 2. Checks if session exists
 * 3. Verifies expires_at timestamp is in the future
 * 4. Returns Session object if valid, null if invalid or expired
 *
 * @param sessionId - The session ID to validate
 * @returns Session object if valid and not expired, null otherwise
 * @throws Error if database operation fails
 *
 * Validates: Requirements 10.2, 10.3
 */
export async function validateSession(
    sessionId: string
): Promise<Session | null> {
    try {
        // Validate session ID
        if (!sessionId || typeof sessionId !== "string") {
            logger.warn("Invalid session ID provided for validation", {
                context: "Auth",
            })
            return null
        }

        // Query session by session_id from database
        const session = await queryOne<Session>(
            `SELECT id, user_id, session_id, created_at, expires_at
             FROM sessions
             WHERE session_id = $1`,
            [sessionId]
        )

        // Session not found
        if (!session) {
            logger.debug("Session not found in database", {
                context: "Auth",
                data: { sessionId: sessionId.substring(0, 8) + "..." },
            })
            return null
        }

        // Check if session is expired (verify expires_at is in the future)
        const now = new Date()
        const expiresAt = new Date(session.expires_at)

        if (expiresAt <= now) {
            logger.debug("Session expired", {
                context: "Auth",
                data: {
                    userId: session.user_id,
                    expiresAt: expiresAt.toISOString(),
                },
            })
            return null
        }

        // Session is valid
        logger.debug("Session validated successfully", {
            context: "Auth",
            data: {
                userId: session.user_id,
                expiresAt: expiresAt.toISOString(),
            },
        })

        return session
    } catch (error) {
        logger.error("Failed to validate session", {
            context: "Auth",
            error: error as Error,
            data: { sessionId: sessionId?.substring(0, 8) + "..." },
        })
        throw error
    }
}

/**
 * Authentication middleware
 *
 * This function:
 * 1. Extracts session token from request cookies
 * 2. Validates session exists and is not expired
 * 3. Returns null for valid sessions to allow request to proceed
 * 4. Returns redirect response for invalid sessions
 *
 * @param request - The incoming request
 * @returns null if session is valid (allow request to proceed), NextResponse with redirect if invalid
 *
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4
 */
export async function authMiddleware(
    request: NextRequest
): Promise<NextResponse | null> {
    try {
        // Extract session token from cookie
        const sessionCookie = request.cookies.get("session")

        if (!sessionCookie || !sessionCookie.value) {
            logger.debug("No session cookie found", {
                context: "Auth",
                data: { path: request.nextUrl.pathname },
            })
            // Redirect to /auth/login with 302 status
            return NextResponse.redirect(new URL("/auth/login", request.url), {
                status: 302,
            })
        }

        // Validate session from database
        const session = await validateSession(sessionCookie.value)

        if (!session) {
            logger.warn("Invalid or expired session", {
                context: "Auth",
                data: {
                    path: request.nextUrl.pathname,
                    sessionId: sessionCookie.value.substring(0, 8) + "...",
                },
            })
            // Redirect to /auth/login with 302 status
            return NextResponse.redirect(new URL("/auth/login", request.url), {
                status: 302,
            })
        }

        // Session is valid, allow request to proceed
        logger.debug("Session validated, allowing request to proceed", {
            context: "Auth",
            data: {
                path: request.nextUrl.pathname,
                userId: session.user_id,
            },
        })

        return null
    } catch (error) {
        logger.error("Error validating session in middleware", {
            context: "Auth",
            error: error as Error,
            data: { path: request.nextUrl.pathname },
        })
        // Redirect to /auth/login with 302 status on error
        return NextResponse.redirect(new URL("/auth/login", request.url), {
            status: 302,
        })
    }
}

/**
 * Get authenticated user from request
 *
 * This function:
 * 1. Validates session token
 * 2. Returns user ID if authenticated
 *
 * @param request - The incoming request
 * @returns User ID if authenticated, null otherwise
 *
 * Validates: Requirement 10.1
 */
export async function getAuthenticatedUser(
    request: NextRequest
): Promise<string | null> {
    try {
        // Extract session token from cookie
        const sessionCookie = request.cookies.get("session")

        if (!sessionCookie || !sessionCookie.value) {
            return null
        }

        // Validate session
        const session = await validateSession(sessionCookie.value)

        if (session) {
            return session.user_id
        }

        return null
    } catch (error) {
        logger.error("Error getting authenticated user", {
            context: "Auth",
            error: error as Error,
        })
        return null
    }
}

/**
 * Check if user is authenticated
 *
 * @param request - The incoming request
 * @returns true if user is authenticated, false otherwise
 *
 * Validates: Requirement 10.1
 */
export async function isAuthenticated(request: NextRequest): Promise<boolean> {
    try {
        // Extract session token from cookie
        const sessionCookie = request.cookies.get("session")

        if (!sessionCookie || !sessionCookie.value) {
            return false
        }

        // Validate session
        const session = await validateSession(sessionCookie.value)

        return session !== null
    } catch (error) {
        logger.error("Error checking authentication", {
            context: "Auth",
            error: error as Error,
        })
        return false
    }
}
