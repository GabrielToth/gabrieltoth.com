/**
 * Audit Logging for Authentication Events
 * Maintains a complete audit trail of all authentication-related events
 */

import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

const { query, queryOne } = db

export type AuditEventType =
    | "REGISTRATION"
    | "EMAIL_VERIFICATION"
    | "LOGIN_SUCCESS"
    | "LOGIN_FAILED"
    | "LOGOUT"
    | "PASSWORD_RESET_REQUEST"
    | "PASSWORD_RESET_SUCCESS"
    | "ACCOUNT_COMPLETION"
    | "SQL_INJECTION_ATTEMPT"
    | "XSS_ATTEMPT"
    | "CSRF_VIOLATION"
    | "RATE_LIMIT_EXCEEDED"

export interface AuditLogEntry {
    id: string
    userId?: string
    eventType: AuditEventType
    email?: string
    ipAddress?: string
    details?: Record<string, unknown>
    createdAt: Date
}

/**
 * Log an audit event
 */
export async function logAuditEvent(
    eventType: AuditEventType,
    email?: string,
    ipAddress?: string,
    details?: Record<string, unknown>,
    userId?: string
): Promise<void> {
    try {
        // If email is provided but userId is not, try to find the user
        let finalUserId = userId
        if (email && !userId) {
            const userResult = await queryOne<{ id: string }>(
                "SELECT id FROM users WHERE email = $1",
                [email]
            )
            finalUserId = userResult?.id
        }

        await query(
            `INSERT INTO audit_logs (user_id, event_type, email, ip_address, details, created_at)
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
            [
                finalUserId || null,
                eventType,
                email || null,
                ipAddress || null,
                details ? JSON.stringify(details) : null,
            ]
        )

        logger.debug(`Audit event logged: ${eventType}`, {
            context: "AuditLog",
            data: { email, eventType },
        })
    } catch (err) {
        logger.error("Failed to log audit event", {
            context: "AuditLog",
            error: err as Error,
            data: { eventType, email },
        })
        // Don't throw - audit logging should not break the main flow
    }
}

/**
 * Log a registration event
 */
export async function logRegistration(
    email: string,
    ipAddress: string,
    userId?: string
): Promise<void> {
    await logAuditEvent(
        "REGISTRATION",
        email,
        ipAddress,
        { action: "User registered" },
        userId
    )
}

/**
 * Log an email verification event
 */
export async function logEmailVerification(
    email: string,
    ipAddress: string,
    userId?: string
): Promise<void> {
    await logAuditEvent(
        "EMAIL_VERIFICATION",
        email,
        ipAddress,
        { action: "Email verified" },
        userId
    )
}

/**
 * Log a successful login event
 */
export async function logLoginSuccess(
    email: string,
    ipAddress: string,
    userId?: string
): Promise<void> {
    await logAuditEvent(
        "LOGIN_SUCCESS",
        email,
        ipAddress,
        { action: "User logged in successfully" },
        userId
    )
}

/**
 * Log a failed login event
 */
export async function logLoginFailure(
    email: string,
    ipAddress: string,
    reason: string,
    userId?: string
): Promise<void> {
    await logAuditEvent(
        "LOGIN_FAILED",
        email,
        ipAddress,
        { action: "Login failed", reason },
        userId
    )
}

/**
 * Log a logout event
 */
export async function logLogout(
    email: string,
    ipAddress: string,
    userId?: string
): Promise<void> {
    await logAuditEvent(
        "LOGOUT",
        email,
        ipAddress,
        { action: "User logged out" },
        userId
    )
}

/**
 * Log a password reset request
 */
export async function logPasswordResetRequest(
    email: string,
    ipAddress: string,
    userId?: string
): Promise<void> {
    await logAuditEvent(
        "PASSWORD_RESET_REQUEST",
        email,
        ipAddress,
        { action: "Password reset requested" },
        userId
    )
}

/**
 * Log a successful password reset
 */
export async function logPasswordResetSuccess(
    email: string,
    ipAddress: string,
    userId?: string
): Promise<void> {
    await logAuditEvent(
        "PASSWORD_RESET_SUCCESS",
        email,
        ipAddress,
        { action: "Password reset successfully" },
        userId
    )
}

/**
 * Log a successful account completion
 */
export async function logAccountCompletion(
    userId: string,
    email: string,
    ipAddress: string
): Promise<void> {
    await logAuditEvent(
        "ACCOUNT_COMPLETION",
        email,
        ipAddress,
        {
            action: "Account completion successful",
            timestamp: new Date().toISOString(),
            status: "success",
        },
        userId
    )

    logger.info("Account completion logged", {
        context: "AccountCompletion",
        data: { userId, email },
    })
}

/**
 * Log a failed account completion attempt
 */
export async function logAccountCompletionFailed(
    email: string,
    ipAddress: string,
    errorDetails: string
): Promise<void> {
    await logAuditEvent("ACCOUNT_COMPLETION", email, ipAddress, {
        action: "Account completion failed",
        timestamp: new Date().toISOString(),
        status: "failed",
        error: errorDetails,
    })

    logger.warn("Account completion failed", {
        context: "AccountCompletion",
        data: { email, error: errorDetails },
    })
}

/**
 * Log a security event (SQL injection, XSS, CSRF, etc.)
 */
export async function logSecurityEvent(
    eventType:
        | "SQL_INJECTION_ATTEMPT"
        | "XSS_ATTEMPT"
        | "CSRF_VIOLATION"
        | "RATE_LIMIT_EXCEEDED",
    email: string | undefined,
    ipAddress: string,
    details: Record<string, unknown>,
    userId?: string
): Promise<void> {
    await logAuditEvent(eventType, email, ipAddress, details, userId)

    // Also log to security logger
    logger.warn(`Security event: ${eventType}`, {
        context: "Security",
        data: { email, ipAddress, details },
    })
}

/**
 * Get audit logs for a specific user
 */
export async function getUserAuditLogs(
    userId: string,
    limit: number = 100
): Promise<AuditLogEntry[]> {
    try {
        const results = await query<AuditLogEntry>(
            `SELECT id, user_id as "userId", event_type as "eventType", email, ip_address as "ipAddress", 
                    details, created_at as "createdAt"
             FROM audit_logs
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT $2`,
            [userId, limit]
        )

        return results.rows
    } catch (err) {
        logger.error("Failed to get user audit logs", {
            context: "AuditLog",
            error: err as Error,
            data: { userId },
        })
        throw err
    }
}

/**
 * Get audit logs for a specific event type
 */
export async function getAuditLogsByEventType(
    eventType: AuditEventType,
    limit: number = 100
): Promise<AuditLogEntry[]> {
    try {
        const results = await query<AuditLogEntry>(
            `SELECT id, user_id as "userId", event_type as "eventType", email, ip_address as "ipAddress", 
                    details, created_at as "createdAt"
             FROM audit_logs
             WHERE event_type = $1
             ORDER BY created_at DESC
             LIMIT $2`,
            [eventType, limit]
        )

        return results.rows
    } catch (err) {
        logger.error("Failed to get audit logs by event type", {
            context: "AuditLog",
            error: err as Error,
            data: { eventType },
        })
        throw err
    }
}

/**
 * Get recent security events
 */
export async function getRecentSecurityEvents(
    hoursBack: number = 24,
    limit: number = 100
): Promise<AuditLogEntry[]> {
    try {
        const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000)

        const results = await query<AuditLogEntry>(
            `SELECT id, user_id as "userId", event_type as "eventType", email, ip_address as "ipAddress", 
                    details, created_at as "createdAt"
             FROM audit_logs
             WHERE event_type IN ('SQL_INJECTION_ATTEMPT', 'XSS_ATTEMPT', 'CSRF_VIOLATION', 'RATE_LIMIT_EXCEEDED')
             AND created_at > $1
             ORDER BY created_at DESC
             LIMIT $2`,
            [cutoffTime, limit]
        )

        return results.rows
    } catch (err) {
        logger.error("Failed to get recent security events", {
            context: "AuditLog",
            error: err as Error,
        })
        throw err
    }
}

/**
 * Clean up old audit logs (older than 90 days)
 * Should be called periodically via cron job
 */
export async function cleanupOldAuditLogs(): Promise<number> {
    try {
        const cutoffTime = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days ago

        const result = await query(
            `DELETE FROM audit_logs WHERE created_at < $1`,
            [cutoffTime]
        )

        logger.debug("Old audit logs cleaned up", {
            context: "AuditLog",
            data: { deletedCount: result.rowCount },
        })

        return result.rowCount || 0
    } catch (err) {
        logger.error("Failed to cleanup old audit logs", {
            context: "AuditLog",
            error: err as Error,
        })
        throw err
    }
}
