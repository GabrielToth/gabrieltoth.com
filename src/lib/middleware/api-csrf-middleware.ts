/**
 * API CSRF Middleware
 * Middleware wrapper for Next.js API routes to handle CSRF protection
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { logger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"
import {
    generateCsrfTokenForSession,
    getCsrfToken,
    invalidateCsrfToken,
    validateCsrfToken,
} from "./csrf-protection"

/**
 * Validate CSRF token from request
 * Returns the CSRF token if valid, null otherwise
 */
function getSessionToken(request: NextRequest): string | null {
    return (
        request.cookies.get("auth_session")?.value ||
        request.cookies.get("session")?.value ||
        null
    )
}

export async function validateCsrfFromRequest(
    request: NextRequest
): Promise<{ valid: boolean; csrfToken: string | null }> {
    const sessionToken = getSessionToken(request)

    if (!sessionToken) {
        return { valid: false, csrfToken: null }
    }

    // Get CSRF token from header first (preferred for API requests)
    let csrfToken = request.headers.get("x-csrf-token")

    // If not in header, try to get from body
    if (!csrfToken) {
        try {
            // Clone request to avoid consuming the body
            const clonedRequest = request.clone()
            const contentType = request.headers.get("content-type") || ""

            if (contentType.includes("application/json")) {
                const body = await clonedRequest.json()
                csrfToken = body.csrfToken
            } else if (contentType.includes("multipart/form-data")) {
                const formData = await clonedRequest.formData()
                csrfToken = formData.get("csrfToken") as string
            }
        } catch (error) {
            logger.warn("Failed to extract CSRF token from request body", {
                context: "Security",
                error,
            })
        }
    }

    if (!csrfToken) {
        return { valid: false, csrfToken: null }
    }

    const valid = validateCsrfToken(sessionToken, csrfToken)
    return { valid, csrfToken }
}

/**
 * Generate a CSRF token for a session.
 * Used in GET requests to provide token to client.
 * Stateless HMAC tokens are generated fresh each time.
 */
export function getOrGenerateCsrfToken(request: NextRequest): string | null {
    const sessionToken = getSessionToken(request)

    if (!sessionToken) {
        return null
    }

    const csrfToken = generateCsrfTokenForSession(sessionToken)
    logger.info("Generated CSRF token for session", {
        context: "Security",
    })

    return csrfToken
}

/**
 * Regenerate CSRF token after successful form submission
 * Call this after processing a successful POST/PUT/DELETE request
 */
export function regenerateCsrfToken(request: NextRequest): string | null {
    const sessionToken = getSessionToken(request)

    if (!sessionToken) {
        return null
    }

    invalidateCsrfToken(sessionToken)
    const newCsrfToken = generateCsrfTokenForSession(sessionToken)

    logger.info("Regenerated CSRF token after successful request", {
        context: "Security",
    })

    return newCsrfToken
}

/**
 * Create a 403 Forbidden response for invalid CSRF token
 */
export function createCsrfErrorResponse(): NextResponse {
    return NextResponse.json(
        {
            success: false,
            error: "Invalid CSRF token",
        },
        { status: 403 }
    )
}

/**
 * Helper to add CSRF token to response headers
 */
export function addCsrfTokenToResponse(
    response: NextResponse,
    csrfToken: string
): NextResponse {
    response.headers.set("X-CSRF-Token", csrfToken)
    return response
}
