/**
 * Module: Hash Algorithm Detection
 * Purpose: Detect which password hashing algorithm was used (Argon2id vs Bcrypt)
 *
 * This module handles:
 * - Detecting Argon2id hash format ($argon2id$v=19$...)
 * - Detecting Bcrypt hash format ($2a$, $2b$, $2x$, $2y$)
 * - Extracting version information from hashes
 * - Handling edge cases (null, empty, malformed)
 * - Case-insensitive detection
 * - Graceful failure (return 'unknown' instead of throwing)
 *
 * Requirements covered:
 * - Requirement 5.1: Detect if stored hash is Bcrypt format
 * - Requirement 5.2: Detect if stored hash is Argon2id format
 * - Requirement 6.4: Verify hash format matches expected algorithm format
 * - Requirement 8.4: Verify hash format matches expected algorithm format
 * - Requirement 8.5: Reject invalid hash format and log malformed attempt
 *
 * Hash Formats:
 * - Argon2id: $argon2id$v=19$m=64000,t=3,p=2$SALT$HASH
 * - Bcrypt: $2a$12$SALT+HASH or $2b$12$SALT+HASH or $2x$12$SALT+HASH or $2y$12$SALT+HASH
 *
 * Detection Strategy:
 * 1. Check for null/undefined/empty string → return 'unknown'
 * 2. Convert to lowercase for case-insensitive matching
 * 3. Check for Argon2id prefix ($argon2id$v=19$)
 * 4. Check for Bcrypt prefixes ($2a$, $2b$, $2x$, $2y$)
 * 5. Return 'unknown' for anything else
 */

/**
 * Result of hash algorithm detection
 */
export interface HashAlgorithmDetectionResult {
    /** The detected algorithm: 'argon2id', 'bcrypt', or 'unknown' */
    algorithm: "argon2id" | "bcrypt" | "unknown"

    /** Version number if detected (e.g., 19 for Argon2id, 2 for Bcrypt) */
    version?: number

    /** Whether the hash format appears valid for the detected algorithm */
    isValid: boolean

    /** Detailed reason for detection (for logging/debugging) */
    reason: string
}

/**
 * Detect which password hashing algorithm was used to create a hash
 *
 * This function analyzes the hash format to determine if it was created with:
 * - Argon2id: Modern memory-hard algorithm
 * - Bcrypt: Legacy CPU-hard algorithm
 * - Unknown: Unrecognized format
 *
 * The detection is:
 * - Case-insensitive (handles both uppercase and lowercase)
 * - Graceful (returns 'unknown' instead of throwing)
 * - Non-destructive (doesn't modify the hash)
 * - Fast (simple string pattern matching)
 *
 * Edge cases handled:
 * - null/undefined → 'unknown'
 * - Empty string → 'unknown'
 * - Malformed hashes → 'unknown'
 * - Partial hashes → 'unknown'
 * - Non-string input → 'unknown'
 *
 * @param hash - The password hash to analyze (can be null/undefined)
 * @returns HashAlgorithmDetectionResult with algorithm, version, validity, and reason
 *
 * @example
 * // Detect Argon2id hash
 * const result = detectHashAlgorithm('$argon2id$v=19$m=64000,t=3,p=2$...')
 * // result.algorithm === 'argon2id'
 * // result.version === 19
 * // result.isValid === true
 *
 * @example
 * // Detect Bcrypt hash
 * const result = detectHashAlgorithm('$2b$12$...')
 * // result.algorithm === 'bcrypt'
 * // result.version === 2
 * // result.isValid === true
 *
 * @example
 * // Handle unknown format
 * const result = detectHashAlgorithm('invalid_hash_format')
 * // result.algorithm === 'unknown'
 * // result.isValid === false
 * // result.reason === 'Hash does not match any known algorithm format'
 *
 * @example
 * // Handle null/undefined
 * const result = detectHashAlgorithm(null)
 * // result.algorithm === 'unknown'
 * // result.isValid === false
 * // result.reason === 'Hash is null or undefined'
 */
