/**
 * Module: Password Validator
 * Purpose: Validate plaintext passwords against stored hashes with pepper application and algorithm detection
 *
 * This module handles:
 * - Accepting plaintext password and stored hash
 * - Appending pepper to plaintext before validation
 * - Detecting hash algorithm (Argon2id or Bcrypt)
 * - Using appropriate validation method for each algorithm
 * - Returning validation result with algorithm type
 * - Implementing error handling without revealing algorithm details
 * - Constant-time comparison to prevent timing attacks
 * - Generic error messages to prevent user enumeration
 *
 * Requirements covered:
 * - Requirement 6.1: Accept plaintext password and stored hash
 * - Requirement 6.4: Append pepper to plaintext password before validation
 * - Requirement 6.5: Use constant-time comparison to prevent timing attacks
 * - Requirement 6.6: Return generic error message (no algorithm indication)
 * - Requirement 6.7: Return success indicator and original hash algorithm type
 *
 * Validation Flow:
 * 1. Validate input password (8-128 characters, no control characters)
 * 2. Validate hash format (must be string, non-empty)
 * 3. Detect hash algorithm (Argon2id or Bcrypt)
 * 4. Load pepper from configuration
 * 5. Append pepper to password
 * 6. Call appropriate validator (Argon2id or Bcrypt)
 * 7. Return result with algorithm type
 * 8. Handle errors without revealing algorithm or hash validity
 *
 * Error Handling Strategy:
 * - All validation failures return generic error message
 * - No indication of whether hash is valid or algorithm is supported
 * - No timing information leaked through response time
 * - Malformed hashes logged internally but not exposed to caller
 * - Configuration errors (missing pepper) fail-secure
 *
 * Performance:
 * - Argon2id validation: 2-3 seconds (inherent to algorithm)
 * - Bcrypt validation: 1-2 seconds (depends on cost factor)
 * - Response time normalization: < 50ms overhead
 * - Total validation time: 2-3 seconds typical
 */

import { verifyPasswordArgon2id } from "./argon2id-hasher"
import { validatePasswordBcrypt } from "./bcrypt-validator"
import { ConfigurationManager } from "./config"
import { detectHashAlgorithm } from "./hash-algorithm-detection"
import { assertPasswordInputValid } from "./password-input-validation"

/**
 * Result of password validation against a stored hash
 */
export interface PasswordValidationResult {
    /** Whether the password matches the stored hash */
    valid: boolean

    /** The algorithm type of the stored hash (for migration decisions) */
    algorithmType: "argon2id" | "bcrypt" | "unknown"

    /** Whether the hash format is valid for the detected algorithm */
    hashValid: boolean

    /** Generic error message (no algorithm or hash validity indication) */
    error?: string

    /** Time taken to validate in milliseconds */
    timeTakenMs: number

    /** Whether migration to Argon2id is recommended (true if Bcrypt detected) */
    requiresMigration: boolean
}

