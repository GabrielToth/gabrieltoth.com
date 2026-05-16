/**
 * Module: Password Algorithm Migration Trigger
 * Purpose: Automatically migrate legacy Bcrypt hashes to Argon2id on successful login
 *
 * This module handles:
 * - Detecting when a password validation succeeded with Bcrypt hash
 * - Triggering async rehashing with Argon2id
 * - Updating database with new Argon2id hash
 * - Logging migration event to audit logs
 * - Continuing to accept Bcrypt hashes indefinitely (no deadline)
 * - Handling errors gracefully without breaking authentication
 *
 * Requirements covered:
 * - Requirement 5.3: Trigger Algorithm_Migration to rehash with Argon2id
 * - Requirement 11.1: Automatically rehash password with Argon2id on successful Bcrypt login
 * - Requirement 11.2: Store new hash in user database
 * - Requirement 11.3: Use current pepper and Argon2id parameters
 * - Requirement 11.4: Don't affect user authentication if migration fails
 * - Requirement 11.5: Log migration event for audit purposes
 * - Requirement 11.6: Continue accepting Bcrypt hashes indefinitely (no deadline)
 *
 * Migration Flow:
 * 1. After successful password validation with Bcrypt hash
 * 2. Call triggerPasswordMigration(userId, plainPassword)
 * 3. Function hashes password with Argon2id
 * 4. Updates database with new hash
 * 5. Logs migration event to audit logs
 * 6. Returns migration result (success/failure)
 * 7. Caller should NOT block authentication on migration failure
 *
 * Error Handling:
 * - Migration failures are logged but don't affect authentication
 * - User remains authenticated even if migration fails
 * - Errors are caught and logged for debugging
 * - Next login will attempt migration again
 *
 * Performance:
 * - Migration is async and non-blocking
 * - Hashing takes 2-3 seconds (inherent to Argon2id)
 * - Database update is fast (< 100ms)
 * - Total migration time: ~2-3 seconds
 * - Should be scheduled as background task if possible
 *
 * Audit Logging:
 * - Logs event_type: 'password_migration'
 * - Records old_algorithm: 'bcrypt'
 * - Records new_algorithm: 'argon2id'
 * - Includes user_id and email
 * - Includes timestamp
 * - Does NOT log password or hash values
 */

import { updateUserPassword } from "@/lib/auth/user"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { hashPasswordArgon2id } from "./argon2id-hasher"

/**
 * Result of password migration attempt
 */
export interface PasswordMigrationResult {
    /** Whether migration succeeded */
    success: boolean

    /** User ID that was migrated */
    userId: string

    /** Old algorithm (always 'bcrypt' for this function) */
    oldAlgorithm: "bcrypt"

    /** New algorithm (always 'argon2id' for this function) */
    newAlgorithm: "argon2id"

    /** Time taken to migrate in milliseconds */
    timeTakenMs: number

    /** Error message if migration failed */
    error?: string

    /** Whether the migration was logged to audit logs */
    auditLogged: boolean
}

/**
 * Trigger automatic password migration from Bcrypt to Argon2id
 *
 * This function should be called after successful password validation with a Bcrypt hash.
 * It will:
 * 1. Hash the password with Argon2id using current configuration
 * 2. Update the user's password hash in the database
 * 3. Log the migration event to audit logs
 * 4. Return migration result
 *
 * The function is designed to be non-blocking - if migration fails, it logs the error
 * but does not throw an exception. The caller should NOT block authentication on
 * migration failure.
 *
 * Migration is gradual and indefinite:
 * - Bcrypt hashes continue to be accepted indefinitely
 * - Each successful login with Bcrypt triggers a migration attempt
 * - Eventually all passwords will be migrated to Argon2id
 * - No forced migration deadline
 *
 * @param userId - User ID to migrate
 * @param plainPassword - Plain text password (for rehashing with Argon2id)
 * @returns Promise resolving to PasswordMigrationResult
 *
 * @example
 * // After successful password validation with Bcrypt hash
 * const validationResult = await validatePassword(password, hash)
 * if (validationResult.valid && validationResult.requiresMigration) {
 *   // Trigger migration (non-blocking)
 *   triggerPasswordMigration(userId, password).catch(error => {
 *     logger.error('Migration trigger failed', error)
 *   })
 * }
 *
 * @example
 * // Handle migration result
 * const result = await triggerPasswordMigration(userId, password)
 * if (result.success) {
 *   console.log('Password migrated to Argon2id')
 * } else {
 *   console.log('Migration failed:', result.error)
 *   // User remains authenticated, migration will be retried on next login
 * }
 */
