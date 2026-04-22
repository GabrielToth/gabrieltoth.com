/**
 * Account Completion Middleware
 *
 * Intercepts requests to protected routes and redirects incomplete accounts
 * to the account completion flow. Allows access to the completion page
 * without requiring a full session.
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { getSessionFromCookie } from "@/lib/auth/session"
import { getUserById } from "@/lib/auth/user"
import { NextRequest, NextResponse } from "next/server"

/**
 * Routes that should NOT trigger account completion redirect
 * These routes are accessible even for incomplete accounts
 */
const COMPLETION_FLOW_ROUTES = [
    "/auth/complete-account",
    "/api/auth/complete-account",
    "/api/auth/logout",
]

/**
 * Routes that should NOT be protected by account completion middleware
 * These routes are public and don't require authentication
 */
const PUBLIC_ROUTES = [
    "/auth/login",
    "/auth/register",
    "/api/auth/",
    "/api/health",
    "/",
    "/privacy-policy",
    "/terms-of-service",
]

/**
 * Check if a route is in the public routes list
 *
 * @param pathname - The request pathname
 * @returns Boolean indicating if the route is public
 */
function isPublicRoute(pathname: string): boolean {
    // Remove locale prefix if present (e.g., /en/auth/login -> /auth/login)
    let pathWithoutLocale = pathname
    const localeMatch = pathname.match(/^\/([a-z]{2}(-[A-Z]{2})?)(.*)$/)
    if (localeMatch) {
        pathWithoutLocale = localeMatch[3] || "/"
    }

    return PUBLIC_ROUTES.some(route => {
        if (route.endsWith("/")) {
            return pathWithoutLocale.startsWith(route)
        }
        return (
            pathWithoutLocale === route ||
            pathWithoutLocale.startsWith(route + "/")
        )
    })
}

/**
 * Check if a route is part of the account completion flow
 *
 * @param pathname - The request pathname
 * @returns Boolean indicating if the route is part of completion flow
 */
function isCompletionFlowRoute(pathname: string): boolean {
    return COMPLETION_FLOW_ROUTES.some(route => pathname.includes(route))
}

/**
 * Extract locale from pathname
 *
 * @param pathname - The request pathname
 * @returns The locale (e.g., 'en', 'pt-BR', 'es', 'de')
 */
function getLocaleFromPathname(pathname: string): string {
    const parts = pathname.split("/")
    if (parts.length > 1 && parts[1]) {
        return parts[1]
    }
    return "en"
}

/**
 * Check account completion status and redirect if necessary
 *
 * This middleware:
 * 1. Validates user session
 * 2. Checks if account is complete (has password_hash)
 * 3. Redirects incomplete accounts to /[locale]/auth/complete-account
 * 4. Allows access to completion page without full session
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
 *
 * @param request - The incoming request
 * @returns NextResponse with redirect or null to continue
 *
 * @example
 * ```typescript
 * // In middleware.ts
 * const completionResponse = await checkAccountCompletion(request)
 * if (completionResponse) {
 *   return completionResponse
 * }
 * ```
 */
export async function checkAccountCompletion(
    request: NextRequest
): Promise<NextResponse | null> {
    const pathname = request.nextUrl.pathname

    // Skip public routes
    if (isPublicRoute(pathname)) {
        return null
    }

    // Skip account completion flow routes
    if (isCompletionFlowRoute(pathname)) {
        return null
    }

    try {
        // Get session from cookie
        const session = await getSessionFromCookie(request)

        if (!session) {
            // No session, let other middleware handle (likely redirect to login)
            return null
        }

        // Get user from database
        const user = (await getUserById(session.user_id)) as OAuthUser | null

        if (!user) {
            // User not found, let other middleware handle
            return null
        }

        // Check if account is complete
        // Account is complete if it has a password_hash AND status is 'completed'
        if (
            user.password_hash &&
            user.account_completion_status === "completed"
        ) {
            // Account is complete, allow access
            return null
        }

        // Account is incomplete, redirect to completion flow
        const locale = getLocaleFromPathname(pathname)
        const redirectUrl = new URL(
            `/${locale}/auth/complete-account`,
            request.url
        )

        return NextResponse.redirect(redirectUrl)
    } catch (error) {
        // Log error but don't block the request
        console.error("Account completion middleware error:", error)
        return null
    }
}

/**
 * Get the account completion status for a user
 *
 * @param userId - The user ID
 * @returns The account completion status or null if user not found
 */
export async function getAccountCompletionStatus(
    userId: string
): Promise<"pending" | "in_progress" | "completed" | null> {
    try {
        const user = (await getUserById(userId)) as OAuthUser | null
        if (!user) {
            return null
        }
        return user.account_completion_status
    } catch (error) {
        console.error("Error getting account completion status:", error)
        return null
    }
}

/**
 * Check if an account is complete
 *
 * @param userId - The user ID
 * @returns Boolean indicating if account is complete
 */
export async function isAccountComplete(userId: string): Promise<boolean> {
    try {
        const user = (await getUserById(userId)) as OAuthUser | null
        if (!user) {
            return false
        }
        return (
            user.password_hash !== null &&
            user.account_completion_status === "completed"
        )
    } catch (error) {
        console.error("Error checking account completion:", error)
        return false
    }
}
