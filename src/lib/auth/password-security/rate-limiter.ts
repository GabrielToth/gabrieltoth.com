/**
 * Module: Rate Limiter Service with Supabase Backing
 * Purpose: Implement brute-force protection using persistent Supabase storage
 *
 * This module handles:
 * - Checking if an account is locked (locked_until > now)
 * - Recording failures and incrementing failed_attempts
 * - Recording successes and resetting the counter
 * - Using Supabase for persistent state (not in-memory)
 * - Automatic unlock after lockout period expires
 *
 * Requirements covered:
 * - Requirement 7: Brute Force Protection with Rate Limiting (7.1-7.7)
 * - Requirement 15: Performance and Resource Management (15.4)
 *
 * Design notes:
 * - Uses Supabase for persistence (serverless-compatible)
 * - Tracks by email (user identifier)
 * - Automatic unlock after 15 minutes
 * - Resets counter on successful authentication
 * - Logs all rate limit events for audit trail
 */

import { createLogger } from "@/lib/logger"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { RateLimitingConfig } from "./types"

const logger = createLogger("RateLimiter")

/**
 * Rate limit record from database
 */
interface RateLimitRecord {
    id: string
    email: string
    failed_attempts: number
    last_attempt: string
    locked_until: string | null
    created_at: string
    updated_at: string
}

/**
 * Result of rate limit check
 */
export interface RateLimitCheckResult {
    allowed: boolean
    remainingAttempts: number
    lockedUntil?: Date
    isLocked: boolean
}

/**
 * RateLimiter Service
 *
 * Manages authentication attempt rate limiting using Supabase for persistent storage.
 * Implements account lockout after configurable number of failures within a time window.
 *
 * Usage:
 *   const limiter = new RateLimiter(config)
 *   const result = await limiter.checkAndUpdateRateLimit(email)
 *   if (!result.allowed) {
 *     return { status: 429, error: 'Too many attempts' }
 *   }
 *   // Attempt authentication...
 *   if (success) {
 *     await limiter.recordSuccess(email)
 *   } else {
 *     await limiter.recordFailure(email)
 *   }
 */
export class RateLimiter {
    private supabase: SupabaseClient<any>
    private config: RateLimitingConfig

    constructor(config: RateLimitingConfig) {
        this.config = config

        // Create Supabase client with service role key for backend operations
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!url || !serviceKey) {
            throw new Error(
                "Missing Supabase configuration. " +
                    "Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set."
            )
        }

