/**
 * Module: Salt Generation for Argon2id Hashing
 * Purpose: Generate cryptographically secure random salts for password hashing
 *
 * This module handles:
 * - Generating cryptographically secure random salts using Node.js crypto
 * - Ensuring minimum 128-bit entropy (16 bytes) per OWASP recommendations
 * - Providing salts as Buffer or hex string formats
 * - Preventing manual salt specification in public API
 * - Automatic salt inclusion in Argon2id hash output
 *
 * Requirements covered:
 * - Requirement 2: Automatic Salt Generation (2.1-2.5)
 * - Requirement 1: Argon2id Password Hashing (1.1-1.6)
 * - Requirement 9: Security Against Attack Vectors (9.4)
 *
 * Security Properties:
 * - Uses crypto.randomBytes() for cryptographically secure randomness
 * - Never uses Math.random() or weak PRNG
 * - Minimum 16 bytes (128 bits) entropy per OWASP standards
 * - Each password gets unique salt (prevents rainbow table attacks)
 * - Salt is automatically included in Argon2id output hash
 */

import { randomBytes } from "crypto"

/**
 * Salt Configuration Constants
 * These ensure compliance with OWASP recommendations
 */
const SALT_CONFIG = {
    /** Minimum salt length in bytes (128 bits = 16 bytes per OWASP) */
    MIN_LENGTH_BYTES: 16,

    /** Default salt length in bytes (256 bits = 32 bytes for extra security) */
    DEFAULT_LENGTH_BYTES: 32,

    /** Maximum salt length in bytes (prevents excessive memory usage) */
    MAX_LENGTH_BYTES: 64,
} as const

/**
 * Generate a cryptographically secure random salt
 *
 * This function generates a salt suitable for use with Argon2id hashing.
 * The salt is generated using Node.js crypto.randomBytes() which provides
 * cryptographically secure randomness from the operating system's entropy pool.
 *
 * Key properties:
 * - Minimum 128-bit entropy (16 bytes) per OWASP recommendations
 * - Unique for each password (prevents rainbow table attacks)
 * - Automatically included in Argon2id hash output
 * - Never manually specified by caller (automatic only)
 *
 * @param lengthBytes - Optional salt length in bytes (default: 32, min: 16, max: 64)
 * @returns Buffer containing cryptographically secure random salt
 * @throws Error if lengthBytes is outside valid range
 *
 * @example
 * // Generate default 32-byte salt
 * const salt = generateSalt()
 * // salt will be a Buffer with 32 random bytes
 *
 * @example
 * // Generate minimum 16-byte salt (OWASP minimum)
 * const minSalt = generateSalt(16)
 * // minSalt will be a Buffer with 16 random bytes
 *
 * @example
 * // Generate 64-byte salt for extra security
 * const maxSalt = generateSalt(64)
 * // maxSalt will be a Buffer with 64 random bytes
 */
export function generateSalt(
    lengthBytes: number = SALT_CONFIG.DEFAULT_LENGTH_BYTES
): Buffer {
    // Validate length is within acceptable range
    if (!Number.isInteger(lengthBytes)) {
        throw new Error(
            `Salt length must be an integer, got: ${typeof lengthBytes} (${lengthBytes})`
        )
    }

    if (lengthBytes < SALT_CONFIG.MIN_LENGTH_BYTES) {
        throw new Error(
            `Salt length must be at least ${SALT_CONFIG.MIN_LENGTH_BYTES} bytes (128 bits), ` +
                `got: ${lengthBytes} bytes. OWASP recommends minimum 128-bit entropy.`
        )
    }

    if (lengthBytes > SALT_CONFIG.MAX_LENGTH_BYTES) {
        throw new Error(
            `Salt length must not exceed ${SALT_CONFIG.MAX_LENGTH_BYTES} bytes, ` +
                `got: ${lengthBytes} bytes`
        )
    }

    try {
        // Generate cryptographically secure random bytes
        // crypto.randomBytes() uses the operating system's entropy pool
        // This is NOT Math.random() or any weak PRNG
        const salt = randomBytes(lengthBytes)

        // Verify we got the expected number of bytes
        if (salt.length !== lengthBytes) {
            throw new Error(
                `Failed to generate ${lengthBytes} bytes of salt, got ${salt.length} bytes`
            )
        }

        return salt
    } catch (error) {
        if (
            error instanceof Error &&
            error.message.includes("Failed to generate")
        ) {
            throw error
        }
        throw new Error(
            `Failed to generate cryptographically secure salt: ${error instanceof Error ? error.message : "Unknown error"}`
        )
    }
}

