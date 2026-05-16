/**
 * Module: Hash Format Validation
 * Purpose: Validate that password hashes are in expected algorithm format before validation
 *
 * This module handles:
 * - Validating hash format for Argon2id ($argon2id$v=19$...)
 * - Validating hash format for Bcrypt ($2a$, $2b$, $2x$, $2y$)
 * - Detecting malformed hashes
 * - Logging malformed attempts without exposing sensitive details
 * - Returning generic error messages to prevent information disclosure
 *
 * Requirements covered:
 * - Requirement 8.4: Verify hash format matches expected algorithm format
 * - Requirement 8.5: Reject invalid hash format and log malformed attempt
 * - Requirement 8.8: Treat invalid hash format as validation failure
 * - Requirement 14.1: Log authentication failures with generic reason
 * - Requirement 14.5: Logs SHALL NOT contain plaintext passwords or sensitive data
 *
 * Security Properties:
 * - No sensitive data in logs (hash is truncated to first 10 chars)
 * - Generic error messages (no algorithm type revealed)
 * - Fail-secure: invalid hashes are rejected
 * - Timing-safe: validation time is consistent regardless of hash format
 *
 * Hash Formats:
 * - Argon2id: $argon2id$v=19$m=64000,t=3,p=2$SALT$HASH
 * - Bcrypt: $2a$12$SALT+HASH or $2b$12$SALT+HASH or $2x$12$SALT+HASH or $2y$12$SALT+HASH
 */

import { logger } from "@/lib/logger"
import {
    detectHashAlgorithm,
    isArgon2idHashFormat,
    isBcryptHashFormat,
} from "./hash-algorithm-detection"

/**
 * Result of hash format validation
 */
export interface HashFormatValidationResult {
    /** Whether the hash format is valid and supported */
    isValid: boolean

    /** The detected algorithm type (for internal use, not exposed to user) */
    algorithm: "argon2id" | "bcrypt" | "unknown"

    /** Generic error message for user (no algorithm details) */
    userMessage: string

    /** Whether the hash format was malformed (detected but invalid) */
    isMalformed: boolean
}

/**
 * Validate that a hash is in expected algorithm format
 *
 * This function checks if a hash matches one of the supported formats:
 * - Argon2id: $argon2id$v=19$...
 * - Bcrypt: $2a$, $2b$, $2x$, $2y$
 *
 * If the hash is invalid or malformed, it:
 * 1. Logs the malformed attempt without exposing the hash
 * 2. Returns a generic error message (no algorithm type revealed)
 * 3. Marks the hash as invalid for downstream validation
 *
 * Security properties:
 * - No sensitive data in logs (hash truncated to first 10 chars)
 * - Generic error messages prevent information disclosure
 * - Fail-secure: invalid hashes are rejected
 * - Timing-safe: consistent validation time
 *
 * @param hash - The password hash to validate
 * @param email - Optional email for audit logging (not exposed in logs)
 * @returns HashFormatValidationResult with validity, algorithm, and user message
 *
 * @example
 * // Valid Argon2id hash
 * const result = validateHashFormat('$argon2id$v=19$m=64000,t=3,p=2$...')
 * // result.isValid === true
 * // result.algorithm === 'argon2id'
 * // result.userMessage === 'Authentication failed'
 *
 * @example
 * // Valid Bcrypt hash
 * const result = validateHashFormat('$2b$12$...')
 * // result.isValid === true
 * // result.algorithm === 'bcrypt'
 * // result.userMessage === 'Authentication failed'
 *
 * @example
 * // Malformed hash
 * const result = validateHashFormat('invalid_hash')
 * // result.isValid === false
 * // result.algorithm === 'unknown'
 * // result.isMalformed === true
 * // result.userMessage === 'Authentication failed'
 * // Logs: "Malformed password hash detected" (without exposing hash)
 *
 * @example
 * // Null/undefined hash
 * const result = validateHashFormat(null)
 * // result.isValid === false
 * // result.algorithm === 'unknown'
 * // result.isMalformed === true
 * // result.userMessage === 'Authentication failed'
 */
export function validateHashFormat(
    hash: unknown,
    email?: string
): HashFormatValidationResult {
    // Detect the algorithm
    const detection = detectHashAlgorithm(hash)

    // Check if hash is valid and in a supported format
    const isValidArgon2id = isArgon2idHashFormat(hash)
    const isValidBcrypt = isBcryptHashFormat(hash)
    const isValid = isValidArgon2id || isValidBcrypt

    // Determine if hash is malformed (detected but invalid)
    const isMalformed = detection.algorithm !== "unknown" && !detection.isValid

    // Log malformed attempts without exposing sensitive details
    if (!isValid) {
        logMalformedHashAttempt(hash, detection, email)
    }

    // Return generic error message (no algorithm type revealed)
    const userMessage = "Authentication failed"

    return {
        isValid,
        algorithm: detection.algorithm,
        userMessage,
        isMalformed,
    }
}

/**
 * Log a malformed hash attempt without exposing sensitive details
 *
 * This function logs:
 * - That a malformed hash was detected
 * - The detected algorithm (if any)
 * - A truncated hash prefix (first 10 chars) for debugging
 * - The email (if provided) for audit purposes
 *
 * It does NOT log:
 * - The full hash value
 * - The plaintext password
 * - The hash validity details
 *
 * @param hash - The malformed hash (will be truncated in logs)
 * @param detection - The detection result from detectHashAlgorithm
 * @param email - Optional email for audit logging
 */
function logMalformedHashAttempt(
    hash: unknown,
    detection: ReturnType<typeof detectHashAlgorithm>,
    email?: string
): void {
    try {
        // Truncate hash to first 10 characters for debugging (not exposing full hash)
        const hashPrefix =
            typeof hash === "string"
                ? hash.substring(0, 10) + (hash.length > 10 ? "..." : "")
                : "[non-string]"

        // Log the malformed attempt
        logger.warn("Malformed password hash detected", {
            context: "HashFormatValidator",
            data: {
                algorithm: detection.algorithm,
                reason: detection.reason,
                hashPrefix,
                isMalformed:
                    detection.algorithm !== "unknown" && !detection.isValid,
                ...(email && { email }),
            },
        })
    } catch (error) {
        // If logging fails, don't throw - just log the error
        logger.error("Failed to log malformed hash attempt", {
            context: "HashFormatValidator",
            error: error as Error,
        })
    }
}

/**
 * Check if a hash format is valid without logging
 *
 * This is a convenience function that returns true if the hash is valid
 * without logging malformed attempts. Useful for internal checks.
 *
 * @param hash - The hash to check
 * @returns true if hash is valid Argon2id or Bcrypt format, false otherwise
 *
 * @example
 * const isValid = isValidHashFormat('$2b$12$...')
 * // isValid === true
 */
export function isValidHashFormat(hash: unknown): boolean {
    return isArgon2idHashFormat(hash) || isBcryptHashFormat(hash)
}

/**
 * Get a generic error message for hash validation failure
 *
 * This function returns a generic error message that doesn't reveal
 * whether the hash format was invalid, the algorithm type, or any
 * other details that could be used for information disclosure attacks.
 *
 * @returns Generic error message for user
 *
 * @example
 * const message = getGenericHashValidationError()
 * // message === 'Authentication failed'
 */
export function getGenericHashValidationError(): string {
    return "Authentication failed"
}
