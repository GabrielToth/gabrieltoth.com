/**
 * Authentication Middleware
 * Protects routes and validates sessions
 *
 * NOTE: This middleware runs on Edge Runtime. It only checks for cookie presence.
 * Actual session validation against the database happens in route handlers.
 * Edge Runtime cannot import node-postgres or other Node.js built-in modules.
 */

import { NextRequest, NextResponse } from "next/server"

/**
 * Middleware to protect routes
 * Validates sessions before allowing access to protected routes.
 * Edge-compatible: only checks cookie presence, no DB queries.
 *
 * @param request - The incoming request
 * @returns NextResponse with redirect to /auth/login (302) if not authenticated, null if authenticated
 *
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4
 */
export async function authMiddleware(
    request: NextRequest
): Promise<NextResponse | null> {
    const sessionToken = request.cookies.get("session")?.value

    if (!sessionToken) {
        return NextResponse.redirect(new URL("/auth/login", request.url), {
            status: 302,
        })
    }

    return null
}

/**
 * Get authenticated user from request
 * @param request - The incoming request
 * @returns User ID if cookie present, null otherwise
 */
export async function getAuthenticatedUser(
    request: NextRequest
): Promise<string | null> {
    const sessionToken = request.cookies.get("session")?.value

    if (!sessionToken) {
        return null
    }

    return sessionToken.split(":")[0] || null
}
