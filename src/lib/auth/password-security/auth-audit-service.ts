import { type SupabaseClient } from "@supabase/supabase-js"
import { logger } from "@/lib/logger"

export interface RegistrationAuditParams {
    email: string
    userId: string
    algorithm: string
    hashTimeTakenMs: number
}

export interface RateLimitAuditParams {
    email: string
    degradedMode: boolean
}

export interface AuthSuccessAuditParams {
    email: string
    userId: string
    algorithm: string
    degradedMode: boolean
}

/**
 * Authentication Audit Service
 * Handles logging of all security-related authentication events
 */
export class AuthAuditService {
    private supabase: SupabaseClient

    constructor(supabaseClient: SupabaseClient) {
        this.supabase = supabaseClient
    }

    /**
     * Log a successful user registration event
     */
    async logRegistration(params: RegistrationAuditParams): Promise<void> {
        try {
            await this.supabase.from("audit_logs").insert({
                event_type: "user_registered",
                email: params.email,
                user_id: params.userId,
                timestamp: new Date().toISOString(),
                details: {
                    algorithm: params.algorithm,
                    hashTimeTakenMs: params.hashTimeTakenMs,
                },
            })
        } catch (error) {
            logger.error("Failed to log registration event", {
                email: params.email,
                error: error instanceof Error ? error.message : String(error),
            })
            // Deliberately don't throw to prevent failing the primary operation
        }
    }

    /**
     * Log a rate limit exceeded event
     */
    async logRateLimitExceeded(params: RateLimitAuditParams): Promise<void> {
        try {
            await this.supabase.from("audit_logs").insert({
                event_type: "rate_limit_exceeded",
                email: params.email,
                timestamp: new Date().toISOString(),
                details: {
                    degradedMode: params.degradedMode,
                },
            })
        } catch (error) {
            logger.error("Failed to log rate limit event", {
                email: params.email,
                error: error instanceof Error ? error.message : String(error),
            })
        }
    }

    /**
     * Log a successful authentication event
     */
    async logAuthSuccess(params: AuthSuccessAuditParams): Promise<void> {
        try {
            await this.supabase.from("audit_logs").insert({
                event_type: "auth_success",
                email: params.email,
                user_id: params.userId,
                timestamp: new Date().toISOString(),
                details: {
                    algorithm: params.algorithm,
                    degradedMode: params.degradedMode,
                },
            })
        } catch (error) {
            logger.error("Failed to log authentication event", {
                email: params.email,
                error: error instanceof Error ? error.message : String(error),
            })
        }
    }
}