        this.supabase = createClient<any>(url, serviceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        })
    }

    /**
     * Check if an account is locked and update rate limit state
     *
     * This function:
     * 1. Fetches the current rate limit record for the email
     * 2. Checks if the account is locked (locked_until > now)
     * 3. If locked, returns locked status
     * 4. If not locked but window expired, resets the counter
     * 5. Returns whether the request is allowed
     *
     * @param email User email address
     * @returns Rate limit check result with allowed status and remaining attempts
     */
    async checkAndUpdateRateLimit(
        email: string
    ): Promise<RateLimitCheckResult> {
        try {
            // Fetch current record
            const { data: records, error: fetchError } = await this.supabase
                .from("rate_limit_records")
                .select("*")
                .eq("email", email)
                .single()

            if (fetchError && fetchError.code !== "PGRST116") {
                // PGRST116 = no rows found (expected for new users)
                logger.error("Failed to fetch rate limit record", {
                    email,
                    error: fetchError.message,
                })
                throw fetchError
            }

            const now = new Date()
            let record = records as RateLimitRecord | null

            // No record yet - create one
            if (!record) {
                const { error: insertError } = await this.supabase
                    .from("rate_limit_records")
                    .insert({
                        email,
                        failed_attempts: 0,
                        last_attempt: now.toISOString(),
                        locked_until: null,
                    })

                if (insertError) {
                    logger.error("Failed to create rate limit record", {
                        email,
                        error: insertError.message,
                    })
                    throw insertError
                }

                logger.debug("Rate limit record created", { email })

                return {
                    allowed: true,
                    remainingAttempts: this.config.failureThreshold,
                    isLocked: false,
                }
            }

            // Check if locked
            if (record.locked_until) {
                const lockedUntil = new Date(record.locked_until)
                if (now < lockedUntil) {
                    logger.warn("Account locked due to rate limit", {
                        email,
                        lockedUntil: lockedUntil.toISOString(),
                        failedAttempts: record.failed_attempts,
                    })

                    return {
                        allowed: false,
                        remainingAttempts: 0,
                        lockedUntil,
                        isLocked: true,
                    }
                }

                // Lockout expired, reset
                await this.resetRecord(email)
                return {
                    allowed: true,
                    remainingAttempts: this.config.failureThreshold,
                    isLocked: false,
                }
            }

            // Check if window expired
            const lastAttempt = new Date(record.last_attempt)
            const minutesElapsed =
                (now.getTime() - lastAttempt.getTime()) / (1000 * 60)

            if (minutesElapsed > this.config.windowMinutes) {
                // Window expired, reset counter
                await this.resetRecord(email)
                return {
                    allowed: true,
                    remainingAttempts: this.config.failureThreshold,
                    isLocked: false,
                }
            }

            // Check if at threshold
            if (record.failed_attempts >= this.config.failureThreshold) {
                // Lock the account
                const lockedUntil = new Date(
                    now.getTime() + this.config.lockoutMinutes * 60 * 1000
                )

                const { error: updateError } = await this.supabase
                    .from("rate_limit_records")
                    .update({
                        locked_until: lockedUntil.toISOString(),
                        last_attempt: now.toISOString(),
                    })
                    .eq("email", email)

                if (updateError) {
                    logger.error("Failed to lock account", {
                        email,
                        error: updateError.message,
                    })
                    throw updateError
                }

                logger.warn("Account locked due to rate limit threshold", {
                    email,
                    failedAttempts: record.failed_attempts,
                    lockedUntil: lockedUntil.toISOString(),
                })

                return {
                    allowed: false,
                    remainingAttempts: 0,
                    lockedUntil,
                    isLocked: true,
                }
            }

            // Account is not locked and within window
            const remainingAttempts =
                this.config.failureThreshold - record.failed_attempts

            return {
                allowed: true,
                remainingAttempts,
                isLocked: false,
            }
        } catch (error) {
            logger.error("Error checking rate limit", {
                email,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Record a failed authentication attempt
     *
     * This function:
     * 1. Increments the failed_attempts counter
     * 2. Updates last_attempt timestamp
     * 3. Logs the failure for audit trail
     *
     * @param email User email address
     */
    async recordFailure(email: string): Promise<void> {
        try {
            // Fetch current count
            const { data: records, error: fetchError } = await this.supabase
                .from("rate_limit_records")
                .select("failed_attempts")
                .eq("email", email)
                .single()

            if (fetchError && fetchError.code !== "PGRST116") {
                logger.error("Failed to fetch rate limit record for failure", {
                    email,
                    error: fetchError.message,
                })
                throw fetchError
            }

            const currentCount = records?.failed_attempts || 0
            const newCount = currentCount + 1

            // Update record
            const { error: updateError } = await this.supabase
                .from("rate_limit_records")
                .update({
                    failed_attempts: newCount,
                    last_attempt: new Date().toISOString(),
                })
                .eq("email", email)

            if (updateError) {
                logger.error("Failed to record failure", {
                    email,
                    error: updateError.message,
                })
                throw updateError
            }

            logger.debug("Authentication failure recorded", {
                email,
                attemptCount: newCount,
                threshold: this.config.failureThreshold,
            })

            // Log to audit logs
            await this.logAuthFailure(email, newCount)
        } catch (error) {
            logger.error("Error recording failure", {
                email,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Record a successful authentication attempt
     *
     * This function:
     * 1. Resets the failed_attempts counter to 0
     * 2. Clears the locked_until timestamp
     * 3. Updates last_attempt timestamp
     * 4. Logs the success for audit trail
     *
     * @param email User email address
     */
    async recordSuccess(email: string): Promise<void> {
        try {
            // Reset counter on successful login
            const { error: updateError } = await this.supabase
                .from("rate_limit_records")
                .update({
                    failed_attempts: 0,
                    locked_until: null,
                    last_attempt: new Date().toISOString(),
                })
                .eq("email", email)

            if (updateError) {
                logger.error("Failed to record success", {
                    email,
                    error: updateError.message,
                })
                throw updateError
            }

            logger.debug("Authentication success recorded", { email })

            // Log success
            await this.logAuthSuccess(email)
        } catch (error) {
            logger.error("Error recording success", {
                email,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Reset rate limit record for an email
     *
     * Used when:
     * - Lockout period expires
     * - Time window expires
     * - Admin reset
     *
     * @param email User email address
     */
    private async resetRecord(email: string): Promise<void> {
        try {
            const { error } = await this.supabase
                .from("rate_limit_records")
                .update({
                    failed_attempts: 0,
                    locked_until: null,
                    last_attempt: new Date().toISOString(),
                })
                .eq("email", email)

            if (error) {
                logger.error("Failed to reset rate limit record", {
                    email,
                    error: error.message,
                })
                throw error
            }

            logger.debug("Rate limit record reset", { email })
        } catch (error) {
            logger.error("Error resetting rate limit record", {
                email,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Log authentication failure to audit logs
     *
     * @param email User email address
     * @param attemptCount Current attempt count
     */
    private async logAuthFailure(
        email: string,
        attemptCount: number
    ): Promise<void> {
        try {
            const { error } = await this.supabase.from("audit_logs").insert({
                event_type: "auth_failure",
                email,
                attempt_count: attemptCount,
                timestamp: new Date().toISOString(),
            })

            if (error) {
                logger.error("Failed to log auth failure", {
                    email,
                    error: error.message,
                })
                // Don't throw - logging failure shouldn't break authentication
            }
        } catch (error) {
            logger.error("Error logging auth failure", {
                email,
                error: error instanceof Error ? error.message : String(error),
            })
            // Don't throw - logging failure shouldn't break authentication
        }
    }

    /**
     * Log authentication success to audit logs
     *
     * @param email User email address
     */
    private async logAuthSuccess(email: string): Promise<void> {
        try {
            const { error } = await this.supabase.from("audit_logs").insert({
                event_type: "auth_success",
                email,
                timestamp: new Date().toISOString(),
            })

            if (error) {
                logger.error("Failed to log auth success", {
                    email,
                    error: error.message,
                })
                // Don't throw - logging failure shouldn't break authentication
            }
        } catch (error) {
            logger.error("Error logging auth success", {
                email,
                error: error instanceof Error ? error.message : String(error),
            })
            // Don't throw - logging failure shouldn't break authentication
        }
    }

    /**
     * Get current attempt count for an email
     *
     * @param email User email address
     * @returns Current failed attempt count
     */
    async getAttemptCount(email: string): Promise<number> {
        try {
            const { data: records, error } = await this.supabase
                .from("rate_limit_records")
                .select("failed_attempts")
                .eq("email", email)
                .single()

            if (error && error.code !== "PGRST116") {
                logger.error("Failed to get attempt count", {
                    email,
                    error: error.message,
                })
                throw error
            }

            return records?.failed_attempts || 0
        } catch (error) {
            logger.error("Error getting attempt count", {
                email,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Get remaining attempts before lockout
     *
     * @param email User email address
     * @returns Remaining attempts (0 if locked)
     */
    async getRemainingAttempts(email: string): Promise<number> {
        const count = await this.getAttemptCount(email)
        return Math.max(0, this.config.failureThreshold - count)
    }

    /**
     * Get time until rate limit resets (in seconds)
     *
     * @param email User email address
     * @returns Seconds until reset (0 if not limited)
     */
    async getTimeUntilReset(email: string): Promise<number> {
        try {
            const { data: records, error } = await this.supabase
                .from("rate_limit_records")
                .select("last_attempt, locked_until")
                .eq("email", email)
                .single()

            if (error && error.code !== "PGRST116") {
                logger.error("Failed to get time until reset", {
                    email,
                    error: error.message,
                })
                throw error
            }

            if (!records) {
                return 0
            }

            const now = new Date()

            // If locked, return time until unlock
            if (records.locked_until) {
                const lockedUntil = new Date(records.locked_until)
                if (now < lockedUntil) {
                    const timeRemaining = lockedUntil.getTime() - now.getTime()
                    return Math.ceil(timeRemaining / 1000)
                }
            }

            // Otherwise, return time until window expires
            const lastAttempt = new Date(records.last_attempt)
            const windowExpires = new Date(
                lastAttempt.getTime() + this.config.windowMinutes * 60 * 1000
            )

            if (now < windowExpires) {
                const timeRemaining = windowExpires.getTime() - now.getTime()
                return Math.ceil(timeRemaining / 1000)
            }

            return 0
        } catch (error) {
            logger.error("Error getting time until reset", {
                email,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Get time remaining until account unlock (in seconds)
     *
     * This helper function calculates how many seconds remain until a locked account
     * is automatically unlocked. Returns 0 if the account is not locked.
     *
     * Usage:
     *   const secondsRemaining = await limiter.getUnlockTimeRemaining(email)
     *   if (secondsRemaining > 0) {
     *     console.log(`Account locked for ${secondsRemaining} more seconds`)
     *   }
     *
     * @param email User email address
     * @returns Seconds until unlock (0 if not locked)
     */
    async getUnlockTimeRemaining(email: string): Promise<number> {
        try {
            const { data: records, error } = await this.supabase
                .from("rate_limit_records")
                .select("locked_until")
                .eq("email", email)
                .single()

            if (error && error.code !== "PGRST116") {
                logger.error("Failed to get unlock time remaining", {
                    email,
                    error: error.message,
                })
                throw error
            }

            if (!records || !records.locked_until) {
                return 0
            }

            const now = new Date()
            const lockedUntil = new Date(records.locked_until)

            if (now >= lockedUntil) {
                // Account should be unlocked
                return 0
            }

            const timeRemaining = lockedUntil.getTime() - now.getTime()
            return Math.ceil(timeRemaining / 1000)
        } catch (error) {
            logger.error("Error getting unlock time remaining", {
                email,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Manually unlock an account and reset failure counter
     *
     * This helper function immediately unlocks a locked account and resets the
     * failure counter to 0. This is useful for admin operations or when an account
     * needs to be unlocked before the automatic 15-minute timeout.
     *
     * Usage:
     *   await limiter.unlockAccount(email)
     *   // Account is now unlocked and can attempt login again
     *
     * @param email User email address
     */
    async unlockAccount(email: string): Promise<void> {
        try {
            const { error } = await this.supabase
                .from("rate_limit_records")
                .update({
                    failed_attempts: 0,
                    locked_until: null,
                    last_attempt: new Date().toISOString(),
                })
                .eq("email", email)

            if (error) {
                logger.error("Failed to unlock account", {
                    email,
                    error: error.message,
                })
                throw error
            }

            logger.info("Account manually unlocked", { email })
        } catch (error) {
            logger.error("Error unlocking account", {
                email,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Clear all rate limit records (for testing/admin purposes)
     *
     * WARNING: This deletes all rate limit data. Use with caution.
     */
    async clearAllRecords(): Promise<void> {
        try {
            const { error } = await this.supabase
                .from("rate_limit_records")
                .delete()
                .neq("id", "00000000-0000-0000-0000-000000000000") // Delete all

            if (error) {
                logger.error("Failed to clear all rate limit records", {
                    error: error.message,
                })
                throw error
            }

            logger.warn("All rate limit records cleared")
        } catch (error) {
            logger.error("Error clearing all rate limit records", {
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }
}

/**
 * Create a singleton instance of RateLimiter
 *
 * Usage:
 *   const limiter = getRateLimiter()
 *   const result = await limiter.checkAndUpdateRateLimit(email)
 */
let rateLimiterInstance: RateLimiter | null = null

export function getRateLimiter(config?: RateLimitingConfig): RateLimiter {
    if (!rateLimiterInstance) {
        if (!config) {
            throw new Error(
                "RateLimiter not initialized. Call getRateLimiter(config) first."
            )
        }
        rateLimiterInstance = new RateLimiter(config)
    }
    return rateLimiterInstance
}
