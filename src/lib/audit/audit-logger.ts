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
            const { createClient } = await import("@supabase/supabase-js")
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL || "",
                process.env.SUPABASE_SERVICE_ROLE_KEY || ""
            )
            await supabase.from("audit_logs").insert({
                event_type: entry.action,
                user_id: entry.userId,
                ip_address: entry.ipAddress,
                user_agent: entry.userAgent,
                details: entry.changes ? JSON.stringify(entry.changes) : null,
                error_message: entry.errorMessage,
                timestamp: entry.timestamp.toISOString(),
            })
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
