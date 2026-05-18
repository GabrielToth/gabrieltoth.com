/**
 * Module: Argon2id Password Hashing
 * Purpose: Hash and validate passwords using Argon2id algorithm with pepper and salt
 *
 * This module handles:
 * - Hashing passwords with Argon2id using configured parameters
 * - Applying pepper (server-side secret) before hashing
 * - Automatic salt generation and inclusion in hash output
 * - Timeout protection (max 10 seconds for Vercel Free Plan)
 * - Performance monitoring and warnings
 * - Hash format compatibility with argon2-cli verification
 *
 * Requirements covered:
 * - Requirement 1: Argon2id Password Hashing (1.1-1.6)
 * - Requirement 2: Automatic Salt Generation (2.1-2.5)
 * - Requirement 3: Pepper Security Layer (3.1-3.5)
 * - Requirement 15: Performance and Resource Management (15.1-15.6)
 *
 * Hash Format:
 * $argon2id$v=19$m=64000,t=3,p=2$SALT$HASH
 * - v=19: Argon2id version
 * - m=64000: Memory cost in KiB (64 MB)
 * - t=3: Time cost (iterations)
 * - p=2: Parallelism (threads)
 * - SALT: Base64-encoded salt
 * - HASH: Base64-encoded hash
 *
 * Performance Targets (Vercel Free Plan):
 * - Hash generation: 2-3 seconds
 * - Memory peak: ~150MB
 * - CPU: ~95% utilization
 * - Timeout margin: 7-8 seconds remaining after hashing
 */

import argon2 from "argon2"
import { ConfigurationManager } from "./config"
import { generateSalt } from "./salt-generator"

// Extract functions from argon2 module
const { hash: argon2Hash, verify: argon2Verify } = argon2

/**
 * Argon2id Hashing Configuration
 * These constants define timeout and performance thresholds
 */
const ARGON2_CONFIG = {
    /** Maximum time allowed for hash generation (seconds) */
    MAX_HASH_TIME_SECONDS: 10,

    /** Warning threshold for hash generation time (seconds) */
    HASH_TIME_WARNING_SECONDS: 5,

    /** Target hash generation time (seconds) */
    TARGET_HASH_TIME_SECONDS: 3,

    /** Acceptable variance in hash time (seconds) */
    HASH_TIME_VARIANCE_SECONDS: 1,
} as const

/**
 * Hash result with metadata
 */
export interface HashResult {
    /** The Argon2id hash string (includes salt and parameters) */
    hash: string

    /** Algorithm type for migration tracking */
    algorithm: "argon2id"

    /** Time taken to generate hash in milliseconds */
    timeTakenMs: number

    /** Whether hash generation exceeded warning threshold */
    performanceWarning: boolean
}

/**
 * Hash a password using Argon2id with pepper and automatic salt
 *
 * This function:
 * 1. Validates input password
 * 2. Loads pepper from configuration (fail-secure if missing)
 * 3. Appends pepper to password
 * 4. Generates cryptographically secure random salt
 * 5. Hashes with Argon2id using configured parameters
 * 6. Monitors performance and logs warnings if needed
 * 7. Returns hash with metadata
 *
 * The hash includes:
 * - Algorithm identifier (argon2id)
 * - Version (19)
 * - Parameters (memory, time, parallelism)
 * - Salt (automatically generated and included)
 * - Hash (base64-encoded)
 *
 * Performance:
 * - Expected: 2-3 seconds on Vercel Free Plan
 * - Maximum: 10 seconds (Vercel timeout)
 * - Logs warning if exceeds 5 seconds
 * - Throws error if exceeds 10 seconds
 *
 * @param password - Plain text password to hash (8-128 characters)
 * @returns Promise resolving to HashResult with hash and metadata
 * @throws Error if password is invalid, pepper is missing, or hashing fails
 *
 * @example
 * // Hash a password
 * const result = await hashPasswordArgon2id('MySecurePassword123!')
 * // result.hash will be: $argon2id$v=19$m=64000,t=3,p=2$SALT$HASH
 * // result.algorithm will be: 'argon2id'
 * // result.timeTakenMs will be: ~2500
 *
 * @example
 * // Handle performance warning
 * const result = await hashPasswordArgon2id('MySecurePassword123!')
 * if (result.performanceWarning) {
 *   console.warn('Hash generation took longer than expected:', result.timeTakenMs, 'ms')
 * }
 */