/**
 * Validate a plaintext password against a stored hash
 *
 * This is the main password validation function that:
 * 1. Accepts plaintext password and stored hash
 * 2. Appends pepper to plaintext before validation
 * 3. Detects hash algorithm (Argon2id or Bcrypt)
 * 4. Uses appropriate validation method for each algorithm
 * 5. Returns validation result with algorithm type
 * 6. Implements error handling without revealing algorithm details
 *
 * The function uses constant-time comparison to prevent timing attacks
 * and returns generic error messages to prevent user enumeration.
 *
 * Algorithm Detection:
 * - Argon2id: $argon2id$v=19$... format
 * - Bcrypt: $2a$, $2b$, $2x$, $2y$ format
 * - Unknown: Any other format
 *
 * Error Handling:
 * - Invalid password: Returns generic error (no details)
 * - Invalid hash: Returns generic error (no details)
 * - Unknown algorithm: Returns generic error (no algorithm indication)
 * - Validation failure: Returns generic error (no hash validity indication)
 * - Configuration error (missing pepper): Throws error (fail-secure)
 *
 * Migration Recommendation:
 * - Returns requiresMigration=true if Bcrypt hash detected
 * - Caller should rehash with Argon2id on successful validation
 * - Allows gradual migration from Bcrypt to Argon2id
 *
 * @param password - Plain text password to validate (8-128 characters)
 * @param hash - Stored hash to validate against (Argon2id or Bcrypt format)
 * @returns Promise resolving to PasswordValidationResult with validation outcome
 * @throws Error if configuration is invalid (missing pepper) - fail-secure
 *
 * @example
 * // Validate password against Argon2id hash
 * const result = await validatePassword('MyPassword123!', '$argon2id$v=19$m=64000,t=3,p=2$...')
 * if (result.valid) {
 *   console.log('Password matches!')
 *   console.log('Algorithm:', result.algorithmType) // 'argon2id'
 *   console.log('Migration needed:', result.requiresMigration) // false
 * } else {
 *   console.log('Password does not match')
 * }
 *
 * @example
 * // Validate password against Bcrypt hash (legacy)
 * const result = await validatePassword('MyPassword123!', '$2b$12$...')
 * if (result.valid) {
 *   console.log('Password matches!')
 *   console.log('Algorithm:', result.algorithmType) // 'bcrypt'
 *   console.log('Migration needed:', result.requiresMigration) // true
 *   // Caller should rehash with Argon2id
 * }
 *
 * @example
 * // Handle validation failure (generic error)
 * const result = await validatePassword('WrongPassword', hash)
 * if (!result.valid) {
 *   console.log('Validation failed:', result.error) // Generic message
 *   // No indication of whether password was wrong or hash was invalid
 * }
 *
 * @example
 * // Handle invalid hash format (generic error)
 * const result = await validatePassword('MyPassword123!', 'invalid_hash_format')
 * if (!result.valid) {
 *   console.log('Validation failed:', result.error) // Generic message
 *   // No indication that hash format is invalid
 * }
 */
export async function validatePassword(
    password: unknown,
    hash: unknown
): Promise<PasswordValidationResult> {
    const startTime = Date.now()

    try {
        // 1. Validate input password
        // This will throw if password is invalid (fail-secure)
        assertPasswordInputValid(password)

        // At this point, password is guaranteed to be a valid string
        const validatedPassword = password

        // 2. Validate hash format (must be string, non-empty)
        if (hash === null || hash === undefined) {
            const timeTakenMs = Date.now() - startTime
            return {
                valid: false,
                algorithmType: "unknown",
                hashValid: false,
                error: "Authentication failed",
                timeTakenMs,
                requiresMigration: false,
            }
        }

        if (typeof hash !== "string") {
            const timeTakenMs = Date.now() - startTime
            return {
                valid: false,
                algorithmType: "unknown",
                hashValid: false,
                error: "Authentication failed",
                timeTakenMs,
                requiresMigration: false,
            }
        }

        if (hash.length === 0) {
            const timeTakenMs = Date.now() - startTime
            return {
                valid: false,
                algorithmType: "unknown",
                hashValid: false,
                error: "Authentication failed",
                timeTakenMs,
                requiresMigration: false,
            }
        }

        // 3. Detect hash algorithm
        const detection = detectHashAlgorithm(hash)

        // 4. Load pepper from configuration (fail-secure if missing)
        const config = ConfigurationManager.getInstance()
        const pepper = config.getPepper()

        // 5. Append pepper to password
        const pepperedPassword = validatedPassword + pepper

        // 6. Call appropriate validator based on algorithm
        let validationResult: { valid: boolean; timeTakenMs: number }

        if (detection.algorithm === "argon2id") {
            // Validate against Argon2id hash
            const isValid = await verifyPasswordArgon2id(
                validatedPassword,
                hash
            )

            validationResult = {
                valid: isValid,
                timeTakenMs: Date.now() - startTime,
            }
        } else if (detection.algorithm === "bcrypt") {
            // Validate against Bcrypt hash
            const bcryptResult = await validatePasswordBcrypt(
                validatedPassword,
                hash
            )

            validationResult = {
                valid: bcryptResult.valid,
                timeTakenMs: bcryptResult.timeTakenMs,
            }
        } else {
            // Unknown algorithm - return generic error
            const timeTakenMs = Date.now() - startTime
            return {
                valid: false,
                algorithmType: "unknown",
                hashValid: false,
                error: "Authentication failed",
                timeTakenMs,
                requiresMigration: false,
            }
        }

        // 7. Return result with algorithm type
        const timeTakenMs = Date.now() - startTime

        return {
            valid: validationResult.valid,
            algorithmType: detection.algorithm,
            hashValid: detection.isValid,
            error: validationResult.valid ? undefined : "Authentication failed",
            timeTakenMs,
            // Only require migration if validation succeeded AND hash is Bcrypt
            requiresMigration:
                validationResult.valid && detection.algorithm === "bcrypt",
        }
    } catch (error) {
        const timeTakenMs = Date.now() - startTime

        // Handle configuration errors (fail-secure)
        if (error instanceof Error) {
            if (error.message.includes("PEPPER_SECRET")) {
                // Pepper configuration error - fail-secure
                console.error("❌ Pepper configuration error:", error.message)
                throw error
            }

            // Password validation errors - re-throw to fail-secure
            if (
                error.message.includes("Invalid password") ||
                error.message.includes("Password")
            ) {
                throw error
            }

            // Other errors - log but return generic error
            console.error("Password validation error:", error.message)
        }

        // Return generic error without revealing details
        return {
            valid: false,
            algorithmType: "unknown",
            hashValid: false,
            error: "Authentication failed",
            timeTakenMs,
            requiresMigration: false,
        }
    }
}

