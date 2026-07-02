/**
 * Authentication Middleware
 * Handles session token validation, Remember Me token validation, session refresh,
 * and protected route access control
 *
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
 *
 * Features:
 * - Session token validation (1 hour expiration)
 * - Remember Me token validation (30 days expiration)
 * - Automatic session refresh (extend expiration)
 * - Protected route middleware
 * - Redirect to login for unauthenticated users
 * - Comprehensive error handling
 * - Audit logging for authentication events
 *
 * Security Considerations:
 * 1. Session Validation: Session tokens are validated on every protected route
 *    access. Invalid or expired tokens result in redirect to login page.
 *
 * 2. Remember Me Fallback: If session token is invalid, the middleware checks
 *    for a valid Remember Me token. This allows users to stay logged in for
 *    30 days without re-authentication.
 *
 * 3. Session Refresh: Sessions are automatically refreshed when accessed within
 *    5 minutes of expiration. This extends the session by 1 hour without
 *    requiring re-authentication.
 *
 * 4. Secure Cookies: Session and Remember Me tokens are stored in secure
 *    HttpOnly cookies that cannot be accessed by JavaScript. This prevents
 *    XSS attacks from stealing tokens.
 *
 * 5. Route Protection: Protected routes are checked against a whitelist.
 *    Unauthenticated access to protected routes results in redirect to login.
 *
 * 6. Audit Logging: Unauthenticated access attempts are logged for security
 *    monitoring and compliance.
 *
 * 7. Error Handling: All errors are caught and logged. Users are redirected
 *    to login page on any authentication error.
 */

