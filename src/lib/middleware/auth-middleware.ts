/**
 * Authentication Middleware
 * Protects routes and validates sessions
 */

import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"

const { queryOne } = db

interface Session {
    user_id: string
    expires_at: Date
}

/**
 * Validate session token
 * @param sessionId - The session ID
 * @returns Session data if valid, null otherwise
 */
export async function validateSession(
    sessionId: string
): Promise<Session | null> {
    try {
        const session = await queryOne<Session>(
            "SELECT user_id, expires_at FROM sessions WHERE session_id = $1",
            [sessionId]
        )

        if (!session) {
            return null
        }

        // Check if session is expired
        if (new Date(session.expires_at) < new Date()) {
            logger.warn("Session expired", {
                context: "Auth",
                data: { userId: session.user_id },
            })
            return null
        }

        return session
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
 * @param request - The incoming request
 * @returns NextResponse with redirect if not authenticated, null if authenticated
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
        return NextResponse.redirect(new URL("/login", request.url))
    }

    // Validate session
    const session = await validateSession(sessionToken)

    if (!session) {
        logger.warn("Access attempt with invalid session", {
            context: "Auth",
            data: { path: request.nextUrl.pathname },
        })
        return NextResponse.redirect(new URL("/login", request.url))
    }

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
