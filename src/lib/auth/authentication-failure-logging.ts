/**
 * Authentication Failure Logging Module
 *
 * Implements comprehensive logging of authentication failures for security monitoring
 * and compliance. Logs failed login and registration attempts with:
 * - Timestamp (ISO 8601 format)
 * - User identifier (email)
 * - Failure reason (generic, no sensitive details)
 * - Client IP address
 * - User agent
 * - Attempt count (for rate limiting context)
 *
 * Validates: Requirements 14.1, 14.2, 14.5
 */

import { db } from "@/lib/db/index"
import { logger } from "@/lib/logger"

const { query, queryMany, queryOne } = db

/**
 * Types of authentication failures
 */
export enum AuthFailureType {
    INVALID_CREDENTIALS = "invalid_credentials",
    INVALID_EMAIL = "invalid_email",
    INVALID_PASSWORD = "invalid_password",
    USER_NOT_FOUND = "user_not_found",
    EMAIL_NOT_VERIFIED = "email_not_verified",
    ACCOUNT_LOCKED = "account_locked",
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded",
    CAPTCHA_FAILED = "captcha_failed",
    CSRF_FAILED = "csrf_failed",
    INVALID_INPUT = "invalid_input",
    DATABASE_ERROR = "database_error",
    INTERNAL_ERROR = "internal_error",
}

/**
 * Authentication failure log entry
 */
export interface AuthFailureLogEntry {
    id?: string
    email: string
    failureType: AuthFailureType
    failureReason: string
    ipAddress: string
    userAgent?: string
    attemptCount?: number
    timestamp?: Date
    details?: Record<string, unknown>
}

/**
 * Log an authentication failure
 *
 * Requirement 14.1: Log failed login attempts with timestamp and user identifier
 * Requirement 14.2: Log rate limit triggers with attempt count
 * Requirement 14.5: Logs SHALL NOT contain plaintext passwords, pepper values, or sensitive data
 *
 * @param entry - The failure log entry
 * @returns Promise that resolves when logging completes (or fails silently)
 *
 * @example
 * ```typescript
 * // Log a failed login attempt
 * await logAuthenticationFailure({
 *   email: "user@example.com",
 *   failureType: AuthFailureType.INVALID_CREDENTIALS,
 *   failureReason: "Invalid email or password",
 *   ipAddress: "192.168.1.1",
 *   userAgent: "Mozilla/5.0...",
 *   attemptCount: 3,
 * })
 * ```
 */
