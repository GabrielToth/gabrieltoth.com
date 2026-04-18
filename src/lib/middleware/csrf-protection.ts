/**
 * CSRF Protection Middleware
 * Implements CSRF token generation, validation, and injection
 */

import { generateCsrfToken } from "@/lib/auth/password-hashing"
import { logger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"

// Store CSRF tokens in memory (in production, use Redis or database)
// Format: { sessionToken: csrfToken }
const csrfTokenStore = new Map<string, { token: string; expiresAt: number }>()

// Clean up expired tokens every 5 minutes
setInterval(
    () => {
        const now = Date.now()
        for (const [key, value] of csrfTokenStore.entries()) {
            if (value.expiresAt < now) {
                csrfTokenStore.delete(key)
            }
        }
    },
    5 * 60 * 1000
)

/**
 * Generate a new CSRF token for a session
 * @param sessionToken - The session token to associate with the CSRF token
 * @returns The generated CSRF token
 */
export function generateCsrfTokenForSession(sessionToken: string): string {
    const csrfToken = generateCsrfToken()
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

    csrfTokenStore.set(sessionToken, {
        token: csrfToken,
        expiresAt,
    })

    return csrfToken
}

/**
 * Validate a CSRF token for a session
 * @param sessionToken - The session token
 * @param csrfToken - The CSRF token to validate
 * @returns true if valid, false otherwise
 */
export function validateCsrfToken(
    sessionToken: string,
    csrfToken: string
): boolean {
    const stored = csrfTokenStore.get(sessionToken)

    if (!stored) {
        logger.warn("CSRF token not found for session", {
            context: "Security",
        })
        return false
    }

    if (stored.expiresAt < Date.now()) {
        csrfTokenStore.delete(sessionToken)
        logger.warn("CSRF token expired", {
            context: "Security",
        })
        return false
    }

    if (stored.token !== csrfToken) {
        logger.warn("CSRF token mismatch", {
            context: "Security",
        })
        return false
    }

    return true
}

/**
 * Invalidate a CSRF token (e.g., after successful form submission)
 * @param sessionToken - The session token
 */
export function invalidateCsrfToken(sessionToken: string): void {
    csrfTokenStore.delete(sessionToken)
}

/**
 * Middleware to validate CSRF token on POST/PUT/DELETE requests
 * @param request - The incoming request
 * @returns NextResponse with 403 if CSRF token is invalid, null if valid
 */
export async function validateCsrfMiddleware(
    request: NextRequest
): Promise<NextResponse | null> {
    // Only validate on state-changing requests
    const method = request.method
    if (!["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
        return null
    }

    // Get session token from cookie
    const sessionToken = request.cookies.get("auth_session")?.value

    // Get CSRF token from request body or header
    let csrfToken: string | null = null

    // Try to get from header first (for API requests)
    csrfToken = request.headers.get("x-csrf-token")

    // If not in header, try to get from body (for form submissions)
    if (!csrfToken) {
        try {
            const body = await request.json()
            csrfToken = body.csrfToken
        } catch {
            // Body might not be JSON, try form data
            try {
                const formData = await request.formData()
                csrfToken = formData.get("csrfToken") as string
            } catch {
                // No CSRF token found
            }
        }
    }

    // Validate CSRF token
    if (
        !csrfToken ||
        !sessionToken ||
        !validateCsrfToken(sessionToken, csrfToken)
    ) {
        logger.warn("CSRF validation failed", {
            context: "Security",
            data: {
                method,
                hasToken: !!csrfToken,
                hasSession: !!sessionToken,
            },
        })

        return NextResponse.json(
            {
                success: false,
                error: "Invalid CSRF token",
            },
            { status: 403 }
        )
    }

    return null
}

/**
 * Get CSRF token for a session (for GET requests)
 * @param sessionToken - The session token
 * @returns The CSRF token or null if not found
 */
export function getCsrfToken(sessionToken: string): string | null {
    const stored = csrfTokenStore.get(sessionToken)

    if (!stored) {
        return null
    }

    if (stored.expiresAt < Date.now()) {
        csrfTokenStore.delete(sessionToken)
        return null
    }

    return stored.token
}

/**
 * Inject CSRF token into response (for form rendering)
 * @param csrfToken - The CSRF token to inject
 * @returns Object with CSRF token for template injection
 */
export function injectCsrfToken(csrfToken: string): { csrfToken: string } {
    return { csrfToken }
}
