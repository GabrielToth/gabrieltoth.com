/**
 * Rate Limiting for Login Attempts
 * Implements protection against brute force attacks
 * Max 5 failed attempts in 15 minutes
 */

import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

const { query, queryOne } = db

const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION_MINUTES = 15
const LOCKOUT_DURATION_MS = LOCKOUT_DURATION_MINUTES * 60 * 1000

/**
 * Record a login attempt in the database
 */
export async function recordLoginAttempt(
    email: string,
    ipAddress: string,
    success: boolean,
    reason?: string
): Promise<void> {
    try {
        // First, try to find the user by email to get their ID
        const userResult = await queryOne<{ id: string }>(
            "SELECT id FROM users WHERE email = $1",
            [email]
        )

        const userId = userResult?.id || null

        await query(
            `INSERT INTO login_attempts (user_id, email, ip_address, attempted_at, success, reason)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5)`,
            [userId, email, ipAddress, success, reason || null]
        )

        logger.debug("Login attempt recorded", {
            context: "RateLimit",
            data: { email, ipAddress, success },
        })
    } catch (err) {
        logger.error("Failed to record login attempt", {
            context: "RateLimit",
            error: err as Error,
            data: { email, ipAddress },
        })
        throw err
    }
}

/**
 * Check if an account is locked due to too many failed attempts
 */
export async function isAccountLocked(
    email: string,
    ipAddress: string
): Promise<boolean> {
    try {
        const cutoffTime = new Date(Date.now() - LOCKOUT_DURATION_MS)

        const result = await queryOne<{ count: number }>(
            `SELECT COUNT(*) as count FROM login_attempts
             WHERE email = $1 AND ip_address = $2 AND attempted_at > $3 AND success = false`,
            [email, ipAddress, cutoffTime]
        )

        const failedAttempts = result?.count || 0

        if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {
            logger.warn("Account locked due to too many failed attempts", {
                context: "RateLimit",
                data: { email, ipAddress, failedAttempts },
            })
            return true
        }

        return false
    } catch (err) {
        logger.error("Failed to check account lock status", {
            context: "RateLimit",
            error: err as Error,
            data: { email, ipAddress },
        })
        throw err
    }
}

/**
 * Get the number of failed login attempts in the last 15 minutes
 */
export async function getFailedLoginAttempts(
    email: string,
    ipAddress: string
): Promise<number> {
    try {
        const cutoffTime = new Date(Date.now() - LOCKOUT_DURATION_MS)

        const result = await queryOne<{ count: number }>(
            `SELECT COUNT(*) as count FROM login_attempts
             WHERE email = $1 AND ip_address = $2 AND attempted_at > $3 AND success = false`,
            [email, ipAddress, cutoffTime]
        )

        return result?.count || 0
    } catch (err) {
        logger.error("Failed to get failed login attempts", {
            context: "RateLimit",
            error: err as Error,
            data: { email, ipAddress },
        })
        throw err
    }
}

/**
 * Clear login attempts for an account (after successful login or after lockout period)
 */
export async function clearLoginAttempts(
    email: string,
    ipAddress: string
): Promise<void> {
    try {
        await query(
            `DELETE FROM login_attempts
             WHERE email = $1 AND ip_address = $2 AND attempted_at < $3`,
            [email, ipAddress, new Date(Date.now() - LOCKOUT_DURATION_MS)]
        )

        logger.debug("Login attempts cleared", {
            context: "RateLimit",
            data: { email, ipAddress },
        })
    } catch (err) {
        logger.error("Failed to clear login attempts", {
            context: "RateLimit",
            error: err as Error,
            data: { email, ipAddress },
        })
        throw err
    }
}

/**
 * Get the time remaining until the account is unlocked (in seconds)
 */
export async function getTimeUntilUnlock(
    email: string,
    ipAddress: string
): Promise<number> {
    try {
        const cutoffTime = new Date(Date.now() - LOCKOUT_DURATION_MS)

        const result = await queryOne<{ latest_attempt: Date }>(
            `SELECT MAX(attempted_at) as latest_attempt FROM login_attempts
             WHERE email = $1 AND ip_address = $2 AND attempted_at > $3 AND success = false`,
            [email, ipAddress, cutoffTime]
        )

        if (!result?.latest_attempt) {
            return 0
        }

        const latestAttempt = new Date(result.latest_attempt).getTime()
        const unlockTime = latestAttempt + LOCKOUT_DURATION_MS
        const timeRemaining = Math.max(0, unlockTime - Date.now())

        return Math.ceil(timeRemaining / 1000) // Return in seconds
    } catch (err) {
        logger.error("Failed to get time until unlock", {
            context: "RateLimit",
            error: err as Error,
            data: { email, ipAddress },
        })
        throw err
    }
}

/**
 * Clean up old login attempts (older than 24 hours)
 * Should be called periodically via cron job
 */
export async function cleanupOldLoginAttempts(): Promise<number> {
    try {
        const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago

        const result = await query(
            `DELETE FROM login_attempts WHERE attempted_at < $1`,
            [cutoffTime]
        )

        logger.debug("Old login attempts cleaned up", {
            context: "RateLimit",
            data: { deletedCount: result.rowCount },
        })

        return result.rowCount || 0
    } catch (err) {
        logger.error("Failed to cleanup old login attempts", {
            context: "RateLimit",
            error: err as Error,
        })
        throw err
    }
}
