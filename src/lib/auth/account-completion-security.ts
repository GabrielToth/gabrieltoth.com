/**
 * Account Completion Security Hardening Module
 *
 * Provides CSRF protection, input sanitization, and security validation
 * for the account completion flow.
 *
 * Validates: Phase 9 - Security Hardening
 */

import { logger } from "@/lib/logger"

/**
 * CSRF token storage (in production, use secure session storage)
 */
const csrfTokens = new Map<string, { token: string; timestamp: number }>()
const CSRF_TOKEN_TTL = 1 * 60 * 60 * 1000 // 1 hour in milliseconds

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
    const token = Buffer.from(Math.random().toString()).toString("base64")
    csrfTokens.set(token, {
        token,
        timestamp: Date.now(),
    })
    return token
}

/**
 * Verify a CSRF token
 */
export function verifyCSRFToken(token: string): boolean {
    const stored = csrfTokens.get(token)
    if (!stored) {
        logger.warn("CSRF token not found", {
            context: "AccountCompletionSecurity",
        })
        return false
    }

    const isExpired = Date.now() - stored.timestamp > CSRF_TOKEN_TTL
    if (isExpired) {
        csrfTokens.delete(token)
        logger.warn("CSRF token expired", {
            context: "AccountCompletionSecurity",
        })
        return false
    }

    // Invalidate token after use
    csrfTokens.delete(token)
    return true
}

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
    if (typeof input !== "string") {
        return ""
    }

    // Remove any HTML/script tags using regex
    const sanitized = input
        .replace(/<[^>]*>/g, "") // Remove HTML tags
        .replace(/javascript:/gi, "") // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, "") // Remove event handlers

    // Additional sanitization: remove control characters
    return sanitized
        .replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
        .trim()
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
    const sanitized = sanitizeInput(email)
    // Email should only contain alphanumeric, dots, hyphens, underscores, and @
    return sanitized.toLowerCase().replace(/[^a-z0-9._@-]/g, "")
}

/**
 * Sanitize name field
 */
export function sanitizeName(name: string): string {
    const sanitized = sanitizeInput(name)
    // Name can contain letters, spaces, hyphens, and apostrophes
    return sanitized.replace(/[^a-zA-Z\s\-']/g, "").trim()
}

/**
 * Sanitize phone number
 */
export function sanitizePhoneNumber(phone: string): string {
    const sanitized = sanitizeInput(phone)
    // Phone should only contain digits, +, -, (, ), and spaces
    return sanitized.replace(/[^0-9+\-() ]/g, "").trim()
}

/**
 * Validate input length to prevent buffer overflow attacks
 */
export function validateInputLength(
    input: string,
    maxLength: number,
    fieldName: string
): { valid: boolean; error?: string } {
    if (!input || input.length === 0) {
        return { valid: false, error: `${fieldName} is required` }
    }

    if (input.length > maxLength) {
        return {
            valid: false,
            error: `${fieldName} must not exceed ${maxLength} characters`,
        }
    }

    return { valid: true }
}

/**
 * Prevent SQL injection by validating input patterns
 */
export function validateSQLInjectionPattern(input: string): boolean {
    // Check for common SQL injection patterns
    const sqlInjectionPatterns = [
        /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
        /(-{2}|\/\*|\*\/|;)/,
        /(xp_|sp_)/i,
        /(\bOR\b.*=)/i, // OR 1=1 type patterns
    ]

    for (const pattern of sqlInjectionPatterns) {
        if (pattern.test(input)) {
            logger.warn("Potential SQL injection detected", {
                context: "AccountCompletionSecurity",
                pattern: pattern.toString(),
            })
            return false
        }
    }

    return true
}

/**
 * Validate against common XSS patterns
 */
export function validateXSSPattern(input: string): boolean {
    // Check for common XSS patterns
    const xssPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe/gi,
        /<object/gi,
        /<embed/gi,
    ]

    for (const pattern of xssPatterns) {
        if (pattern.test(input)) {
            logger.warn("Potential XSS attack detected", {
                context: "AccountCompletionSecurity",
                pattern: pattern.toString(),
            })
            return false
        }
    }

    return true
}

/**
 * Comprehensive input validation
 */
export function validateSecurityInput(
    input: string,
    fieldName: string,
    maxLength: number = 255
): { valid: boolean; error?: string } {
    // Check length
    const lengthCheck = validateInputLength(input, maxLength, fieldName)
    if (!lengthCheck.valid) {
        return lengthCheck
    }

    // Check for SQL injection patterns
    if (!validateSQLInjectionPattern(input)) {
        return {
            valid: false,
            error: `${fieldName} contains invalid characters`,
        }
    }

    // Check for XSS patterns
    if (!validateXSSPattern(input)) {
        return {
            valid: false,
            error: `${fieldName} contains invalid characters`,
        }
    }

    return { valid: true }
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
    maxAttempts: number
    windowMs: number // milliseconds
    blockDurationMs: number // milliseconds
}

/**
 * Default rate limiting configuration for account completion
 */
export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
    maxAttempts: 5, // 5 attempts
    windowMs: 60 * 60 * 1000, // per hour
    blockDurationMs: 15 * 60 * 1000, // block for 15 minutes
}

