/**
 * Password Hashing and Cryptography Functions
 * Provides secure password hashing and token generation
 * Validates: Requirements 1.6, 3.4, 5.6, 6.1
 */

import bcrypt from "bcrypt"
import { randomBytes } from "crypto"

/**
 * Salt rounds for bcrypt hashing
 * Higher values = more secure but slower
 * 12 is recommended for production
 */
const BCRYPT_SALT_ROUNDS = 12

/**
 * Token length in bytes
 * 32 bytes = 256 bits, which is cryptographically secure
 */
const TOKEN_LENGTH = 32

/**
 * Hashes a password using bcrypt
 * Requirement 1.6, 3.4, 5.6
 *
 * @param password - The plain text password to hash
 * @returns Promise resolving to the hashed password
 *
 * @example
 * const hash = await hashPassword('ValidPass123!')
 * // hash will be a bcrypt hash like: $2b$12$...
 */
export async function hashPassword(password: string): Promise<string> {
    if (!password || typeof password !== "string") {
        throw new Error("Password must be a non-empty string")
    }

    try {
        const hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
        return hash
    } catch (error) {
        throw new Error(
            `Failed to hash password: ${error instanceof Error ? error.message : "Unknown error"}`
        )
    }
}

/**
 * Compares a plain text password with a bcrypt hash
 * Requirement 3.4
 *
 * @param password - The plain text password to compare
 * @param hash - The bcrypt hash to compare against
 * @returns Promise resolving to true if password matches, false otherwise
 *
 * @example
 * const isMatch = await comparePassword('ValidPass123!', hash)
 * // isMatch will be true if password matches the hash
 */
export async function comparePassword(
    password: string,
    hash: string
): Promise<boolean> {
    if (!password || typeof password !== "string") {
        return false
    }

    if (!hash || typeof hash !== "string") {
        return false
    }

    try {
        const isMatch = await bcrypt.compare(password, hash)
        return isMatch
    } catch (error) {
        throw new Error(
            `Failed to compare password: ${error instanceof Error ? error.message : "Unknown error"}`
        )
    }
}

/**
 * Generates a cryptographically secure random token
 * Requirement 6.1
 *
 * @returns A random token as a hex string
 *
 * @example
 * const token = generateToken()
 * // token will be a 64-character hex string (32 bytes)
 */
export function generateToken(): string {
    try {
        const token = randomBytes(TOKEN_LENGTH).toString("hex")
        return token
    } catch (error) {
        throw new Error(
            `Failed to generate token: ${error instanceof Error ? error.message : "Unknown error"}`
        )
    }
}

/**
 * Generates a CSRF token
 * Requirement 6.1
 *
 * CSRF tokens are used to prevent Cross-Site Request Forgery attacks
 * They should be unique per session and validated on form submission
 *
 * @returns A random CSRF token as a hex string
 *
 * @example
 * const csrfToken = generateCsrfToken()
 * // csrfToken will be a 64-character hex string
 */
export function generateCsrfToken(): string {
    return generateToken()
}

/**
 * Generates an email verification token
 * Requirement 2.1
 *
 * @returns A random verification token as a hex string
 *
 * @example
 * const verificationToken = generateVerificationToken()
 * // verificationToken will be a 64-character hex string
 */
export function generateVerificationToken(): string {
    return generateToken()
}

/**
 * Generates a password reset token
 * Requirement 5.2, 5.8
 *
 * @returns A random password reset token as a hex string
 *
 * @example
 * const resetToken = generatePasswordResetToken()
 * // resetToken will be a 64-character hex string
 */
export function generatePasswordResetToken(): string {
    return generateToken()
}

/**
 * Validates token format
 * Requirement 2.1, 5.8
 *
 * Checks if a token is in the expected format (64-character hex string)
 *
 * @param token - The token to validate
 * @returns Object with isValid boolean and error message if invalid
 *
 * @example
 * validateToken('abc123...') // { isValid: true }
 * validateToken('invalid') // { isValid: false, error: 'Invalid token format' }
 */
export function validateToken(token: string): {
    isValid: boolean
    error?: string
} {
    if (!token || typeof token !== "string") {
        return { isValid: false, error: "Token is required" }
    }

    // Token should be 64 characters (32 bytes in hex)
    if (token.length !== 64) {
        return { isValid: false, error: "Invalid token format" }
    }

    // Token should be valid hex
    if (!/^[a-f0-9]{64}$/i.test(token)) {
        return { isValid: false, error: "Invalid token format" }
    }

    return { isValid: true }
}

/**
 * Checks if a token has expired
 * Requirement 2.1, 5.8
 *
 * @param expiresAt - The expiration date/time
 * @returns true if token has expired, false otherwise
 *
 * @example
 * const expired = isTokenExpired(new Date(Date.now() - 1000))
 * // expired will be true
 */
export function isTokenExpired(expiresAt: Date): boolean {
    if (!expiresAt || !(expiresAt instanceof Date)) {
        return true
    }

    return new Date() > expiresAt
}

/**
 * Generates an expiration date for a token
 * Requirement 2.1, 5.8
 *
 * @param expirationMinutes - Number of minutes until expiration (default: 60)
 * @returns Date object representing when the token expires
 *
 * @example
 * const expiresAt = getTokenExpirationDate(60)
 * // expiresAt will be 60 minutes from now
 */
export function getTokenExpirationDate(expirationMinutes: number = 60): Date {
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes)
    return expiresAt
}

/**
 * Generates an email verification token with expiration
 * Requirement 2.1
 *
 * @param expirationMinutes - Number of minutes until expiration (default: 24 hours = 1440 minutes)
 * @returns Object with token and expiresAt
 *
 * @example
 * const { token, expiresAt } = generateEmailVerificationTokenWithExpiration()
 * // token will be a 64-character hex string
 * // expiresAt will be 24 hours from now
 */
export function generateEmailVerificationTokenWithExpiration(
    expirationMinutes: number = 1440
): { token: string; expiresAt: Date } {
    return {
        token: generateVerificationToken(),
        expiresAt: getTokenExpirationDate(expirationMinutes),
    }
}

/**
 * Generates a password reset token with expiration
 * Requirement 5.2, 5.8
 *
 * @param expirationMinutes - Number of minutes until expiration (default: 60 minutes = 1 hour)
 * @returns Object with token and expiresAt
 *
 * @example
 * const { token, expiresAt } = generatePasswordResetTokenWithExpiration()
 * // token will be a 64-character hex string
 * // expiresAt will be 1 hour from now
 */
export function generatePasswordResetTokenWithExpiration(
    expirationMinutes: number = 60
): { token: string; expiresAt: Date } {
    return {
        token: generatePasswordResetToken(),
        expiresAt: getTokenExpirationDate(expirationMinutes),
    }
}
