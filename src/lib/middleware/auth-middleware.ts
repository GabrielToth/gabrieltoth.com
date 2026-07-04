/**
 * Authentication Middleware
 * Protects routes and validates sessions
 *
 * NOTE: This middleware runs on Edge Runtime. It only checks for cookie presence and format.
 * Actual session validation against the database happens in route handlers.
 * Edge Runtime cannot import node-postgres or other Node.js built-in modules.
 */

import { NextRequest, NextResponse } from "next/server"

/**
 * Validate that a token matches expected hex format (64 hex characters = 32 bytes)
 */
function isValidTokenFormat(token: string): boolean {
    return /^[0-9a-f]{64}$/.test(token)
}

/**
 * Middleware to protect routes
 * Validates sessions before allowing access to protected routes.
 * Edge-compatible: only checks cookie presence, no DB queries.
 *
 * Accepts either an auth_session cookie (short-lived, refreshed on activity)
 * or a remember_me_token cookie (long-lived, 30 days).
 *
 * @param request - The incoming request
 * @param pathname - The request pathname to extract locale from
 * @returns NextResponse with redirect to login (302) if not authenticated, null if authenticated
 */
export async function authMiddleware(
    request: NextRequest,
    pathname?: string
): Promise<NextResponse | null> {
    const sessionToken = request.cookies.get("auth_session")?.value
    const rememberMeToken = request.cookies.get("remember_me_token")?.value

    // Allow if auth_session is present and valid format
    if (sessionToken && isValidTokenFormat(sessionToken)) {
        return null
    }

    // Allow if remember_me_token is present and valid format
    if (rememberMeToken && isValidTokenFormat(rememberMeToken)) {
        return null
    }

    // No valid token found — redirect to login
    const locale = pathname?.match(/^\/([a-z]{2}(-[A-Z]{2})?)/)?.[1] || "en"
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url), {
        status: 302,
    })
}

/**
 * Get authenticated user from request
 * @param request - The incoming request
 * @returns User ID if cookie present, null otherwise
 */
export async function getAuthenticatedUser(
    request: NextRequest
): Promise<string | null> {
    const sessionToken = request.cookies.get("auth_session")?.value

    if (!sessionToken || !isValidTokenFormat(sessionToken)) {
        return null
    }

    return sessionToken.substring(0, 8) || null
}
