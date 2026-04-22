/**
 * Rate Limiting Middleware for Express
 * Validates: Requirements 21.1-21.6
 *
 * Implements rate limiting to prevent brute force attacks:
 * - Email validation: 5 requests per minute per IP
 * - Account creation: 3 requests per hour per IP
 * - Returns 429 Too Many Requests when limit exceeded
 * - Logs rate limit violations for security monitoring
 */

import { NextFunction, Request, Response } from "express"
import { createLogger } from "../../lib/logger"

const logger = createLogger("RateLimiter")

/**
 * In-memory rate limit store
 * In production, this should use Redis for distributed rate limiting
 */
interface RateLimitRecord {
    count: number
    resetTime: number
}

const rateLimitStore = new Map<string, RateLimitRecord>()

/**
 * Rate limit configuration for different endpoints
 * Requirement 21.1-21.6
 */
const RATE_LIMIT_CONFIG = {
    "/api/auth/check-email": {
        maxRequests: 5,
        windowMs: 60 * 1000, // 1 minute
        message: "Too many email checks. Please try again later.",
    },
    "/api/auth/register": {
        maxRequests: 3,
        windowMs: 60 * 60 * 1000, // 1 hour
        message: "Too many registration attempts. Please try again later.",
    },
}

/**
 * Get client IP address from request
 * Handles X-Forwarded-For header for proxied requests
 */
function getClientIp(req: Request): string {
    const forwarded = req.headers["x-forwarded-for"]
    if (forwarded) {
        const ips = Array.isArray(forwarded)
            ? forwarded[0]
            : forwarded.split(",")[0]
        return ips.trim()
    }

    return req.headers["x-real-ip"] || req.ip || "unknown"
}

/**
 * Get rate limit key for a request
 * Combines IP address and endpoint path
 */
function getRateLimitKey(ip: string, endpoint: string): string {
    return `${ip}:${endpoint}`
}

/**
 * Check if request is within rate limit
 * Requirement 21.1-21.6
 */
function checkRateLimit(
    ip: string,
    endpoint: string,
    maxRequests: number,
    windowMs: number
): boolean {
    const key = getRateLimitKey(ip, endpoint)
    const now = Date.now()
    const record = rateLimitStore.get(key)

    // If no record exists or window has expired, create new record
    if (!record || now > record.resetTime) {
        rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
        return true
    }

    // If within limit, increment count
    if (record.count < maxRequests) {
        record.count++
        return true
    }

    // Limit exceeded
    return false
}

/**
 * Rate limiting middleware for Express
 * Requirement 21.1-21.6
 *
 * Usage:
 * ```typescript
 * app.use(rateLimiterMiddleware)
 * ```
 */
export function rateLimiterMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const clientIp = getClientIp(req)
    const endpoint = req.path

    // Check if endpoint has rate limiting configured
    const config = RATE_LIMIT_CONFIG[endpoint as keyof typeof RATE_LIMIT_CONFIG]

    if (!config) {
        // No rate limiting for this endpoint
        next()
        return
    }

    // Check rate limit
    const isAllowed = checkRateLimit(
        clientIp,
        endpoint,
        config.maxRequests,
        config.windowMs
    )

    if (!isAllowed) {
        // Rate limit exceeded
        logger.warn(`Rate limit exceeded for ${endpoint}`, {
            context: "RateLimiter",
            data: {
                method: req.method,
                pathname: endpoint,
                ip: clientIp,
                maxRequests: config.maxRequests,
                windowMs: config.windowMs,
            },
        })

        // Log security event
        try {
            const email = (req.body as Record<string, unknown>)?.email as string
            if (email) {
                logger.warn(`Rate limit exceeded for email: ${email}`, {
                    context: "RateLimiter",
                    data: {
                        email,
                        ip: clientIp,
                        endpoint,
                    },
                })
            }
        } catch {
            // Ignore errors
        }

        // Return 429 Too Many Requests
        // Requirement 21.1-21.6
        res.status(429).json({
            error: config.message,
            errorCode: "RATE_LIMIT_EXCEEDED",
            retryAfter: Math.ceil(config.windowMs / 1000),
        })
        return
    }

    next()
}

/**
 * Create a rate limiter for a specific endpoint
 * Useful for custom rate limiting rules
 */
export function createRateLimiter(
    maxRequests: number,
    windowMs: number,
    message: string = "Too many requests. Please try again later."
) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const clientIp = getClientIp(req)
        const endpoint = req.path

        const isAllowed = checkRateLimit(
            clientIp,
            endpoint,
            maxRequests,
            windowMs
        )

        if (!isAllowed) {
            logger.warn(`Rate limit exceeded for ${endpoint}`, {
                context: "RateLimiter",
                data: {
                    method: req.method,
                    pathname: endpoint,
                    ip: clientIp,
                    maxRequests,
                    windowMs,
                },
            })

            res.status(429).json({
                error: message,
                errorCode: "RATE_LIMIT_EXCEEDED",
                retryAfter: Math.ceil(windowMs / 1000),
            })
            return
        }

        next()
    }
}

/**
 * Clean up expired rate limit records
 * Should be called periodically (e.g., every 5 minutes)
 */
export function cleanupExpiredRecords(): number {
    const now = Date.now()
    let deletedCount = 0

    for (const [key, record] of rateLimitStore.entries()) {
        if (now > record.resetTime) {
            rateLimitStore.delete(key)
            deletedCount++
        }
    }

    if (deletedCount > 0) {
        logger.debug(`Cleaned up ${deletedCount} expired rate limit records`, {
            context: "RateLimiter",
        })
    }

    return deletedCount
}

/**
 * Start periodic cleanup of expired records
 * Requirement 21.1-21.6
 */
export function startCleanupInterval(
    intervalMs: number = 5 * 60 * 1000
): NodeJS.Timer {
    return setInterval(() => {
        cleanupExpiredRecords()
    }, intervalMs)
}

/**
 * Get rate limit status for a request
 * Useful for debugging and monitoring
 */
export function getRateLimitStatus(
    ip: string,
    endpoint: string
): { remaining: number; resetTime: number } | null {
    const key = getRateLimitKey(ip, endpoint)
    const record = rateLimitStore.get(key)
    const config = RATE_LIMIT_CONFIG[endpoint as keyof typeof RATE_LIMIT_CONFIG]

    if (!record || !config) {
        return null
    }

    const now = Date.now()
    if (now > record.resetTime) {
        return null
    }

    return {
        remaining: Math.max(0, config.maxRequests - record.count),
        resetTime: record.resetTime,
    }
}
