/**
 * Security Headers Middleware
 * Implements comprehensive security headers to protect against common web vulnerabilities
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

/**
 * Security headers configuration
 */
const SECURITY_HEADERS = {
    // Content Security Policy - prevents XSS attacks
    "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",

    // X-Frame-Options - prevents clickjacking
    "X-Frame-Options": "DENY",

    // X-Content-Type-Options - prevents MIME type sniffing
    "X-Content-Type-Options": "nosniff",

    // Strict-Transport-Security - enforces HTTPS
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",

    // Referrer-Policy - controls referrer information
    "Referrer-Policy": "strict-origin-when-cross-origin",

    // Permissions-Policy - controls browser features
    "Permissions-Policy":
        "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",

    // X-Permitted-Cross-Domain-Policies - prevents cross-domain policy abuse
    "X-Permitted-Cross-Domain-Policies": "none",

    // X-XSS-Protection - legacy XSS protection (for older browsers)
    "X-XSS-Protection": "1; mode=block",
}

/**
 * Apply security headers to a response
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value)
    })

    return response
}

/**
 * Middleware to add security headers to all responses
 */
export function securityHeadersMiddleware(request: NextRequest): NextResponse {
    // Create a response
    let response = NextResponse.next()

    // Apply security headers
    response = applySecurityHeaders(response)

    return response
}

/**
 * Get security headers as an object (useful for API routes)
 */
export function getSecurityHeaders(): Record<string, string> {
    return SECURITY_HEADERS
}

/**
 * Middleware for API routes to add security headers
 */
export function withSecurityHeaders(
    handler: (req: NextRequest) => Promise<Response> | Response
) {
    return async (req: NextRequest) => {
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

        // Apply security headers
        return applySecurityHeaders(nextResponse)
    }
}

/**
 * Get CSP header for inline scripts (if needed)
 * This should be used sparingly and only when absolutely necessary
 */
export function getCspNonce(): string {
    // Generate a random nonce for inline scripts
    return Buffer.from(Math.random().toString()).toString("base64")
}

/**
 * Validate that a request has the correct origin
 * Useful for CSRF protection
 */
export function validateOrigin(
    request: NextRequest,
    allowedOrigins: string[]
): boolean {
    const origin = request.headers.get("origin")

    if (!origin) {
        return true // Allow requests without origin header (e.g., same-site requests)
    }

    return allowedOrigins.includes(origin)
}

/**
 * Get the client IP address from request
 * Handles X-Forwarded-For header for proxied requests
 */
export function getClientIp(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for")
    if (forwarded) {
        return forwarded.split(",")[0].trim()
    }

    return request.headers.get("x-real-ip") || "unknown"
}