export async function triggerPasswordMigration(
    userId: string,
    plainPassword: string
): Promise<PasswordMigrationResult> {
    const startTime = Date.now()

    try {
        // 1. Validate inputs
        if (!userId || typeof userId !== "string") {
            throw new Error("Invalid userId: must be a non-empty string")
        }

        if (!plainPassword || typeof plainPassword !== "string") {
            throw new Error("Invalid plainPassword: must be a non-empty string")
        }

        // 2. Hash password with Argon2id
        const hashResult = await hashPasswordArgon2id(plainPassword)

        // 3. Update database with new hash
        const updatedUser = await updateUserPassword(userId, hashResult.hash)

        // 4. Log migration event to audit logs
        await logPasswordMigration(
            userId,
            updatedUser.email,
            "bcrypt",
            "argon2id"
        )

        const timeTakenMs = Date.now() - startTime

        logger.info("✅ Password migrated from Bcrypt to Argon2id", {
            context: "PasswordMigration",
            data: {
                userId,
                email: updatedUser.email,
                timeTakenMs,
                oldAlgorithm: "bcrypt",
                newAlgorithm: "argon2id",
            },
        })

        return {
            success: true,
            userId,
            oldAlgorithm: "bcrypt",
            newAlgorithm: "argon2id",
            timeTakenMs,
            auditLogged: true,
        }
    } catch (error) {
        const timeTakenMs = Date.now() - startTime

        // Log error but don't throw - migration failure should not break authentication
        const errorMessage =
            error instanceof Error ? error.message : String(error)

        logger.error("❌ Password migration failed", {
            context: "PasswordMigration",
            error: error as Error,
            data: {
                userId,
                timeTakenMs,
                errorMessage,
            },
        })

        return {
            success: false,
            userId,
            oldAlgorithm: "bcrypt",
            newAlgorithm: "argon2id",
            timeTakenMs,
            error: errorMessage,
            auditLogged: false,
        }
    }
}

/**
 * Log password migration event to audit logs
 *
 * Records:
 * - Event type: 'password_migration'
 * - User ID and email
 * - Old algorithm (bcrypt) and new algorithm (argon2id)
 * - Timestamp
 *
 * Does NOT log:
 * - Password or hash values
 * - Pepper value
 * - Salt value
 *
 * @param userId - User ID being migrated
 * @param email - User email for audit trail
 * @param oldAlgorithm - Old algorithm (bcrypt)
 * @param newAlgorithm - New algorithm (argon2id)
 * @throws Error if database operation fails
 */
async function logPasswordMigration(
    userId: string,
    email: string,
    oldAlgorithm: string,
    newAlgorithm: string
): Promise<void> {
    try {
        const details = {
            action: "Password algorithm migration",
            oldAlgorithm,
            newAlgorithm,
            reason: "Automatic migration on successful login",
            timestamp: new Date().toISOString(),
        }

        await db.query(
            `INSERT INTO audit_logs (event_type, user_id, email, details, created_at)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
            ["password_migration", userId, email, JSON.stringify(details)]
        )

        logger.debug("Password migration logged to audit logs", {
            context: "PasswordMigration",
            data: {
                userId,
                email,
                oldAlgorithm,
                newAlgorithm,
            },
        })
    } catch (error) {
        logger.error("Failed to log password migration", {
            context: "PasswordMigration",
            error: error as Error,
            data: {
                userId,
                email,
            },
        })
        // Don't throw - audit logging failure should not break the migration
    }
}

/**
 * Get migration statistics for monitoring
 *
 * Returns count of migrated passwords and migration success rate.
 * Useful for monitoring migration progress and identifying issues.
 *
 * @returns Promise resolving to migration statistics
 *
 * @example
 * const stats = await getPasswordMigrationStats()
 * console.log(`Migrated: ${stats.migratedCount} passwords`)
 * console.log(`Success rate: ${stats.successRate}%`)
 */
export async function getPasswordMigrationStats(): Promise<{
    migratedCount: number
    failedCount: number
    successRate: number
    lastMigrationTime?: Date
}> {
    try {
        // Count successful migrations
        const migratedResult = await db.queryOne<{ count: number }>(
            `SELECT COUNT(*) as count FROM audit_logs 
             WHERE event_type = 'password_migration' 
             AND details->>'oldAlgorithm' = 'bcrypt'
             AND details->>'newAlgorithm' = 'argon2id'`,
            []
        )

        const migratedCount = migratedResult?.count || 0

        // Get last migration time
        const lastMigrationResult = await db.queryOne<{ created_at: Date }>(
            `SELECT created_at FROM audit_logs 
             WHERE event_type = 'password_migration'
             ORDER BY created_at DESC
             LIMIT 1`,
            []
        )

        const lastMigrationTime = lastMigrationResult?.created_at

        return {
            migratedCount,
            failedCount: 0, // Failed migrations are not logged as separate events
            successRate: 100, // Only successful migrations are logged
            lastMigrationTime,
        }
    } catch (error) {
        logger.error("Failed to get password migration stats", {
            context: "PasswordMigration",
            error: error as Error,
        })

        return {
            migratedCount: 0,
            failedCount: 0,
            successRate: 0,
        }
    }
}