/**
 * Generate a cryptographically secure random salt as hex string
 *
 * This is a convenience function that generates a salt and returns it as a hex string.
 * Useful for logging, storage, or transmission where binary format is inconvenient.
 *
 * @param lengthBytes - Optional salt length in bytes (default: 32, min: 16, max: 64)
 * @returns Hex string representation of the salt
 * @throws Error if lengthBytes is outside valid range
 *
 * @example
 * // Generate default 32-byte salt as hex
 * const saltHex = generateSaltHex()
 * // saltHex will be a 64-character hex string (32 bytes * 2 hex chars per byte)
 *
 * @example
 * // Generate 16-byte salt as hex
 * const minSaltHex = generateSaltHex(16)
 * // minSaltHex will be a 32-character hex string
 */
export function generateSaltHex(
    lengthBytes: number = SALT_CONFIG.DEFAULT_LENGTH_BYTES
): string {
    const salt = generateSalt(lengthBytes)
    return salt.toString("hex")
}

/**
 * Verify salt has minimum required entropy
 *
 * This function checks that a salt has at least the minimum required entropy
 * (128 bits = 16 bytes) as recommended by OWASP.
 *
 * @param salt - Salt as Buffer or hex string
 * @returns true if salt has sufficient entropy, false otherwise
 *
 * @example
 * const salt = generateSalt()
 * const isValid = verifySaltEntropy(salt)
 * // isValid will be true
 *
 * @example
 * const weakSalt = Buffer.alloc(8) // Only 64 bits
 * const isValid = verifySaltEntropy(weakSalt)
 * // isValid will be false
 */
export function verifySaltEntropy(salt: Buffer | string): boolean {
    try {
        let saltBuffer: Buffer

        if (typeof salt === "string") {
            // Convert hex string to Buffer
            saltBuffer = Buffer.from(salt, "hex")
        } else if (Buffer.isBuffer(salt)) {
            saltBuffer = salt
        } else {
            return false
        }

        // Check minimum entropy (16 bytes = 128 bits)
        return saltBuffer.length >= SALT_CONFIG.MIN_LENGTH_BYTES
    } catch {
        return false
    }
}

/**
 * Get salt configuration constants
 *
 * Useful for tests and documentation of salt requirements.
 *
 * @returns Object with salt configuration constants
 *
 * @example
 * const config = getSaltConfig()
 * console.log(config.MIN_LENGTH_BYTES) // 16
 * console.log(config.DEFAULT_LENGTH_BYTES) // 32
 */
export function getSaltConfig() {
    return { ...SALT_CONFIG }
}

/**
 * Validate salt format and entropy
 *
 * Comprehensive validation function that checks:
 * - Salt is provided
 * - Salt is Buffer or hex string
 * - Salt has minimum required entropy (128 bits)
 *
 * @param salt - Salt to validate
 * @returns Object with validation result and error message if invalid
 *
 * @example
 * const salt = generateSalt()
 * const result = validateSalt(salt)
 * // result will be { valid: true }
 *
 * @example
 * const weakSalt = Buffer.alloc(8)
 * const result = validateSalt(weakSalt)
 * // result will be { valid: false, error: "Salt must have minimum 128-bit entropy..." }
 */
export function validateSalt(salt: unknown): {
    valid: boolean
    error?: string
} {
    if (!salt) {
        return { valid: false, error: "Salt is required" }
    }

    if (!Buffer.isBuffer(salt) && typeof salt !== "string") {
        return {
            valid: false,
            error: "Salt must be a Buffer or hex string",
        }
    }

    if (typeof salt === "string") {
        // Validate hex string format
        if (!/^[a-f0-9]*$/i.test(salt)) {
            return {
                valid: false,
                error: "Salt hex string contains invalid characters",
            }
        }

        // Hex string should have even length (2 chars per byte)
        if (salt.length % 2 !== 0) {
            return {
                valid: false,
                error: "Salt hex string must have even length",
            }
        }
    }

    if (!verifySaltEntropy(salt)) {
        return {
            valid: false,
            error: `Salt must have minimum ${SALT_CONFIG.MIN_LENGTH_BYTES} bytes (128-bit entropy) per OWASP recommendations`,
        }
    }

    return { valid: true }
}