export async function hashPasswordArgon2id(
    password: string
): Promise<HashResult> {
    const startTime = Date.now()

    try {
        // 1. Validate input password
        validatePasswordInput(password)

        // 2. Load pepper from configuration (fail-secure if missing)
        const config = ConfigurationManager.getInstance()
        const pepper = config.getPepper()
        const argon2Params = config.getArgon2Params()

        // 3. Append pepper to password
        const pepperedPassword = password + pepper

        // 4. Generate cryptographically secure random salt
        const salt = generateSalt()

        // 5. Hash with Argon2id using configured parameters
        // Convert memory from MB to KiB (Argon2 uses KiB)
        const memoryKiB = argon2Params.memory * 1024

        const hash = await argon2Hash(pepperedPassword, {
            memoryCost: memoryKiB,
            timeCost: argon2Params.time,
            parallelism: argon2Params.parallelism,
            type: 2, // Argon2id type
            version: 19, // Argon2 version 19
            hashLength: 32, // 256-bit hash
            salt: salt, // Use our generated salt
        })

        // 6. Monitor performance and log warnings if needed
        const timeTakenMs = Date.now() - startTime
        const performanceWarning =
            timeTakenMs > ARGON2_CONFIG.HASH_TIME_WARNING_SECONDS * 1000

        if (performanceWarning) {
            console.warn(
                `⚠️  Password hashing took ${(timeTakenMs / 1000).toFixed(2)}s (warning threshold: ${ARGON2_CONFIG.HASH_TIME_WARNING_SECONDS}s)`,
                {
                    timeTakenMs,
                    memoryKiB,
                    timeCost: argon2Params.time,
                    parallelism: argon2Params.parallelism,
                }
            )
        }

        // 7. Return hash with metadata
        return {
            hash,
            algorithm: "argon2id",
            timeTakenMs,
            performanceWarning,
        }
    } catch (error) {
        const timeTakenMs = Date.now() - startTime

        // Check if timeout exceeded
        if (timeTakenMs > ARGON2_CONFIG.MAX_HASH_TIME_SECONDS * 1000) {
            console.error(
                `❌ Password hashing exceeded maximum time (${(timeTakenMs / 1000).toFixed(2)}s > ${ARGON2_CONFIG.MAX_HASH_TIME_SECONDS}s)`,
                { timeTakenMs }
            )
            throw new Error(
                `Password hashing operation timed out (${(timeTakenMs / 1000).toFixed(2)}s). ` +
                    `Maximum allowed: ${ARGON2_CONFIG.MAX_HASH_TIME_SECONDS}s. ` +
                    "Consider reducing Argon2id parameters."
            )
        }

        // Handle other errors
        if (error instanceof Error) {
            if (error.message.includes("PEPPER_SECRET")) {
                // Pepper error - fail-secure
                console.error("❌ Pepper configuration error:", error.message)
                throw error
            }

            console.error("❌ Password hashing failed:", error.message, {
                timeTakenMs,
            })
            throw new Error(`Failed to hash password: ${error.message}`)
        }

        throw new Error("Failed to hash password: Unknown error")
    }
}

/**
 * Validate password input before hashing
 *
 * Checks:
 * - Password is a string
 * - Password is not empty
 * - Password length is between 8 and 128 characters
 * - Password doesn't contain null bytes or control characters
 *
 * @param password - Password to validate
 * @throws Error if password is invalid
 */
