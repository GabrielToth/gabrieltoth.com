/**
 * Session Tokens Module
 * Handles token generation, validation, and rotation
 *
 * Validates: Requirements 5.1, 5.2, 5.3, 5.5, 5.6, 5.7
 */

import { generateRandomHex } from "@/lib/crypto-utils"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { cookies } from "next/headers"

const { queryOne } = db

/**
 * Session token configuration constants
 */
export const SESSION_TOKEN_EXPIRATION_HOURS = 1
const TOKEN_LENGTH = 32 // 32 bytes = 256 bits

/**
 * Secure cookie options for session tokens (1 hour expiration)
 */
const SESSION_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
}

/**
 * Generate a cryptographically secure session token
 *
 * This function:
 * 1. Generates a cryptographically secure random token (32 bytes)
 * 2. Returns the token as a hex string
 *
 * @returns Cryptographically secure session token (64-character hex string)
 *
 * Validates: Requirements 5.1
 */
export function generateSessionToken(): string {
    try {
        const token = generateRandomHex(TOKEN_LENGTH)

        logger.debug("Session token generated", {
            context: "Auth",
            data: {
                tokenLength: token.length,
                tokenPreview: token.substring(0, 8) + "...",
            },
        })

        return token
    } catch (error) {
        logger.error("Failed to generate session token", {
            context: "Auth",
            error: error as Error,
        })
        throw error
    }
}

/**
 * Generate a cryptographically secure Remember Me token
 *
 * This function:
 * 1. Generates a cryptographically secure random token (32 bytes)
 * 2. Returns the token as a hex string
 *
 * @returns Cryptographically secure Remember Me token (64-character hex string)
 *
 * Validates: Requirements 5.2
 */
export function generateRememberMeToken(): string {
    try {
        const token = generateRandomHex(TOKEN_LENGTH)

        logger.debug("Remember Me token generated", {
            context: "Auth",
            data: {
                tokenLength: token.length,
                tokenPreview: token.substring(0, 8) + "...",
            },
        })

        return token
    } catch (error) {
        logger.error("Failed to generate Remember Me token", {
            context: "Auth",
            error: error as Error,
        })
        throw error
    }
}

/**
 * Store session token in a secure HTTP-Only cookie
 *
 * This function:
 * 1. Validates the token
 * 2. Sets a secure HTTP-Only cookie with 1-hour expiration
 * 3. Includes Secure and SameSite=Lax flags
 *
 * @param token - The session token to store
 * @throws Error if token is invalid or cookie setting fails
 *
 * Validates: Requirements 5.3
 */
export async function storeSessionToken(token: string): Promise<void> {
    try {
        // Validate token
        if (!token || typeof token !== "string" || token.length === 0) {
            throw new Error("Invalid session token provided")
        }

        // Get cookies from Next.js
        const cookieStore = await cookies()

        // Set secure cookie
        cookieStore.set("session_token", token, SESSION_COOKIE_OPTIONS)

        logger.debug("Session token stored in cookie", {
            context: "Auth",
            data: {
                tokenPreview: token.substring(0, 8) + "...",
                expirationHours: SESSION_TOKEN_EXPIRATION_HOURS,
            },
        })
    } catch (error) {
        logger.error("Failed to store session token", {
            context: "Auth",
            error: error as Error,
        })
        throw error
    }
}

/**
 * Validate a session token
 *
 * This function:
 * 1. Validates the token format
 * 2. Checks if token exists and is not expired
 * 3. Returns true if valid, false otherwise
 *
 * @param token - The session token to validate
 * @returns true if token is valid and not expired, false otherwise
 *
 * Validates: Requirements 5.5
 */
export async function validateSessionToken(token: string): Promise<boolean> {
    try {
        // Validate token format
        if (!token || typeof token !== "string" || token.length === 0) {
            logger.warn(
                "Invalid session token format provided for validation",
                {
                    context: "Auth",
                }
            )
            return false
        }

        // Check if token exists in sessions table
        const sessionToken = await queryOne<{
            id: string
            user_id: string
            token_hash: string
            expires_at: Date
        }>(
            `SELECT id, user_id, token_hash, expires_at
             FROM sessions
             WHERE token_hash = $1`,
            [token]
        )

        // Token not found
        if (!sessionToken) {
            logger.debug("Session token not found", {
                context: "Auth",
                data: { tokenPreview: token.substring(0, 8) + "..." },
            })
            return false
        }

        // Check if token is expired
        const now = new Date()
        const expiresAt = new Date(sessionToken.expires_at)

        if (expiresAt < now) {
            logger.debug("Session token expired", {
                context: "Auth",
                data: {
                    userId: sessionToken.user_id,
                    expiresAt: expiresAt.toISOString(),
                },
            })
            return false
        }

        // Token is valid
        logger.debug("Session token validated successfully", {
            context: "Auth",
            data: {
                userId: sessionToken.user_id,
                expiresAt: expiresAt.toISOString(),
            },
        })

        return true
    } catch (error) {
        logger.error("Failed to validate session token", {
            context: "Auth",
            error: error as Error,
            data: { tokenPreview: token?.substring(0, 8) + "..." },
        })
        throw error
    }
}

