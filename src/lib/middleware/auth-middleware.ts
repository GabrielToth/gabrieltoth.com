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
 * @param pathname - The request pathname to extract locale from
 * @returns NextResponse with redirect to login (302) if not authenticated, null if authenticated
 */
export async function authMiddleware(
    request: NextRequest,
    pathname?: string
): Promise<NextResponse | null> {
    const sessionToken = request.cookies.get("session")?.value

    if (!sessionToken) {
        const locale = pathname?.match(/^\/([a-z]{2}(-[A-Z]{2})?)/)?.[1] || "en"
        return NextResponse.redirect(new URL(`/${locale}/login`, request.url), {
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
