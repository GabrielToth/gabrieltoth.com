/**
 * HTTPS Enforcement Middleware
 * Enforces HTTPS in production environment
 *
 * Validates: Requirement 22.6 - Configure HTTPS enforcement (production)
 *
 * HTTPS enforcement:
 * - Production: Redirect HTTP to HTTPS, set HSTS header
 * - Development: Allow HTTP for local development
 */

import { getConfig } from "@/config/environment"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

/**
 * HTTPS enforcement middleware
 */
export function httpsEnforcementMiddleware(request: NextRequest): NextResponse {
    const config = getConfig()

    // Only enforce HTTPS in production
    if (!config.security.httpsEnforced) {
        return NextResponse.next()
    }

    // Check if request is using HTTPS
    const protocol = request.headers.get("x-forwarded-proto") || "http"

    if (protocol === "http") {
        // Redirect to HTTPS
        const url = request.nextUrl.clone()
        url.protocol = "https:"

        return NextResponse.redirect(url, {
            status: 301, // Permanent redirect
        })
    }

    // Add HSTS header for HTTPS
    const response = NextResponse.next()
    response.headers.set(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains; preload"
    )

    return response
}

/**
 * Higher-order function to enforce HTTPS for API route handlers
 */
export function withHttpsEnforcement(
    handler: (req: NextRequest) => Promise<Response> | Response
) {
    return async (req: NextRequest) => {
        const config = getConfig()

        // Only enforce HTTPS in production
        if (config.security.httpsEnforced) {
            const protocol = req.headers.get("x-forwarded-proto") || "http"

            if (protocol === "http") {
                // Return error for HTTP requests in production
                return new NextResponse(
                    JSON.stringify({
                        error: "HTTPS required",
                        message:
                            "This endpoint requires HTTPS. Please use a secure connection.",
                    }),
                    {
                        status: 403,
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                )
            }
        }

        // Call the handler
        const response = await handler(req)

        // Convert to NextResponse if needed
        let nextResponse: NextResponse
        if (response instanceof NextResponse) {
            nextResponse = response
        } else {
            nextResponse = new NextResponse(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
            })
        }

        // Add HSTS header for HTTPS
        if (config.security.httpsEnforced) {
            nextResponse.headers.set(
                "Strict-Transport-Security",
                "max-age=31536000; includeSubDomains; preload"
            )
        }

        return nextResponse
    }
}

/**
 * Check if request is using HTTPS
 */
export function isHttpsRequest(request: NextRequest): boolean {
    const protocol = request.headers.get("x-forwarded-proto") || "http"
    return protocol === "https"
}

/**
 * Get HTTPS enforcement configuration
 */
export function getHttpsEnforcementConfiguration(): {
    enforced: boolean
    hstsMaxAge: number
    hstsIncludeSubDomains: boolean
    hstsPreload: boolean
} {
    const config = getConfig()

    return {
        enforced: config.security.httpsEnforced,
        hstsMaxAge: 31536000, // 1 year
        hstsIncludeSubDomains: true,
        hstsPreload: true,
    }
}
