/**
 * Audit Logger for Secure Login Implementation
 * Logs all authentication events including login attempts, CSRF failures, rate limiting, and Remember Me operations
 * Implements 90+ day retention policy for compliance
 */

import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

const { query, queryOne } = db

export type AuditEventType =
    | "LOGIN_ATTEMPT"
    | "LOGIN_SUCCESS"
    | "LOGIN_FAILED"
    | "CSRF_FAILURE"
    | "RATE_LIMIT_EXCEEDED"
    | "REMEMBER_ME_CREATED"
    | "REMEMBER_ME_VALIDATED"
    | "REMEMBER_ME_FAILED"

export interface AuditLogEntry {
    id: string
    eventType: AuditEventType
    userId?: string
    email?: string
    ipAddress?: string
    userAgent?: string
    details?: Record<string, unknown>
    createdAt: Date
}

export interface ExportedAuditLog {
    id: string
    eventType: string
    userId?: string
    email?: string
    ipAddress?: string
    userAgent?: string
    details?: string
    createdAt: string
}

/**
 * Log a login attempt (both successful and failed)
 * Validates: Requirements 6.1
 */
export async function logLoginAttempt(
    email: string,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    reason?: string,
    userId?: string
): Promise<void> {
    try {
        const eventType = success ? "LOGIN_SUCCESS" : "LOGIN_FAILED"
        const details = {
            action: success ? "User logged in successfully" : "Login failed",
            success,
            ...(reason && { reason }),
            timestamp: new Date().toISOString(),
        }

        await query(
            `INSERT INTO audit_logs (event_type, user_id, email, ip_address, user_agent, details, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
            [
                eventType,
                userId || null,
                email,
                ipAddress,
                userAgent,
                JSON.stringify(details),
            ]
        )

        logger.debug(`Login attempt logged: ${eventType}`, {
            context: "AuditLogger",
            data: { email, success },
        })
    } catch (err) {
        logger.error("Failed to log login attempt", {
            context: "AuditLogger",
            error: err as Error,
            data: { email },
        })
        // Don't throw - audit logging should not break the main flow
    }
}

/**
 * Log a CSRF validation failure
 * Validates: Requirements 6.3
 */
export async function logCSRFFailure(
    ipAddress: string,
    userAgent: string,
    reason: string,
    email?: string
): Promise<void> {
    try {
        const details = {
            action: "CSRF validation failed",
            reason,
            timestamp: new Date().toISOString(),
        }

        await query(
            `INSERT INTO audit_logs (event_type, email, ip_address, user_agent, details, created_at)
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
            [
                "CSRF_FAILURE",
                email || null,
                ipAddress,
                userAgent,
                JSON.stringify(details),
            ]
        )

        logger.warn(`CSRF failure logged: ${reason}`, {
            context: "AuditLogger",
            data: { ipAddress, reason },
        })
    } catch (err) {
        logger.error("Failed to log CSRF failure", {
            context: "AuditLogger",
            error: err as Error,
            data: { ipAddress },
        })
    }
}

/**
 * Log a rate limiting event
 * Validates: Requirements 6.4
 */
