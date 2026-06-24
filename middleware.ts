/**
 * Next.js Middleware
 * Protects dashboard routes by validating sessions before route handlers execute
 * Redirects non-locale-prefixed dashboard URLs to locale-prefixed versions
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { authMiddleware } from "@/lib/middleware/auth-middleware"
import { NextRequest, NextResponse } from "next/server"

const SUPPORTED_LOCALES = ["en", "pt-BR", "es", "de"]
const DEFAULT_LOCALE = "pt-BR"

/**
 * Get the preferred locale from the request Accept-Language header
 */
function getPreferredLocale(request: NextRequest): string {
    const acceptLanguage = request.headers.get("accept-language") || ""
    for (const locale of SUPPORTED_LOCALES) {
        if (acceptLanguage.includes(locale)) {
            return locale
        }
    }
    return DEFAULT_LOCALE
}

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
 * 1. Redirect non-locale-prefixed /dashboard to /{locale}/dashboard
 * 2. Extract session token from cookie
 * 3. If invalid or expired, redirect to /{locale}/auth/login with 302 status
 * 4. If valid, allow request to proceed to route handler
 */
export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    // Redirect /dashboard/* (without locale) to /{locale}/dashboard/*
    if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
        const locale = getPreferredLocale(request)
        const newPath = `/${locale}${pathname}${request.nextUrl.search}`
        return NextResponse.redirect(new URL(newPath, request.url), {
            status: 308,
        })
    }

    // Check if route is a locale-prefixed dashboard route
    const isLocaleDashboard = /^\/[a-z]{2}(-[A-Z]{2})?\/dashboard(\/|$)/.test(
        pathname
    )

    if (isLocaleDashboard) {
        const authResponse = await authMiddleware(request, pathname)

        if (authResponse) {
            return authResponse
        }
    }

    return NextResponse.next()
}

/**
 * Middleware configuration
 */
export const config = {
    matcher: [
        "/dashboard/:path*",
        "/dashboard",
        "/(en|pt-BR|es|de)/dashboard/:path*",
    ],
}