/**
 * Track failed attempts for rate limiting
 */
const failedAttempts = new Map<
    string,
    { count: number; firstAttempt: number; blockedUntil?: number }
>()

/**
 * Check if IP is rate limited
 */
export function isRateLimited(
    ip: string,
    config: RateLimitConfig = DEFAULT_RATE_LIMIT_CONFIG
): boolean {
    const attempt = failedAttempts.get(ip)
    if (!attempt) {
        return false
    }

    // Check if currently blocked
    if (attempt.blockedUntil && Date.now() < attempt.blockedUntil) {
        return true
    }

    // Check if window has expired
    if (Date.now() - attempt.firstAttempt > config.windowMs) {
        failedAttempts.delete(ip)
        return false
    }

    // Check if max attempts exceeded
    return attempt.count >= config.maxAttempts
}

/**
 * Record a failed attempt
 */
export function recordFailedAttempt(
    ip: string,
    config: RateLimitConfig = DEFAULT_RATE_LIMIT_CONFIG
): void {
    const attempt = failedAttempts.get(ip)

    if (!attempt) {
        failedAttempts.set(ip, {
            count: 1,
            firstAttempt: Date.now(),
        })
        return
    }

    // Check if window has expired
    if (Date.now() - attempt.firstAttempt > config.windowMs) {
        failedAttempts.set(ip, {
            count: 1,
            firstAttempt: Date.now(),
        })
        return
    }

    // Increment count
    attempt.count++

    // Block if max attempts exceeded
    if (attempt.count >= config.maxAttempts) {
        attempt.blockedUntil = Date.now() + config.blockDurationMs
        logger.warn("IP rate limited", {
            context: "AccountCompletionSecurity",
            ip,
            attempts: attempt.count,
        })
    }
}

/**
 * Clear failed attempts for IP
 */
export function clearFailedAttempts(ip: string): void {
    failedAttempts.delete(ip)
}

/**
 * Get rate limit status for IP
 */
export function getRateLimitStatus(
    ip: string,
    config: RateLimitConfig = DEFAULT_RATE_LIMIT_CONFIG
): {
    isLimited: boolean
    attempts: number
    remainingAttempts: number
    blockedUntil?: number
} {
    const attempt = failedAttempts.get(ip)

    if (!attempt) {
        return {
            isLimited: false,
            attempts: 0,
            remainingAttempts: config.maxAttempts,
        }
    }

    return {
        isLimited: isRateLimited(ip, config),
        attempts: attempt.count,
        remainingAttempts: Math.max(0, config.maxAttempts - attempt.count),
        blockedUntil: attempt.blockedUntil,
    }
}

/**
 * Cleanup expired rate limit entries
 */
export function cleanupExpiredRateLimitEntries(
    config: RateLimitConfig = DEFAULT_RATE_LIMIT_CONFIG
): void {
    const now = Date.now()
    let cleaned = 0

    for (const [ip, attempt] of failedAttempts.entries()) {
        // Remove if window expired and not currently blocked
        if (
            now - attempt.firstAttempt > config.windowMs &&
            (!attempt.blockedUntil || now > attempt.blockedUntil)
        ) {
            failedAttempts.delete(ip)
            cleaned++
        }
    }

    if (cleaned > 0) {
        logger.debug("Rate limit cleanup completed", {
            context: "AccountCompletionSecurity",
            cleaned,
        })
    }
}

/**
 * Periodic rate limit cleanup (run every 5 minutes)
 */
export function startRateLimitCleanupInterval(
    config: RateLimitConfig = DEFAULT_RATE_LIMIT_CONFIG
): NodeJS.Timeout {
    return setInterval(
        () => {
            cleanupExpiredRateLimitEntries(config)
        },
        5 * 60 * 1000
    ) // 5 minutes
}