export function detectHashAlgorithm(
    hash: unknown
): HashAlgorithmDetectionResult {
    // Handle null/undefined
    if (hash === null || hash === undefined) {
        return {
            algorithm: "unknown",
            isValid: false,
            reason: "Hash is null or undefined",
        }
    }

    // Handle non-string input
    if (typeof hash !== "string") {
        return {
            algorithm: "unknown",
            isValid: false,
            reason: `Hash must be a string, got: ${typeof hash}`,
        }
    }

    // Handle empty string
    if (hash.length === 0) {
        return {
            algorithm: "unknown",
            isValid: false,
            reason: "Hash is an empty string",
        }
    }

    // Convert to lowercase for case-insensitive matching
    const lowerHash = hash.toLowerCase()

    // Check for Argon2id format: $argon2id$v=19$...
    // Argon2id hashes start with: $argon2id$v=19$
    if (lowerHash.startsWith("$argon2id$v=19$")) {
        // Validate basic structure: should have at least 5 parts separated by $
        // Format: $argon2id$v=19$m=...,t=...,p=...$SALT$HASH
        const parts = hash.split("$")

        if (parts.length >= 6) {
            // parts[0] = '' (empty before first $)
            // parts[1] = 'argon2id'
            // parts[2] = 'v=19'
            // parts[3] = 'm=...,t=...,p=...'
            // parts[4] = 'SALT'
            // parts[5] = 'HASH'

            // Check if parameters part contains expected format
            const paramsValid =
                parts[3] &&
                parts[3].includes("m=") &&
                parts[3].includes("t=") &&
                parts[3].includes("p=")

            // Check if salt and hash are present
            const saltHashValid = parts[4] && parts[5]

            if (paramsValid && saltHashValid) {
                return {
                    algorithm: "argon2id",
                    version: 19,
                    isValid: true,
                    reason: "Valid Argon2id hash format detected",
                }
            } else {
                return {
                    algorithm: "argon2id",
                    version: 19,
                    isValid: false,
                    reason: "Argon2id format detected but hash structure is malformed",
                }
            }
        } else {
            return {
                algorithm: "argon2id",
                version: 19,
                isValid: false,
                reason: "Argon2id format detected but hash is incomplete",
            }
        }
    }

    // Check for Bcrypt format: $2a$, $2b$, $2x$, $2y$
    // Bcrypt hashes have format: $2[aby]$COST$SALT+HASH
    // where COST is 2 digits (e.g., 12)

    // First check for invalid characters (whitespace, newlines, etc.)
    if (/\s/.test(hash)) {
        return {
            algorithm: "unknown",
            isValid: false,
            reason: "Hash contains whitespace or control characters",
        }
    }

    const bcryptMatch = lowerHash.match(/^\$2[aby]\$\d{2}\$/)

    if (bcryptMatch) {
        // Extract version from the hash
        // $2a$, $2b$, $2x$, $2y$ all have version 2
        const versionChar = hash[2] // Get original case version char

        // Validate basic structure
        // Format: $2[aby]$COST$SALT+HASH
        // Total length should be at least 60 characters (standard bcrypt)
        if (hash.length >= 60) {
            return {
                algorithm: "bcrypt",
                version: 2,
                isValid: true,
                reason: `Valid Bcrypt hash format detected (variant: $2${versionChar}$)`,
            }
        } else {
            return {
                algorithm: "bcrypt",
                version: 2,
                isValid: false,
                reason: "Bcrypt format detected but hash is incomplete or too short",
            }
        }
    }

    // Check for Bcrypt $2x$ variant (rare, but valid)
    if (lowerHash.startsWith("$2x$")) {
        const versionChar = hash[2]

        if (hash.length >= 60) {
            return {
                algorithm: "bcrypt",
                version: 2,
                isValid: true,
                reason: `Valid Bcrypt hash format detected (variant: $2${versionChar}$)`,
            }
        } else {
            return {
                algorithm: "bcrypt",
                version: 2,
                isValid: false,
                reason: "Bcrypt format detected but hash is incomplete or too short",
            }
        }
    }

    // Unknown format
    return {
        algorithm: "unknown",
        isValid: false,
        reason: "Hash does not match any known algorithm format (expected $argon2id$ or $2[aby]$)",
    }
}

/**
 * Check if a hash is in Argon2id format
 *
 * This is a convenience function that returns true if the hash is Argon2id.
 *
 * @param hash - The hash to check
 * @returns true if hash is valid Argon2id format, false otherwise
 *
 * @example
 * const isArgon2id = isArgon2idHashFormat('$argon2id$v=19$...')
 * // isArgon2id === true
 */
export function isArgon2idHashFormat(hash: unknown): boolean {
    const result = detectHashAlgorithm(hash)
    return result.algorithm === "argon2id" && result.isValid
}

/**
 * Check if a hash is in Bcrypt format
 *
 * This is a convenience function that returns true if the hash is Bcrypt.
 *
 * @param hash - The hash to check
 * @returns true if hash is valid Bcrypt format, false otherwise
 *
 * @example
 * const isBcrypt = isBcryptHashFormat('$2b$12$...')
 * // isBcrypt === true
 */
export function isBcryptHashFormat(hash: unknown): boolean {
    const result = detectHashAlgorithm(hash)
    return result.algorithm === "bcrypt" && result.isValid
}

/**
 * Get a human-readable description of the detected algorithm
 *
 * Useful for logging and error messages.
 *
 * @param hash - The hash to analyze
 * @returns Human-readable description of the algorithm
 *
 * @example
 * const description = getAlgorithmDescription('$2b$12$...')
 * // description === 'Bcrypt (version 2)'
 */
export function getAlgorithmDescription(hash: unknown): string {
    const result = detectHashAlgorithm(hash)

    switch (result.algorithm) {
        case "argon2id":
            return `Argon2id (version ${result.version})`
        case "bcrypt":
            return `Bcrypt (version ${result.version})`
        case "unknown":
            return "Unknown algorithm"
        default:
            return "Unknown algorithm"
    }
}