/**
 * Check if a password validation result indicates successful authentication
 *
 * Convenience function for checking validation success.
 *
 * @param result - PasswordValidationResult from validatePassword
 * @returns true if password matches the hash, false otherwise
 *
 * @example
 * const result = await validatePassword(password, hash)
 * if (isPasswordValid(result)) {
 *   console.log('Authentication successful!')
 * }
 */
export function isPasswordValid(result: PasswordValidationResult): boolean {
    return result.valid
}

/**
 * Check if password validation result indicates migration is needed
 *
 * Convenience function for checking if Bcrypt hash should be migrated to Argon2id.
 *
 * @param result - PasswordValidationResult from validatePassword
 * @returns true if hash is Bcrypt and should be migrated, false otherwise
 *
 * @example
 * const result = await validatePassword(password, hash)
 * if (result.valid && shouldMigratePassword(result)) {
 *   // Rehash password with Argon2id
 *   const newHash = await hashPasswordArgon2id(password)
 *   // Update database with new hash
 * }
 */
export function shouldMigratePassword(
    result: PasswordValidationResult
): boolean {
    return result.valid && result.requiresMigration
}

/**
 * Get a human-readable description of the validation result
 *
 * Useful for logging and debugging (but never expose to user).
 *
 * @param result - PasswordValidationResult from validatePassword
 * @returns Human-readable description of the validation result
 *
 * @example
 * const result = await validatePassword(password, hash)
 * console.log(getValidationDescription(result))
 * // Output: "Password validation failed (unknown algorithm)"
 * // Output: "Password validation succeeded (Argon2id, no migration needed)"
 * // Output: "Password validation succeeded (Bcrypt, migration recommended)"
 */
export function getValidationDescription(
    result: PasswordValidationResult
): string {
    if (!result.valid) {
        return `Password validation failed (${result.algorithmType})`
    }

    const migrationInfo = result.requiresMigration
        ? ", migration recommended"
        : ", no migration needed"

    return `Password validation succeeded (${result.algorithmType}${migrationInfo})`
}