/**
 * Validate a Remember Me token
 *
 * This function:
 * 1. Validates the token format
 * 2. Checks if token exists and is not expired
 * 3. Returns true if valid, false otherwise
 *
 * @param token - The Remember Me token to validate
 * @returns true if token is valid and not expired, false otherwise
 *
 * Validates: Requirements 5.6
 */
export async function validateRememberMeToken(token: string): Promise<boolean> {
    try {
        // Validate token format
        if (!token || typeof token !== "string" || token.length === 0) {
            logger.warn(
                "Invalid Remember Me token format provided for validation",
                {
                    context: "Auth",
                }
            )
            return false
        }

        // Check if token exists in database
        const rememberMeToken = await queryOne<{
            id: string
            user_id: string
            token_hash: string
            expires_at: Date
        }>(
            `SELECT id, user_id, token_hash, expires_at
             FROM remember_me_tokens
             WHERE token_hash = $1`,
            [token]
        )

        // Token not found
        if (!rememberMeToken) {
            logger.debug("Remember Me token not found", {
                context: "Auth",
                data: { tokenPreview: token.substring(0, 8) + "..." },
            })
            return false
        }

        // Check if token is expired
        const now = new Date()
        const expiresAt = new Date(rememberMeToken.expires_at)

        if (expiresAt < now) {
            logger.debug("Remember Me token expired", {
                context: "Auth",
                data: {
                    userId: rememberMeToken.user_id,
                    expiresAt: expiresAt.toISOString(),
                },
            })
            return false
        }

        // Token is valid
        logger.debug("Remember Me token validated successfully", {
            context: "Auth",
            data: {
                userId: rememberMeToken.user_id,
                expiresAt: expiresAt.toISOString(),
            },
        })

        return true
    } catch (error) {
        logger.error("Failed to validate Remember Me token", {
            context: "Auth",
            error: error as Error,
            data: { tokenPreview: token?.substring(0, 8) + "..." },
        })
        throw error
    }
}

/**
 * Refresh a session token with full token rotation
 *
 * This function:
 * 1. Validates the old token exists and is not expired
 * 2. Generates a NEW cryptographically secure token
 * 3. DELETES the old session row
 * 4. INSERTS a new session row with the new token and extended expiry
 * 5. Returns the new token and expiration
 *
 * Token rotation prevents session fixation attacks and limits
 * the window of vulnerability if a token is compromised.
 *
 * @param token - The old session token to rotate
 * @returns Object with new token and expiresAt if successful, null if token invalid or expired
 * @throws Error if database operation fails
 *
 * Validates: Requirements 5.7
 */
export async function refreshSessionToken(
    token: string
): Promise<{ token: string; expiresAt: Date } | null> {
    try {
        // Validate token format
        if (!token || typeof token !== "string" || token.length === 0) {
            logger.warn("Invalid session token format provided for refresh", {
                context: "Auth",
            })
            return null
        }

        // Check if old token exists and is not expired
        const sessionRow = await queryOne<{
            id: string
            user_id: string
            expires_at: Date
        }>(
            `SELECT id, user_id, expires_at
             FROM sessions
             WHERE token_hash = $1`,
            [token]
        )

        // Token not found
        if (!sessionRow) {
            logger.debug("Session token not found for refresh", {
                context: "Auth",
                data: { tokenPreview: token.substring(0, 8) + "..." },
            })
            return null
        }

        // Check if token is expired
        const now = new Date()
        const expiresAt = new Date(sessionRow.expires_at)

        if (expiresAt < now) {
            logger.debug("Session token expired, cannot refresh", {
                context: "Auth",
                data: {
                    userId: sessionRow.user_id,
                    expiresAt: expiresAt.toISOString(),
                },
            })
            return null
        }

        // Generate new token and calculate new expiration
        const newToken = generateRandomHex(TOKEN_LENGTH)
        const newExpiresAt = new Date(
            now.getTime() + SESSION_TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000
        )

        // Token rotation: delete old session, insert new one with fresh token
        // This prevents session fixation: if the old token was compromised,
        // the attacker's copy becomes invalid after rotation.
        const result = await db.transaction(async client => {
            // Delete old session row
            await client.query("DELETE FROM sessions WHERE token_hash = $1", [
                token,
            ])

            // Insert new session row with rotated token
            const inserted = await client.query<{
                token_hash: string
                expires_at: Date
            }>(
                `INSERT INTO sessions (user_id, token_hash, created_at, expires_at)
                 VALUES ($1, $2, NOW(), $3)
                 RETURNING token_hash, expires_at`,
                [sessionRow.user_id, newToken, newExpiresAt]
            )

            return inserted.rows[0]
        })

        if (!result) {
            throw new Error("Failed to rotate session token")
        }

        logger.debug("Session token rotated successfully", {
            context: "Auth",
            data: {
                userId: sessionRow.user_id,
                newExpiresAt: newExpiresAt.toISOString(),
            },
        })

        return { token: newToken, expiresAt: newExpiresAt }
    } catch (error) {
        logger.error("Failed to refresh session token", {
            context: "Auth",
            error: error as Error,
            data: { tokenPreview: token?.substring(0, 8) + "..." },
        })
        throw error
    }
}
