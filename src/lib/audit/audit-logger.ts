/**
 * Audit Logger Module
 * Logs all user actions for compliance and security auditing
 */

export interface AuditLogEntry {
    userId: string
    action: string
    resource: string
    resourceId?: string
    changes?: Record<string, unknown>
    ipAddress?: string
    userAgent?: string
    timestamp: Date
    status: "success" | "failure"
    errorMessage?: string
}

/**
 * Log an audit event
 */
export async function auditLog(entry: AuditLogEntry): Promise<void> {
    try {
        // Log to console in development
        if (process.env.NODE_ENV === "development") {
            console.log("[AUDIT]", {
                userId: entry.userId,
                action: entry.action,
                resource: entry.resource,
                timestamp: entry.timestamp,
                status: entry.status,
            })
        }

        // In production, send to audit service or database
        if (process.env.NODE_ENV === "production") {
            // TODO: Implement production audit logging
            // Could send to: Datadog, Sentry, custom audit service, etc.
        }
    } catch (error) {
        console.error("Failed to log audit entry:", error)
    }
}

/**
 * Create an audit log entry for a user action
 */
export function createAuditEntry(
    userId: string,
    action: string,
    resource: string,
    options?: {
        resourceId?: string
        changes?: Record<string, unknown>
        ipAddress?: string
        userAgent?: string
        status?: "success" | "failure"
        errorMessage?: string
    }
): AuditLogEntry {
    return {
        userId,
        action,
        resource,
        resourceId: options?.resourceId,
        changes: options?.changes,
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        timestamp: new Date(),
        status: options?.status || "success",
        errorMessage: options?.errorMessage,
    }
}
