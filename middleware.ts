/**
 * Next.js Middleware
 * Protects dashboard routes by validating sessions before route handlers execute
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { authMiddleware } from "@/lib/middleware/auth-middleware"
import { NextRequest, NextResponse } from "next/server"

/**
 * Middleware to protect dashboard routes
 * Validates sessions before allowing access to protected routes.
 *
 * Protected routes:
 * - /dashboard
 * - /dashboard/publish
 * - /dashboard/insights
 * - /dashboard/settings
 *
 * For any request to a dashboard route:
 * 1. Extract session token from cookie
 * 2. Validate session exists in database
 * 3. Verify expires_at timestamp is in the future
 * 4. If invalid or expired, redirect to /auth/login with 302 status
 * 5. If valid, allow request to proceed to route handler
 *
 * Validates: Requirements 10.1, 10.4, 10.5
 */
export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    // Check if route is a protected dashboard route
    // Matches: /dashboard, /dashboard/*, /en/dashboard, /en/dashboard/*, etc.
    const isDashboardRoute =
        pathname === "/dashboard" ||
        pathname.startsWith("/dashboard/") ||
        /^\/[a-z]{2}(-[A-Z]{2})?\/dashboard(\/|$)/.test(pathname)

    if (isDashboardRoute) {
        // Execute session validation middleware
        // Returns NextResponse with redirect to /auth/login (302) if not authenticated
        // Returns null if authenticated and allows request to proceed
        const authResponse = await authMiddleware(request)

        if (authResponse) {
            // Session validation failed, return redirect response
            return authResponse
        }
    }

    // Allow request to proceed to route handler
    return NextResponse.next()
}

/**
 * Middleware configuration
 * Specifies which routes should be processed by this middleware
 *
 * Validates: Requirements 10.5
 */
export const config = {
    matcher: [
        // Match dashboard routes with optional locale prefix
        "/dashboard/:path*",
        "/(en|pt-BR|es|de)/dashboard/:path*",
    ],
}