export async function logAuthenticationFailure(
    entry: AuthFailureLogEntry
): Promise<void> {
    try {
        const timestamp = entry.timestamp || new Date()

        // Requirement 14.1: Log with timestamp and user identifier
        // Requirement 14.2: Include attempt count for rate limiting context
        // Requirement 14.5: Exclude sensitive data (passwords, pepper, etc.)
        await query(
            `INSERT INTO audit_logs (
                event_type,
                email,
                ip_address,
                user_agent,
                attempt_count,
                error_code,
                error_message,
                details,
                timestamp
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
                "auth_failure", // event_type
                entry.email,
                entry.ipAddress,
                entry.userAgent || null,
                entry.attemptCount || null,
                entry.failureType, // error_code
                entry.failureReason, // error_message (generic, no sensitive data)
                entry.details ? JSON.stringify(entry.details) : null,
                timestamp,
            ]
        )

        logger.debug("Authentication failure logged", {
            context: "AuthFailureLogging",
            data: {
                email: entry.email,
                failureType: entry.failureType,
                ipAddress: entry.ipAddress,
                timestamp: timestamp.toISOString(),
            },
        })
    } catch (error) {
        // Log the error but don't throw - audit logging should not block main flow
        logger.error("Failed to log authentication failure", {
            context: "AuthFailureLogging",
            error: error as Error,
            data: {
                email: entry.email,
                failureType: entry.failureType,
            },
        })
    }
}

/**
 * Log a failed login attempt
 *
 * Convenience function for login failures.
 * Requirement 14.1: Log with timestamp and user identifier
 *
 * @param email - The email address of the login attempt
 * @param ipAddress - The client IP address
 * @param failureReason - Generic failure reason (no password details)
 * @param userAgent - Optional user agent string
 * @param attemptCount - Optional attempt count for rate limiting context
 * @returns Promise that resolves when logging completes (or fails silently)
 *
 * @example
 * ```typescript
 * // Log a failed login attempt
 * await logFailedLoginAttempt(
 *   "user@example.com",
 *   "192.168.1.1",
 *   "Invalid email or password",
 *   "Mozilla/5.0...",
 *   3
 * )
 * ```
 */
export async function logFailedLoginAttempt(
    email: string,
    ipAddress: string,
    failureReason: string,
    userAgent?: string,
    attemptCount?: number
): Promise<void> {
    return logAuthenticationFailure({
        email,
        failureType: AuthFailureType.INVALID_CREDENTIALS,
        failureReason,
        ipAddress,
        userAgent,
        attemptCount,
        timestamp: new Date(),
    })
}

/**
 * Log a failed registration attempt
 *
 * Convenience function for registration failures.
 *
 * @param email - The email address of the registration attempt
 * @param ipAddress - The client IP address
 * @param failureReason - Generic failure reason
 * @param userAgent - Optional user agent string
 * @returns Promise that resolves when logging completes (or fails silently)
 */
export async function logFailedRegistrationAttempt(
    email: string,
    ipAddress: string,
    failureReason: string,
    userAgent?: string
): Promise<void> {
    return logAuthenticationFailure({
        email,
        failureType: AuthFailureType.INVALID_INPUT,
        failureReason,
        ipAddress,
        userAgent,
        timestamp: new Date(),
    })
}

/**
 * Log a rate limit trigger
 *
 * Requirement 14.2: Log rate limit triggers with attempt count
 *
 * @param email - The email address that triggered rate limiting
 * @param ipAddress - The client IP address
 * @param attemptCount - The number of failed attempts
 * @param userAgent - Optional user agent string
 * @returns Promise that resolves when logging completes (or fails silently)
 *
 * @example
 * ```typescript
 * // Log rate limit trigger
 * await logRateLimitTrigger(
 *   "user@example.com",
 *   "192.168.1.1",
 *   5,
 *   "Mozilla/5.0..."
 * )
 * ```
 */
export async function logRateLimitTrigger(
    email: string,
    ipAddress: string,
    attemptCount: number,
    userAgent?: string
): Promise<void> {
    return logAuthenticationFailure({
        email,
        failureType: AuthFailureType.RATE_LIMIT_EXCEEDED,
        failureReason: `Rate limit exceeded after ${attemptCount} failed attempts`,
        ipAddress,
        userAgent,
        attemptCount,
        timestamp: new Date(),
        details: {
            event: "rate_limit_triggered",
            threshold: 5,
            window_minutes: 15,
        },
    })
}

/**
 * Log a CAPTCHA verification failure
 *
 * @param email - The email address (if known)
 * @param ipAddress - The client IP address
 * @param failureReason - Reason for CAPTCHA failure
 * @param userAgent - Optional user agent string
 * @returns Promise that resolves when logging completes (or fails silently)
 */
export async function logCAPTCHAFailure(
    email: string | undefined,
    ipAddress: string,
    failureReason: string,
    userAgent?: string
): Promise<void> {
    return logAuthenticationFailure({
        email: email || "unknown",
        failureType: AuthFailureType.CAPTCHA_FAILED,
        failureReason,
        ipAddress,
        userAgent,
        timestamp: new Date(),
        details: {
            event: "captcha_verification_failed",
        },
    })
}

/**
 * Log a CSRF token validation failure
 *
 * @param email - The email address (if known)
 * @param ipAddress - The client IP address
 * @param failureReason - Reason for CSRF failure
 * @param userAgent - Optional user agent string
 * @returns Promise that resolves when logging completes (or fails silently)
 */
export async function logCSRFFailure(
    email: string | undefined,
    ipAddress: string,
    failureReason: string,
    userAgent?: string
): Promise<void> {
    return logAuthenticationFailure({
        email: email || "unknown",
        failureType: AuthFailureType.CSRF_FAILED,
        failureReason,
        ipAddress,
        userAgent,
        timestamp: new Date(),
        details: {
            event: "csrf_validation_failed",
        },
    })
}

/**
 * Log an input validation failure
 *
 * @param email - The email address (if known)
 * @param ipAddress - The client IP address
 * @param failureReason - Reason for validation failure
 * @param userAgent - Optional user agent string
 * @returns Promise that resolves when logging completes (or fails silently)
 */
export async function logInputValidationFailure(
    email: string | undefined,
    ipAddress: string,
    failureReason: string,
    userAgent?: string
): Promise<void> {
    return logAuthenticationFailure({
        email: email || "unknown",
        failureType: AuthFailureType.INVALID_INPUT,
        failureReason,
        ipAddress,
        userAgent,
        timestamp: new Date(),
        details: {
            event: "input_validation_failed",
        },
    })
}

/**
 * Get recent authentication failures for a specific email
 *
 * Useful for security monitoring and detecting attack patterns.
 *
 * @param email - The email address to query
 * @param hoursBack - Number of hours to look back (default: 24)
 * @param limit - Maximum number of records to return (default: 100)
 * @returns Array of authentication failure records
 */
export async function getRecentAuthFailuresForEmail(
    email: string,
    hoursBack: number = 24,
    limit: number = 100
): Promise<
    Array<{
        id: string
        event_type: string
        email: string
        ip_address: string
        error_code: string
        error_message: string
        attempt_count: number | null
        timestamp: string
    }>
> {
    try {
        const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000)

        return queryMany<{
            id: string
            event_type: string
            email: string
            ip_address: string
            error_code: string
            error_message: string
            attempt_count: number | null
            timestamp: string
        }>(
            `SELECT id, event_type, email, ip_address, error_code, error_message, attempt_count, timestamp
             FROM audit_logs
             WHERE email = $1
             AND event_type = 'auth_failure'
             AND timestamp > $2
             ORDER BY timestamp DESC
             LIMIT $3`,
            [email, cutoffTime, limit]
        )
    } catch (error) {
        logger.error("Failed to get recent auth failures for email", {
            context: "AuthFailureLogging",
            error: error as Error,
            data: { email },
        })
        return []
    }
}

/**
 * Get recent authentication failures for a specific IP address
 *
 * Useful for detecting distributed attacks or compromised networks.
 *
 * @param ipAddress - The IP address to query
 * @param hoursBack - Number of hours to look back (default: 24)
 * @param limit - Maximum number of records to return (default: 100)
 * @returns Array of authentication failure records
 */
export async function getRecentAuthFailuresForIP(
    ipAddress: string,
    hoursBack: number = 24,
    limit: number = 100
): Promise<
    Array<{
        id: string
        event_type: string
        email: string
        ip_address: string
        error_code: string
        error_message: string
        attempt_count: number | null
        timestamp: string
    }>
> {
    try {
        const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000)

        return queryMany<{
            id: string
            event_type: string
            email: string
            ip_address: string
            error_code: string
            error_message: string
            attempt_count: number | null
            timestamp: string
        }>(
            `SELECT id, event_type, email, ip_address, error_code, error_message, attempt_count, timestamp
             FROM audit_logs
             WHERE ip_address = $1
             AND event_type = 'auth_failure'
             AND timestamp > $2
             ORDER BY timestamp DESC
             LIMIT $3`,
            [ipAddress, cutoffTime, limit]
        )
    } catch (error) {
        logger.error("Failed to get recent auth failures for IP", {
            context: "AuthFailureLogging",
            error: error as Error,
            data: { ipAddress },
        })
        return []
    }
}

/**
 * Get authentication failure statistics for monitoring
 *
 * @param hoursBack - Number of hours to look back (default: 24)
 * @returns Statistics about authentication failures
 */
export async function getAuthFailureStatistics(
    hoursBack: number = 24
): Promise<{
    totalFailures: number
    uniqueEmails: number
    uniqueIPs: number
    failuresByType: Record<string, number>
    topFailingEmails: Array<{ email: string; count: number }>
    topFailingIPs: Array<{ ip_address: string; count: number }>
}> {
    try {
        const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000)

        const totalFailures = Number(
            (await queryOne<{ count: string }>(
                `SELECT COUNT(*) as count FROM audit_logs
             WHERE event_type = 'auth_failure' AND timestamp > $1`,
                [cutoffTime]
            ))?.count || 0
        )

        const uniqueEmails = Number(
            (await queryOne<{ count: string }>(
                `SELECT COUNT(DISTINCT email) as count FROM audit_logs
             WHERE event_type = 'auth_failure' AND timestamp > $1`,
                [cutoffTime]
            ))?.count || 0
        )

        const uniqueIPs = Number(
            (await queryOne<{ count: string }>(
                `SELECT COUNT(DISTINCT ip_address) as count FROM audit_logs
             WHERE event_type = 'auth_failure' AND timestamp > $1`,
                [cutoffTime]
            ))?.count || 0
        )

        const typeRows = await queryMany<{ error_code: string; count: string }>(
            `SELECT error_code, COUNT(*) as count FROM audit_logs
             WHERE event_type = 'auth_failure' AND timestamp > $1
             GROUP BY error_code`,
            [cutoffTime]
        )
        const failuresByType: Record<string, number> = {}
        typeRows.forEach(row => {
            failuresByType[row.error_code] = Number(row.count)
        })

        const topFailingEmails = await queryMany<{ email: string; count: string }>(
            `SELECT email, COUNT(*) as count FROM audit_logs
             WHERE event_type = 'auth_failure' AND timestamp > $1
             GROUP BY email
             ORDER BY count DESC
             LIMIT 10`,
            [cutoffTime]
        )

        const topFailingIPs = await queryMany<{ ip_address: string; count: string }>(
            `SELECT ip_address, COUNT(*) as count FROM audit_logs
             WHERE event_type = 'auth_failure' AND timestamp > $1
             GROUP BY ip_address
             ORDER BY count DESC
             LIMIT 10`,
            [cutoffTime]
        )

        return {
            totalFailures,
            uniqueEmails,
            uniqueIPs,
            failuresByType,
            topFailingEmails: topFailingEmails.map(row => ({
                email: row.email,
                count: Number(row.count),
            })),
            topFailingIPs: topFailingIPs.map(row => ({
                ip_address: row.ip_address,
                count: Number(row.count),
            })),
        }
    } catch (error) {
        logger.error("Failed to get auth failure statistics", {
            context: "AuthFailureLogging",
            error: error as Error,
        })
        return {
            totalFailures: 0,
            uniqueEmails: 0,
            uniqueIPs: 0,
            failuresByType: {},
            topFailingEmails: [],
            topFailingIPs: [],
        }
    }
}