import { logSecurityEvent } from "@/lib/auth/audit-logging"
import {
    refreshSessionToken,
    validateRememberMeToken,
    validateSessionToken,
} from "@/lib/auth/session"
import { logger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"

/**
 * Session validation result
 */
export interface SessionValidationResult {
    isValid: boolean
    userId?: string
    sessionToken?: string
    rememberMeToken?: string
    error?: string
}

/**
 * Middleware configuration options
 */
export interface AuthMiddlewareOptions {
    /**
     * Routes that don't require authentication
     */
    publicRoutes?: string[]

    /**
     * Routes that require authentication
     */
    protectedRoutes?: string[]

    /**
     * URL to redirect to when not authenticated
     */
    loginUrl?: string

    /**
     * URL to redirect to when authenticated (for login page)
     */
    dashboardUrl?: string

    /**
     * Enable session refresh (extend expiration)
     */
    enableSessionRefresh?: boolean

    /**
     * Session refresh threshold (milliseconds before expiration)
     */
    refreshThreshold?: number
}

/**
 * Default middleware configuration
 */
const DEFAULT_OPTIONS: AuthMiddlewareOptions = {
    publicRoutes: [
        "/login",
        "/register",
        "/forgot-password",
        "/api/auth/login",
    ],
    protectedRoutes: ["/dashboard", "/profile", "/settings"],
    loginUrl: "/login",
    dashboardUrl: "/dashboard",
    enableSessionRefresh: true,
    refreshThreshold: 5 * 60 * 1000, // 5 minutes before expiration
}

/**
 * Validate session token from request
 *
 * This function:
 * 1. Extracts session token from cookies
 * 2. Validates token format and expiration
 * 3. Returns validation result with user ID
 *
 * @param request - The incoming request
 * @returns SessionValidationResult with validation status and user ID
 *
 * Validates: Requirement 23.1
 */
export async function validateSessionTokenMiddleware(
    request: NextRequest
): Promise<SessionValidationResult> {
    try {
        // Get session token from cookie
        const sessionToken = request.cookies.get("auth_session")?.value

        if (!sessionToken) {
            logger.debug("No session token found in request", {
                context: "Auth",
                data: { path: request.nextUrl.pathname },
            })
            return {
                isValid: false,
                error: "No session token found",
            }
        }

        // Validate session token
        const isValid = await validateSessionToken(sessionToken)

        if (!isValid) {
            logger.warn("Invalid or expired session token", {
                context: "Auth",
                data: {
                    path: request.nextUrl.pathname,
                    tokenPreview: sessionToken.substring(0, 8) + "...",
                },
            })
            return {
                isValid: false,
                error: "Session token is invalid or expired",
            }
        }

        logger.debug("Session token validated successfully", {
            context: "Auth",
            data: { path: request.nextUrl.pathname },
        })

        return {
            isValid: true,
            sessionToken,
        }
    } catch (error) {
        logger.error("Error validating session token", {
            context: "Auth",
            error: error as Error,
            data: { path: request.nextUrl.pathname },
        })
        return {
            isValid: false,
            error: "Error validating session token",
        }
    }
}

/**
 * Validate Remember Me token from request
 *
 * This function:
 * 1. Extracts Remember Me token from cookies
 * 2. Validates token format and expiration
 * 3. Returns validation result
 *
 * @param request - The incoming request
 * @returns SessionValidationResult with validation status
 *
 * Validates: Requirement 23.2
 */
export async function validateRememberMeTokenMiddleware(
    request: NextRequest
): Promise<SessionValidationResult> {
    try {
        // Get Remember Me token from cookie
        const rememberMeToken = request.cookies.get("remember_me_token")?.value

        if (!rememberMeToken) {
            logger.debug("No Remember Me token found in request", {
                context: "Auth",
                data: { path: request.nextUrl.pathname },
            })
            return {
                isValid: false,
                error: "No Remember Me token found",
            }
        }

        // Validate Remember Me token
        const isValid = await validateRememberMeToken(rememberMeToken)

        if (!isValid) {
            logger.warn("Invalid or expired Remember Me token", {
                context: "Auth",
                data: {
                    path: request.nextUrl.pathname,
                    tokenPreview: rememberMeToken.substring(0, 8) + "...",
                },
            })
            return {
                isValid: false,
                error: "Remember Me token is invalid or expired",
            }
        }

        logger.debug("Remember Me token validated successfully", {
            context: "Auth",
            data: { path: request.nextUrl.pathname },
        })

        return {
            isValid: true,
            rememberMeToken,
        }
    } catch (error) {
        logger.error("Error validating Remember Me token", {
            context: "Auth",
            error: error as Error,
            data: { path: request.nextUrl.pathname },
        })
        return {
            isValid: false,
            error: "Error validating Remember Me token",
        }
    }
}

/**
 * Refresh session token by extending expiration
 *
 * This function:
 * 1. Validates the session token exists and is not expired
 * 2. Checks if token is within refresh threshold
 * 3. Extends token expiration to 1 hour from now
 * 4. Returns new expiration date
 *
 * @param request - The incoming request
 * @returns New expiration date if refreshed, null if not needed or failed
 *
 * Validates: Requirement 23.3
 */
export async function refreshSessionTokenMiddleware(
    request: NextRequest
): Promise<Date | null> {
    try {
        // Get session token from cookie
        const sessionToken = request.cookies.get("auth_session")?.value

        if (!sessionToken) {
            logger.debug("No session token found for refresh", {
                context: "Auth",
                data: { path: request.nextUrl.pathname },
            })
            return null
        }

        // Refresh session token with token rotation
        const refreshResult = await refreshSessionToken(sessionToken)

        if (!refreshResult) {
            logger.debug("Session token refresh failed or not needed", {
                context: "Auth",
                data: { path: request.nextUrl.pathname },
            })
            return null
        }

        logger.debug("Session token refreshed successfully", {
            context: "Auth",
            data: {
                path: request.nextUrl.pathname,
                newExpirationDate: refreshResult.expiresAt.toISOString(),
            },
        })

        return refreshResult.expiresAt
    } catch (error) {
        logger.error("Error refreshing session token", {
            context: "Auth",
            error: error as Error,
            data: { path: request.nextUrl.pathname },
        })
        return null
    }
}

/**
 * Check if route is public (doesn't require authentication)
 *
 * @param pathname - The request pathname
 * @param publicRoutes - List of public routes
 * @returns true if route is public, false otherwise
 */
function isPublicRoute(pathname: string, publicRoutes: string[]): boolean {
    return publicRoutes.some(route => {
        // Exact match
        if (pathname === route) {
            return true
        }

        // Prefix match (for API routes like /api/auth/*)
        if (route.endsWith("/*")) {
            const prefix = route.slice(0, -2)
            return pathname.startsWith(prefix)
        }

        return false
    })
}

/**
 * Check if route is protected (requires authentication)
 *
 * @param pathname - The request pathname
 * @param protectedRoutes - List of protected routes
 * @returns true if route is protected, false otherwise
 */
function isProtectedRoute(
    pathname: string,
    protectedRoutes: string[]
): boolean {
    return protectedRoutes.some(route => {
        // Exact match
        if (pathname === route) {
            return true
        }

        // Prefix match
        if (route.endsWith("/*")) {
            const prefix = route.slice(0, -2)
            return pathname.startsWith(prefix)
        }

        // Prefix match without wildcard
        return pathname.startsWith(route)
    })
}

/**
 * Protected route middleware
 *
 * This function:
 * 1. Checks if route is protected
 * 2. Validates session token or Remember Me token
 * 3. Refreshes session if needed
 * 4. Redirects to login if not authenticated
 *
 * @param request - The incoming request
 * @param options - Middleware configuration options
 * @returns NextResponse with redirect if not authenticated, null if authenticated
 *
 * Validates: Requirement 23.4
 */
export async function protectedRouteMiddleware(
    request: NextRequest,
    options: AuthMiddlewareOptions = {}
): Promise<NextResponse | null> {
    const config = { ...DEFAULT_OPTIONS, ...options }
    const pathname = request.nextUrl.pathname

    // Check if route is public
    if (isPublicRoute(pathname, config.publicRoutes || [])) {
        logger.debug("Public route accessed", {
            context: "Auth",
            data: { path: pathname },
        })
        return null
    }

    // Check if route is protected
    if (!isProtectedRoute(pathname, config.protectedRoutes || [])) {
        logger.debug("Non-protected route accessed", {
            context: "Auth",
            data: { path: pathname },
        })
        return null
    }

    // Validate session token
    const sessionValidation = await validateSessionTokenMiddleware(request)

    if (sessionValidation.isValid && sessionValidation.sessionToken) {
        // Session is valid, optionally refresh if enabled
        if (config.enableSessionRefresh) {
            await refreshSessionTokenMiddleware(request)
        }

        logger.debug("Protected route accessed with valid session", {
            context: "Auth",
            data: { path: pathname },
        })
        return null
    }

    // Session token is invalid, try Remember Me token
    const rememberMeValidation =
        await validateRememberMeTokenMiddleware(request)

    if (rememberMeValidation.isValid && rememberMeValidation.rememberMeToken) {
        logger.debug("Protected route accessed with valid Remember Me token", {
            context: "Auth",
            data: { path: pathname },
        })
        return null
    }

    // No valid authentication found, redirect to login
    logger.warn("Unauthenticated access attempt to protected route", {
        context: "Auth",
        data: {
            path: pathname,
            sessionError: sessionValidation.error,
            rememberMeError: rememberMeValidation.error,
        },
    })

    // Log security event
    await logSecurityEvent(
        "UNAUTHENTICATED_ACCESS_ATTEMPT",
        undefined,
        request.headers.get("x-forwarded-for") || "unknown",
        {
            path: pathname,
            reason: "No valid session or Remember Me token",
        },
        undefined
    )

    // Redirect to login
    return redirectToLogin(request, config.loginUrl || "/login")
}

/**
 * Redirect to login page
 *
 * This function:
 * 1. Creates a redirect response to login page
 * 2. Preserves the original URL as a return_to parameter
 * 3. Clears authentication cookies
 *
 * @param request - The incoming request
 * @param loginUrl - The login page URL
 * @returns NextResponse with redirect to login
 *
 * Validates: Requirement 23.5
 */
export function redirectToLogin(
    request: NextRequest,
    loginUrl: string = "/login"
): NextResponse {
    // Create redirect URL with return_to parameter
    const redirectUrl = new URL(loginUrl, request.url)
    redirectUrl.searchParams.set("return_to", request.nextUrl.pathname)

    // Create response
    const response = NextResponse.redirect(redirectUrl)

    // Clear authentication cookies
    response.cookies.delete("auth_session")
    response.cookies.delete("remember_me_token")
    response.cookies.delete("csrf_token")

    logger.info("Redirecting to login", {
        context: "Auth",
        data: {
            from: request.nextUrl.pathname,
            to: loginUrl,
        },
    })

    return response
}

/**
 * Authentication middleware factory
 *
 * Creates a middleware function that can be used in Next.js middleware.ts
 *
 * @param options - Middleware configuration options
 * @returns Middleware function
 *
 * Example usage in middleware.ts:
 * ```
 * import { createAuthMiddleware } from "@/middleware/auth"
 *
 * const authMiddleware = createAuthMiddleware({
 *   publicRoutes: ["/login", "/register"],
 *   protectedRoutes: ["/dashboard", "/profile"],
 * })
 *
 * export function middleware(request: NextRequest) {
 *   return authMiddleware(request)
 * }
 * ```
 */
export function createAuthMiddleware(options: AuthMiddlewareOptions = {}) {
    return async (request: NextRequest): Promise<NextResponse | null> => {
        return protectedRouteMiddleware(request, options)
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
 */
export async function getAuthenticatedUser(
    request: NextRequest
): Promise<string | null> {
    try {
        const sessionValidation = await validateSessionTokenMiddleware(request)

        if (sessionValidation.isValid && sessionValidation.sessionToken) {
            // Extract user ID from session token (format: userId:timestamp:random)
            const parts = sessionValidation.sessionToken.split(":")
            if (parts.length >= 1) {
                return parts[0]
            }
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
 */
export async function isAuthenticated(request: NextRequest): Promise<boolean> {
    const sessionValidation = await validateSessionTokenMiddleware(request)
    return sessionValidation.isValid
}

/**
 * Check if user has Remember Me enabled
 *
 * @param request - The incoming request
 * @returns true if Remember Me token is valid, false otherwise
 */
export async function hasRememberMe(request: NextRequest): Promise<boolean> {
    const rememberMeValidation =
        await validateRememberMeTokenMiddleware(request)
    return rememberMeValidation.isValid
}
