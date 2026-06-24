/**
 * Authentication Audit Logging Utilities
 *
 * Provides non-blocking audit logging for authentication events including logout.
 * Implements Requirements 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { query } from "@/lib/db"
import { logger } from "@/lib/logger"

/**
 * Audit log entry for authentication events
 */
export interface AuthAuditLogEntry {
    event_type: string
    user_id: string
    ip_address: string
    timestamp?: Date
    user_agent?: string
    details?: Record<string, unknown>
}

/**
 * Create an audit log entry in the database
 *
 * This function is non-blocking and will not throw errors to the caller.
 * If audit logging fails, the error is logged but the main flow continues.
 *
 * @param entry - The audit log entry to create
 * @returns Promise that resolves when logging completes (or fails silently)
 *
 * @example
 * ```typescript
 * // Non-blocking audit log creation
 * createAuditLog({
 *   event_type: "LOGOUT",
 *   user_id: "123e4567-e89b-12d3-a456-426614174000",
 *   ip_address: "192.168.1.1",
 *   user_agent: "Mozilla/5.0..."
 * }).catch(error => {
 *   // Error is already logged, this is just for completeness
 * })
 * ```
 */
export async function createAuditLog(entry: AuthAuditLogEntry): Promise<void> {
    try {
        const timestamp = entry.timestamp || new Date()

        await query(
            `INSERT INTO audit_logs (event_type, user_id, ip_address, user_agent, details, timestamp)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                entry.event_type,
                entry.user_id,
                entry.ip_address,
                entry.user_agent || null,
                entry.details ? JSON.stringify(entry.details) : null,
                timestamp,
            ]
        )

        logger.debug("Audit log created", {
            context: "Auth",
            data: {
                event_type: entry.event_type,
                user_id: entry.user_id,
                ip_address: entry.ip_address,
            },
        })
    } catch (error) {
        // Log the error but don't throw - audit logging should not block main flow
        logger.error("Failed to create audit log", {
            context: "Auth",
            error: error as Error,
            data: {
                event_type: entry.event_type,
                user_id: entry.user_id,
            },
        })
    }
}

/**
 * Create a logout audit log entry
 *
 * Convenience function specifically for logout events.
 * This is non-blocking and will not throw errors.
 *
 * @param userId - The ID of the user logging out
 * @param ipAddress - The IP address of the client
 * @param userAgent - Optional user agent string
 * @returns Promise that resolves when logging completes (or fails silently)
 *
 * @example
 * ```typescript
 * // In logout route handler
 * logLogoutEvent(session.user_id, clientIp, userAgent).catch(() => {
 *   // Error already logged, continue with logout
 * })
 * ```
 */
export async function logLogoutEvent(
    userId: string,
    ipAddress: string,
    userAgent?: string
): Promise<void> {
    return createAuditLog({
        event_type: "LOGOUT",
        user_id: userId,
        ip_address: ipAddress,
        user_agent: userAgent,
        timestamp: new Date(),
    })
}

/**
 * Create a login audit log entry
 *
 * Convenience function for login events.
 * This is non-blocking and will not throw errors.
 *
 * @param userId - The ID of the user logging in
 * @param ipAddress - The IP address of the client
 * @param userAgent - Optional user agent string
 * @param details - Optional additional details
 * @returns Promise that resolves when logging completes (or fails silently)
 */
export async function logLoginEvent(
    userId: string,
    ipAddress: string,
    userAgent?: string,
    details?: Record<string, unknown>
): Promise<void> {
    return createAuditLog({
        event_type: "LOGIN",
        user_id: userId,
        ip_address: ipAddress,
        user_agent: userAgent,
        details,
        timestamp: new Date(),
    })
}

/**
 * Create a failed login attempt audit log entry
 *
 * Logs failed authentication attempts for security monitoring.
 * This is non-blocking and will not throw errors.
 *
 * @param userId - The ID of the user (if known)
 * @param ipAddress - The IP address of the client
 * @param reason - The reason for failure
 * @param userAgent - Optional user agent string
 * @returns Promise that resolves when logging completes (or fails silently)
 */
export async function logFailedLoginAttempt(
    userId: string,
    ipAddress: string,
    reason: string,
    userAgent?: string
): Promise<void> {
    return createAuditLog({
        event_type: "LOGIN_FAILED",
        user_id: userId,
        ip_address: ipAddress,
        user_agent: userAgent,
        details: { reason },
        timestamp: new Date(),
    })
}

/**
 * Create a session invalidation audit log entry
 *
 * Logs when sessions are invalidated (e.g., expired, revoked).
 * This is non-blocking and will not throw errors.
 *
 * @param userId - The ID of the user
 * @param ipAddress - The IP address of the client
 * @param reason - The reason for invalidation
 * @param userAgent - Optional user agent string
 * @returns Promise that resolves when logging completes (or fails silently)
 */
export async function logSessionInvalidation(
    userId: string,
    ipAddress: string,
    reason: string,
    userAgent?: string
): Promise<void> {
    return createAuditLog({
        event_type: "SESSION_INVALIDATED",
        user_id: userId,
        ip_address: ipAddress,
        user_agent: userAgent,
        details: { reason },
        timestamp: new Date(),
    })
}