export async function logRateLimitEvent(
    ipAddress: string,
    userAgent: string,
    attemptCount: number,
    email?: string
): Promise<void> {
    try {
        const details = {
            action: "Rate limit exceeded",
            attemptCount,
            limit: 5,
            window: "1 hour",
            timestamp: new Date().toISOString(),
        }

        await query(
            `INSERT INTO audit_logs (event_type, email, ip_address, user_agent, details, created_at)
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
            [
                "RATE_LIMIT_EXCEEDED",
                email || null,
                ipAddress,
                userAgent,
                JSON.stringify(details),
            ]
        )

        logger.warn(`Rate limit exceeded for IP: ${ipAddress}`, {
            context: "AuditLogger",
            data: { ipAddress, attemptCount },
        })
    } catch (err) {
        logger.error("Failed to log rate limit event", {
            context: "AuditLogger",
            error: err as Error,
            data: { ipAddress },
        })
    }
}

/**
 * Log a Remember Me token operation (creation or validation)
 * Validates: Requirements 6.5, 6.6
 */
export async function logRememberMeEvent(
    userId: string,
    email: string,
    ipAddress: string,
    userAgent: string,
    operation: "created" | "validated" | "failed",
    expiresAt?: Date,
    reason?: string
): Promise<void> {
    try {
        let eventType: AuditEventType = "REMEMBER_ME_CREATED"
        if (operation === "validated") {
            eventType = "REMEMBER_ME_VALIDATED"
        } else if (operation === "failed") {
            eventType = "REMEMBER_ME_FAILED"
        }

        const details = {
            action: `Remember Me token ${operation}`,
            operation,
            ...(expiresAt && { expiresAt: expiresAt.toISOString() }),
            ...(reason && { reason }),
            timestamp: new Date().toISOString(),
        }

        await query(
            `INSERT INTO audit_logs (event_type, user_id, email, ip_address, user_agent, details, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
            [
                eventType,
                userId,
                email,
                ipAddress,
                userAgent,
                JSON.stringify(details),
            ]
        )

        logger.debug(`Remember Me event logged: ${operation}`, {
            context: "AuditLogger",
            data: { userId, operation },
        })
    } catch (err) {
        logger.error("Failed to log Remember Me event", {
            context: "AuditLogger",
            error: err as Error,
            data: { userId },
        })
    }
}

/**
 * Export audit logs for compliance reporting
 * Supports filtering by date range, event type, and user
 * Validates: Requirements 6.7
 */
export async function exportAuditLogs(options?: {
    startDate?: Date
    endDate?: Date
    eventType?: AuditEventType
    userId?: string
    email?: string
    limit?: number
}): Promise<ExportedAuditLog[]> {
    try {
        let sql = `SELECT id, event_type as "eventType", user_id as "userId", email, 
                          ip_address as "ipAddress", user_agent as "userAgent", 
                          details, created_at as "createdAt"
                   FROM audit_logs WHERE 1=1`
        const params: unknown[] = []
        let paramCount = 1

        if (options?.startDate) {
            sql += ` AND created_at >= $${paramCount}`
            params.push(options.startDate)
            paramCount++
        }

        if (options?.endDate) {
            sql += ` AND created_at <= $${paramCount}`
            params.push(options.endDate)
            paramCount++
        }

        if (options?.eventType) {
            sql += ` AND event_type = $${paramCount}`
            params.push(options.eventType)
            paramCount++
        }

        if (options?.userId) {
            sql += ` AND user_id = $${paramCount}`
            params.push(options.userId)
            paramCount++
        }

        if (options?.email) {
            sql += ` AND email = $${paramCount}`
            params.push(options.email)
            paramCount++
        }

        sql += ` ORDER BY created_at DESC`

        if (options?.limit) {
            sql += ` LIMIT $${paramCount}`
            params.push(options.limit)
        }

        const result = await query<ExportedAuditLog>(sql, params)

        logger.debug("Audit logs exported", {
            context: "AuditLogger",
            data: { count: result.rows.length },
        })

        return result.rows
    } catch (err) {
        logger.error("Failed to export audit logs", {
            context: "AuditLogger",
            error: err as Error,
        })
        throw err
    }
}

/**
 * Clean up old audit logs (older than 90 days)
 * Should be called periodically via cron job
 * Validates: Requirements 6.8
 */
export async function cleanupOldAuditLogs(
    daysToRetain: number = 90
): Promise<number> {
    try {
        const cutoffTime = new Date(
            Date.now() - daysToRetain * 24 * 60 * 60 * 1000
        )

        const result = await query(
            `DELETE FROM audit_logs WHERE created_at < $1`,
            [cutoffTime]
        )

        const deletedCount = result.rowCount || 0

        logger.info(
            `Old audit logs cleaned up: ${deletedCount} records deleted`,
            {
                context: "AuditLogger",
                data: { deletedCount, daysToRetain },
            }
        )

        return deletedCount
    } catch (err) {
        logger.error("Failed to cleanup old audit logs", {
            context: "AuditLogger",
            error: err as Error,
        })
        throw err
    }
}

/**
 * Get audit logs for a specific user
 */
export async function getUserAuditLogs(
    userId: string,
    limit: number = 100
): Promise<AuditLogEntry[]> {
    try {
        const result = await query<AuditLogEntry>(
            `SELECT id, event_type as "eventType", user_id as "userId", email, 
                    ip_address as "ipAddress", user_agent as "userAgent", 
                    details, created_at as "createdAt"
             FROM audit_logs
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT $2`,
            [userId, limit]
        )

        return result.rows
    } catch (err) {
        logger.error("Failed to get user audit logs", {
            context: "AuditLogger",
            error: err as Error,
            data: { userId },
        })
        throw err
    }
}

/**
 * Get audit logs by event type
 */
export async function getAuditLogsByEventType(
    eventType: AuditEventType,
    limit: number = 100
): Promise<AuditLogEntry[]> {
    try {
        const result = await query<AuditLogEntry>(
            `SELECT id, event_type as "eventType", user_id as "userId", email, 
                    ip_address as "ipAddress", user_agent as "userAgent", 
                    details, created_at as "createdAt"
             FROM audit_logs
             WHERE event_type = $1
             ORDER BY created_at DESC
             LIMIT $2`,
            [eventType, limit]
        )

        return result.rows
    } catch (err) {
        logger.error("Failed to get audit logs by event type", {
            context: "AuditLogger",
            error: err as Error,
            data: { eventType },
        })
        throw err
    }
}

/**
 * Get recent security events (CSRF failures, rate limit exceeded)
 */
export async function getRecentSecurityEvents(
    hoursBack: number = 24,
    limit: number = 100
): Promise<AuditLogEntry[]> {
    try {
        const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000)

        const result = await query<AuditLogEntry>(
            `SELECT id, event_type as "eventType", user_id as "userId", email, 
                    ip_address as "ipAddress", user_agent as "userAgent", 
                    details, created_at as "createdAt"
             FROM audit_logs
             WHERE event_type IN ('CSRF_FAILURE', 'RATE_LIMIT_EXCEEDED')
             AND created_at > $1
             ORDER BY created_at DESC
             LIMIT $2`,
            [cutoffTime, limit]
        )

        return result.rows
    } catch (err) {
        logger.error("Failed to get recent security events", {
            context: "AuditLogger",
            error: err as Error,
        })
        throw err
    }
}

/**
 * Get failed login attempts for an IP address
 */
export async function getFailedLoginsByIP(
    ipAddress: string,
    hoursBack: number = 1,
    limit: number = 100
): Promise<AuditLogEntry[]> {
    try {
        const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000)

        const result = await query<AuditLogEntry>(
            `SELECT id, event_type as "eventType", user_id as "userId", email, 
                    ip_address as "ipAddress", user_agent as "userAgent", 
                    details, created_at as "createdAt"
             FROM audit_logs
             WHERE ip_address = $1
             AND event_type = 'LOGIN_FAILED'
             AND created_at > $2
             ORDER BY created_at DESC
             LIMIT $3`,
            [ipAddress, cutoffTime, limit]
        )

        return result.rows
    } catch (err) {
        logger.error("Failed to get failed logins by IP", {
            context: "AuditLogger",
            error: err as Error,
            data: { ipAddress },
        })
        throw err
    }
}
