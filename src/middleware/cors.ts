/**
 * CORS Middleware
 * Handles Cross-Origin Resource Sharing configuration for both cloud and local environments
 *
 * Validates: Requirement 22.7 - Configure CORS settings
 *
 * CORS configuration:
 * - Cloud: Strict CORS with specific allowed origins
 * - Local: Flexible CORS for development
 */

import { getConfig } from "@/config/environment"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

/**
 * Get CORS headers based on environment
 */
function getCorsHeaders(
    origin: string | null,
    config: ReturnType<typeof getConfig>
): Record<string, string> {
    const headers: Record<string, string> = {}

    // Check if origin is allowed
    const isOriginAllowed =
        origin && config.security.corsOrigins.includes(origin)

    if (isOriginAllowed || config.isDevelopment) {
        // Set Access-Control-Allow-Origin
        headers["Access-Control-Allow-Origin"] = origin || "*"

        // Set Access-Control-Allow-Credentials
        if (config.security.corsCredentials) {
            headers["Access-Control-Allow-Credentials"] = "true"
        }

        // Set Access-Control-Allow-Methods
        headers["Access-Control-Allow-Methods"] =
            "GET, POST, PUT, DELETE, PATCH, OPTIONS"

        // Set Access-Control-Allow-Headers
        headers["Access-Control-Allow-Headers"] =
            "Content-Type, Authorization, X-CSRF-Token, X-Requested-With"

        // Set Access-Control-Max-Age
        headers["Access-Control-Max-Age"] =
            config.security.corsMaxAge.toString()

        // Set Access-Control-Expose-Headers
        headers["Access-Control-Expose-Headers"] =
            "Content-Length, X-JSON-Response-Size"
    }

    return headers
}

/**
 * CORS middleware for API routes
 */
export function corsMiddleware(request: NextRequest): NextResponse {
    const config = getConfig()
    const origin = request.headers.get("origin")

    // Handle preflight requests
    if (request.method === "OPTIONS") {
        const corsHeaders = getCorsHeaders(origin, config)
        return new NextResponse(null, {
            status: 200,
            headers: corsHeaders,
        })
    }

    // Handle regular requests
    const response = NextResponse.next()
    const corsHeaders = getCorsHeaders(origin, config)

    Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
    })

    return response
}

/**
 * Validate CORS origin
 */
export function validateCorsOrigin(
    origin: string | null,
    config: ReturnType<typeof getConfig>
): boolean {
    if (!origin) {
        return true // Allow requests without origin header
    }

    if (config.isDevelopment) {
        return true // Allow all origins in development
    }

    return config.security.corsOrigins.includes(origin)
}

/**
 * Higher-order function to add CORS headers to API route handlers
 */
export function withCors(
    handler: (req: NextRequest) => Promise<Response> | Response
) {
    return async (req: NextRequest) => {
        const config = getConfig()
        const origin = req.headers.get("origin")

        // Handle preflight requests
        if (req.method === "OPTIONS") {
            const corsHeaders = getCorsHeaders(origin, config)
            return new NextResponse(null, {
                status: 200,
                headers: corsHeaders,
            })
        }

        // Validate CORS origin
        if (!validateCorsOrigin(origin, config)) {
            return new NextResponse(
                JSON.stringify({
                    error: "CORS policy violation",
                }),
                {
                    status: 403,
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            )
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

        // Add CORS headers
        const corsHeaders = getCorsHeaders(origin, config)
        Object.entries(corsHeaders).forEach(([key, value]) => {
            nextResponse.headers.set(key, value)
        })

        return nextResponse
    }
}

/**
 * Get CORS configuration for documentation
 */
export function getCorsConfiguration(): {
    allowedOrigins: string[]
    allowedMethods: string[]
    allowedHeaders: string[]
    credentials: boolean
    maxAge: number
} {
    const config = getConfig()

    return {
        allowedOrigins: config.security.corsOrigins,
        allowedMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "X-CSRF-Token",
            "X-Requested-With",
        ],
        credentials: config.security.corsCredentials,
        maxAge: config.security.corsMaxAge,
    }
}