function validatePasswordInput(password: unknown): asserts password is string {
    // Check type
    if (typeof password !== "string") {
        throw new Error(`Password must be a string, got: ${typeof password}`)
    }

    // Check not empty
    if (password.length === 0) {
        throw new Error("Password cannot be empty")
    }

    // Check length constraints
    if (password.length < 8) {
        throw new Error(
            `Password must be at least 8 characters, got: ${password.length}`
        )
    }

    if (password.length > 128) {
        throw new Error(
            `Password must not exceed 128 characters, got: ${password.length}`
        )
    }

    // Check for null bytes and control characters
    if (password.includes("\0")) {
        throw new Error("Password contains null bytes")
    }

    // Check for control characters (ASCII 0-31, except tab/newline which are still invalid)
    for (let i = 0; i < password.length; i++) {
        const charCode = password.charCodeAt(i)
        if (charCode < 32) {
            throw new Error(
                `Password contains invalid control character (ASCII ${charCode})`
            )
        }
    }
}

/**
 * Verify a password against an Argon2id hash
 *
 * This function:
 * 1. Validates input password and hash
 * 2. Loads pepper from configuration
 * 3. Appends pepper to password
 * 4. Uses constant-time comparison to verify
 * 5. Returns validation result
 *
 * The verification uses the argon2 library's built-in constant-time comparison
 * to prevent timing attacks.
 *
 * @param password - Plain text password to verify (8-128 characters)
 * @param hash - Argon2id hash to verify against
 * @returns Promise resolving to true if password matches, false otherwise
 * @throws Error if password or hash is invalid
 *
 * @example
 * // Verify a password
 * const isValid = await verifyPasswordArgon2id('MySecurePassword123!', hash)
 * // isValid will be true if password matches the hash
 *
 * @example
 * // Handle verification failure
 * try {
 *   const isValid = await verifyPasswordArgon2id('WrongPassword', hash)
 *   if (!isValid) {
 *     console.log('Password does not match')
 *   }
 * } catch (error) {
 *   console.error('Verification error:', error.message)
 * }
 */
export async function verifyPasswordArgon2id(
    password: string,
    hash: string
): Promise<boolean> {
    try {
        // 1. Validate input password and hash
        validatePasswordInput(password)

        if (!hash || typeof hash !== "string") {
            throw new Error("Hash must be a non-empty string")
        }

        // 2. Load pepper from configuration
        const config = ConfigurationManager.getInstance()
        const pepper = config.getPepper()

        // 3. Append pepper to password
        const pepperedPassword = password + pepper

        // 4. Use constant-time comparison to verify
        // argon2Verify uses constant-time comparison internally
        const isValid = await argon2Verify(hash, pepperedPassword)

        return isValid
    } catch (error) {
        if (error instanceof Error) {
            // Log error but don't expose details to caller
            console.error("Password verification error:", error.message)

            // If it's a validation error, re-throw it
            if (
                error.message.includes("Password must be") ||
                error.message.includes("Hash must be")
            ) {
                throw error
            }

            // For other errors (invalid hash format, etc.), return false
            // This prevents information disclosure about hash validity
            return false
        }

        return false
    }
}

/**
 * Detect if a hash is in Argon2id format
 *
 * Argon2id hashes start with: $argon2id$v=19$
 *
 * @param hash - Hash string to check
 * @returns true if hash appears to be Argon2id format, false otherwise
 *
 * @example
 * const isArgon2id = isArgon2idHash('$argon2id$v=19$m=64000,t=3,p=2$...')
 * // isArgon2id will be true
 *
 * @example
 * const isBcrypt = isArgon2idHash('$2b$12$...')
 * // isBcrypt will be false
 */
export function isArgon2idHash(hash: string): boolean {
    if (!hash || typeof hash !== "string") {
        return false
    }

    return hash.startsWith("$argon2id$v=19$")
}

/**
 * Get Argon2id configuration constants
 *
 * Useful for tests and documentation of performance thresholds.
 *
 * @returns Object with Argon2id configuration constants
 *
 * @example
 * const config = getArgon2Config()
 * console.log(config.MAX_HASH_TIME_SECONDS) // 10
 * console.log(config.TARGET_HASH_TIME_SECONDS) // 3
 */
export function getArgon2Config() {
    return { ...ARGON2_CONFIG }
}

/**
 * Export Argon2id configuration for use in other modules
 */
export { ARGON2_CONFIG }
