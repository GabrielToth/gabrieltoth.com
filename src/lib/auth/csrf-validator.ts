/**
 * CSRF Token Validation Module
 * Implements Cross-Site Request Forgery protection with secure token generation and validation
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */

import { generateRandomHex } from "@/lib/crypto-utils"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

const { query, queryOne } = db

/**
 * CSRF token configuration
 */
const CSRF_TOKEN_LENGTH = 32 // 32 bytes = 256 bits
const CSRF_TOKEN_EXPIRATION_MINUTES = 60 // 1 hour

/**
 * Generate a cryptographically secure CSRF token
 * Requirement 4.1
 *
 * @returns A random CSRF token as a hex string (64 characters)
 *
 * @example
 * const token = generateCSRFToken()
 * // token will be a 64-character hex string
 */
export function generateCSRFToken(): string {
    try {
        const token = generateRandomHex(CSRF_TOKEN_LENGTH)
        return token
    } catch (error) {
        logger.error("Failed to generate CSRF token", {
            context: "CSRF",
            error: error as Error,
        })
        throw error
    }
}

/**
 * Store a CSRF token in the database
 * Requirement 4.3
 *
 * @param token - The CSRF token to store
 * @returns Promise resolving when token is stored
 *
 * @example
 * await storeCSRFToken(token)
 */
export async function storeCSRFToken(token: string): Promise<void> {
    try {
        if (!token || typeof token !== "string") {
            throw new Error("Invalid token provided")
        }

        // Calculate expiration time
        const expiresAt = new Date(
            Date.now() + CSRF_TOKEN_EXPIRATION_MINUTES * 60 * 1000
        )

        // Hash the token for storage using SHA256 (never store plain tokens)
        const crypto = await import("crypto")
        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex")

        // Store in database
        await query(
            `INSERT INTO csrf_tokens (token_hash, expires_at)
             VALUES ($1, $2)`,
            [tokenHash, expiresAt]
        )

        logger.debug("CSRF token stored", {
            context: "CSRF",
            data: { tokenHash: tokenHash.substring(0, 8) + "..." },
        })
    } catch (error) {
        logger.error("Failed to store CSRF token", {
            context: "CSRF",
            error: error as Error,
        })
        throw error
    }
}

/**
 * Validate a CSRF token
 * Requirement 4.2
 *
 * @param token - The CSRF token to validate
 * @returns true if token is valid and not expired, false otherwise
 *
 * @example
 * const isValid = await validateCSRFToken(token)
 */
export async function validateCSRFToken(token: string): Promise<boolean> {
    try {
        if (!token || typeof token !== "string") {
            logger.warn("Invalid CSRF token provided for validation", {
                context: "CSRF",
            })
            return false
        }

        // Hash the token for lookup using SHA256
        const crypto = await import("crypto")
        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex")

        // Query for the token
        const result = await queryOne<{ id: string; expires_at: Date }>(
            `SELECT id, expires_at FROM csrf_tokens WHERE token_hash = $1`,
            [tokenHash]
        )

        // Token not found
        if (!result) {
            logger.warn("CSRF token not found", {
                context: "CSRF",
                data: { tokenHash: tokenHash.substring(0, 8) + "..." },
            })
            return false
        }

        // Check if token is expired
        const expiresAt = new Date(result.expires_at)
        if (expiresAt < new Date()) {
            logger.warn("CSRF token expired", {
                context: "CSRF",
                data: { expiresAt: expiresAt.toISOString() },
            })

            // Delete expired token
            await query(`DELETE FROM csrf_tokens WHERE id = $1`, [result.id])

            return false
        }

        // Delete token after validation (one-time use)
        await query(`DELETE FROM csrf_tokens WHERE id = $1`, [result.id])

        logger.debug("CSRF token validated successfully", {
            context: "CSRF",
        })

        return true
    } catch (error) {
        logger.error("Failed to validate CSRF token", {
            context: "CSRF",
            error: error as Error,
        })
        throw error
    }
}

/**
 * Retrieve a CSRF token from a cookie
 * Requirement 4.4
 *
 * @param request - The NextRequest object
 * @returns The CSRF token from the cookie, or null if not found
 *
 * @example
 * const token = getCSRFTokenFromCookie(request)
 */
export function getCSRFTokenFromCookie(request: NextRequest): string | null {
    try {
        const csrfCookie = request.cookies.get("csrf_token")

        if (!csrfCookie || !csrfCookie.value) {
            return null
        }

        return csrfCookie.value
    } catch (error) {
        logger.error("Failed to get CSRF token from cookie", {
            context: "CSRF",
            error: error as Error,
        })
        return null
    }
}

/**
 * Clean up expired CSRF tokens
 * Should be called periodically via cron job
 *
 * @returns Number of tokens deleted
 *
 * @example
 * const deleted = await cleanupExpiredCSRFTokens()
 */
export async function cleanupExpiredCSRFTokens(): Promise<number> {
    try {
        const result = await query(
            `DELETE FROM csrf_tokens WHERE expires_at < NOW()`
        )

        const deletedCount = result.rowCount || 0

        logger.debug("Expired CSRF tokens cleaned up", {
            context: "CSRF",
            data: { deletedCount },
        })

        return deletedCount
    } catch (error) {
        logger.error("Failed to cleanup expired CSRF tokens", {
            context: "CSRF",
            error: error as Error,
        })
        throw error
    }
}

// Import NextRequest for type hints
import { NextRequest } from "next/server"
