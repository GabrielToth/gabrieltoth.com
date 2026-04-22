/**
 * Security Headers Middleware for Express
 * Validates: Requirements 20.1-20.4
 *
 * Implements comprehensive security headers to protect against common web vulnerabilities:
 * - HSTS (Strict-Transport-Security): Enforces HTTPS
 * - CSP (Content-Security-Policy): Prevents XSS attacks
 * - X-Content-Type-Options: Prevents MIME type sniffing
 * - X-Frame-Options: Prevents clickjacking
 * - HTTP to HTTPS redirect
 */

import { NextFunction, Request, Response } from "express"
import { createLogger } from "../../lib/logger"

const logger = createLogger("SecurityHeaders")

/**
 * Security headers configuration
 * Requirement 20.1-20.4
 */
const SECURITY_HEADERS = {
    // Strict-Transport-Security - enforces HTTPS
    // max-age: 1 year (31536000 seconds)
    // includeSubDomains: Apply to all subdomains
    // preload: Allow inclusion in HSTS preload list
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",

    // Content-Security-Policy - prevents XSS attacks
    "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",

    // X-Frame-Options - prevents clickjacking
    "X-Frame-Options": "DENY",

    // X-Content-Type-Options - prevents MIME type sniffing
    "X-Content-Type-Options": "nosniff",

    // X-XSS-Protection - legacy XSS protection (for older browsers)
    "X-XSS-Protection": "1; mode=block",

    // Referrer-Policy - controls referrer information
    "Referrer-Policy": "strict-origin-when-cross-origin",

    // Permissions-Policy - controls browser features
    "Permissions-Policy":
        "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",

    // X-Permitted-Cross-Domain-Policies - prevents cross-domain policy abuse
    "X-Permitted-Cross-Domain-Policies": "none",
}

/**
 * Middleware to add security headers to all responses
 * Requirement 20.1-20.4
 *
 * Usage:
 * ```typescript
 * app.use(securityHeadersMiddleware)
 * ```
 */
export function securityHeadersMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    // Apply security headers to response
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        res.setHeader(key, value)
    })

    logger.debug(`Security headers applied to ${req.path}`, {
        context: "SecurityHeaders",
        data: {
            method: req.method,
            pathname: req.path,
        },
    })

    next()
}

/**
 * Middleware to enforce HTTPS and redirect HTTP to HTTPS
 * Requirement 20.1-20.4
 *
 * Usage:
 * ```typescript
 * app.use(httpsRedirectMiddleware)
 * ```
 */
export function httpsRedirectMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    // Check if request is over HTTPS
    // In production, check x-forwarded-proto header (for proxied requests)
    const isHttps =
        req.protocol === "https" || req.headers["x-forwarded-proto"] === "https"

    if (!isHttps && process.env.NODE_ENV === "production") {
        // Redirect to HTTPS
        const url = `https://${req.headers.host}${req.originalUrl}`

        logger.info(`Redirecting HTTP to HTTPS: ${req.originalUrl}`, {
            context: "SecurityHeaders",
            data: {
                method: req.method,
                pathname: req.path,
                redirectUrl: url,
            },
        })

        res.redirect(301, url)
        return
    }

    next()
}

/**
 * Get security headers as an object (useful for API routes)
 */
export function getSecurityHeaders(): Record<string, string> {
    return SECURITY_HEADERS
}
