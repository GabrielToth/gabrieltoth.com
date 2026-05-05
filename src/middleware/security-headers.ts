/**
 * Security Headers Middleware for Login Endpoint
 * Implements comprehensive security headers to protect against common web vulnerabilities
 *
 * Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8
 *
 * Security headers implemented:
 * - Content-Security-Policy: Prevents XSS attacks
 * - X-Content-Type-Options: Prevents MIME type sniffing
 * - X-Frame-Options: Prevents clickjacking
 * - Strict-Transport-Security: Enforces HTTPS (production only)
 * - X-XSS-Protection: Legacy browser support
 * - Referrer-Policy: Controls referrer information
 * - Cache-Control: Prevents caching of sensitive responses
 * - Set-Cookie: Secure, HttpOnly, SameSite flags
 */

import { getConfig } from "@/config/environment"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

/**
 * Security headers configuration
 */
function getSecurityHeaders(isProduction: boolean): Record<string, string> {
    const headers: Record<string, string> = {
        // Content-Security-Policy - prevents XSS attacks (Requirement 12.1)
        "Content-Security-Policy":
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: https:; " +
            "font-src 'self' data:; " +
            "connect-src 'self' https:; " +
            "frame-ancestors 'none'; " +
            "base-uri 'self'; " +
            "form-action 'self'",

        // X-Content-Type-Options - prevents MIME type sniffing (Requirement 12.2)
        "X-Content-Type-Options": "nosniff",

        // X-Frame-Options - prevents clickjacking (Requirement 12.3)
        "X-Frame-Options": "DENY",

        // X-XSS-Protection - legacy browser support (Requirement 12.5)
        "X-XSS-Protection": "1; mode=block",

        // Referrer-Policy - controls referrer information (Requirement 12.6)
        "Referrer-Policy": "strict-origin-when-cross-origin",

        // Cache-Control - prevents caching of sensitive responses (Requirement 12.7)
        "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",

        // Permissions-Policy - controls browser features
        "Permissions-Policy":
            "geolocation=(), microphone=(), camera=(), payment=(), usb=(), " +
            "magnetometer=(), gyroscope=(), accelerometer=()",

        // X-Permitted-Cross-Domain-Policies - prevents cross-domain policy abuse
        "X-Permitted-Cross-Domain-Policies": "none",
    }

    // Strict-Transport-Security - enforces HTTPS (Requirement 12.4, production only)
    if (isProduction) {
        headers["Strict-Transport-Security"] =
            "max-age=31536000; includeSubDomains; preload"
    }

    return headers
}

/**
 * Apply security headers to a response
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
    const config = getConfig()
    const headers = getSecurityHeaders(config.isProduction)

    Object.entries(headers).forEach(([key, value]) => {
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
export function getSecurityHeadersObject(): Record<string, string> {
    const config = getConfig()
    return getSecurityHeaders(config.isProduction)
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

/**
 * Set secure cookie flags based on environment
 */
export function getSecureCookieOptions(
    isProduction: boolean
): Record<string, unknown> {
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: "strict",
        path: "/",
    }
}

/**
 * Set secure cookie for session token (1 hour expiration)
 */
export function getSessionCookieOptions(
    isProduction: boolean
): Record<string, unknown> {
    return {
        ...getSecureCookieOptions(isProduction),
        maxAge: 60 * 60, // 1 hour
    }
}

/**
 * Set secure cookie for Remember Me token (30 days expiration)
 */
export function getRememberMeCookieOptions(
    isProduction: boolean
): Record<string, unknown> {
    return {
        ...getSecureCookieOptions(isProduction),
        maxAge: 30 * 24 * 60 * 60, // 30 days
    }
}

/**
 * Set secure cookie for CSRF token
 */
export function getCsrfCookieOptions(
    isProduction: boolean
): Record<string, unknown> {
    return {
        ...getSecureCookieOptions(isProduction),
        maxAge: 60 * 60, // 1 hour
    }
}
