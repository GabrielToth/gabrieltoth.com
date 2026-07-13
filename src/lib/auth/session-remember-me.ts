/**
 * Session Remember Me Module
 * Handles Remember Me token CRUD operations and cookie storage
 *
 * Validates: Requirements 5.2, 5.4, 5.6
 */

import { generateRandomHex } from "@/lib/crypto-utils"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { RememberMeToken } from "@/types/auth"
import { cookies } from "next/headers"

const { queryOne, query } = db

/**
 * Remember Me token configuration constants
 */
export const REMEMBER_ME_TOKEN_EXPIRATION_DAYS = 30
const TOKEN_LENGTH = 32 // 32 bytes = 256 bits

/**
 * Secure cookie options for Remember Me tokens (30 days expiration)
 */
export const REMEMBER_ME_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: REMEMBER_ME_TOKEN_EXPIRATION_DAYS * 24 * 60 * 60, // 30 days in seconds
    path: "/",
}

/**
 * Store Remember Me token in a secure HTTP-Only cookie
 *
 * This function:
 * 1. Validates the token
 * 2. Sets a secure HTTP-Only cookie with 30-day expiration
 * 3. Includes Secure and SameSite=Lax flags
 *
 * @param token - The Remember Me token to store
 * @throws Error if token is invalid or cookie setting fails
 *
 * Validates: Requirements 5.4
 */
export async function storeRememberMeToken(token: string): Promise<void> {
    try {
        // Validate token
        if (!token || typeof token !== "string" || token.length === 0) {
            throw new Error("Invalid Remember Me token provided")
        }

        // Get cookies from Next.js
        const cookieStore = await cookies()

        // Set secure cookie
        cookieStore.set("remember_me_token", token, REMEMBER_ME_COOKIE_OPTIONS)

        logger.debug("Remember Me token stored in cookie", {
            context: "Auth",
            data: {
                tokenPreview: token.substring(0, 8) + "...",
                expirationDays: REMEMBER_ME_TOKEN_EXPIRATION_DAYS,
            },
        })
    } catch (error) {
        logger.error("Failed to store Remember Me token", {
            context: "Auth",
            error: error as Error,
        })
        throw error
    }
}

/**
 * Get a Remember Me token from the database
 *
 * @param token - The Remember Me token to look up
 * @returns RememberMeToken row if found, null otherwise
 */
export async function getRememberMeToken(
    token: string
): Promise<RememberMeToken | null> {
    try {
        if (!token || typeof token !== "string" || token.length === 0) {
            return null
        }

        const row = await queryOne<RememberMeToken>(
            `SELECT id, user_id, token_hash, expires_at, created_at, ip_address, user_agent
             FROM remember_me_tokens
             WHERE token_hash = $1`,
            [token]
        )

        if (!row) {
            return null
        }

        // Check if expired
        if (new Date(row.expires_at) < new Date()) {
            // Clean up expired token
            await query(
                "DELETE FROM remember_me_tokens WHERE token_hash = $1",
                [token]
            )
            return null
        }

        return row
    } catch (error) {
        logger.error("Failed to get Remember Me token", {
            context: "Auth",
            error: error as Error,
            data: { tokenPreview: token?.substring(0, 8) + "..." },
        })
        return null
    }
}

/**
 * Delete a Remember Me token from the database
 *
 * @param token - The Remember Me token to delete
 * @returns true if deleted, false if not found
 */
export async function deleteRememberMeToken(token: string): Promise<boolean> {
    try {
        if (!token || typeof token !== "string" || token.length === 0) {
            return false
        }

        const result = await query(
            "DELETE FROM remember_me_tokens WHERE token_hash = $1",
            [token]
        )

        return (result.rowCount || 0) > 0
    } catch (error) {
        logger.error("Failed to delete Remember Me token", {
            context: "Auth",
            error: error as Error,
            data: { tokenPreview: token?.substring(0, 8) + "..." },
        })
        return false
    }
}

/**
 * Create a new Remember Me token
 *
 * @param userId - The user ID to create the token for
 * @param ipAddress - Optional IP address for audit
 * @param userAgent - Optional user agent for audit
 * @returns The created RememberMeToken
 */
export async function createRememberMeToken(
    userId: string,
    ipAddress?: string,
    userAgent?: string
): Promise<RememberMeToken> {
    try {
        if (!userId || typeof userId !== "string") {
            throw new Error("Invalid user ID")
        }

        const token = generateRandomHex(TOKEN_LENGTH)
        const expiresAt = new Date(
            Date.now() + REMEMBER_ME_TOKEN_EXPIRATION_DAYS * 24 * 60 * 60 * 1000
        )

        const row = await queryOne<RememberMeToken>(
            `INSERT INTO remember_me_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, user_id, token_hash, expires_at, created_at, ip_address, user_agent`,
            [userId, token, expiresAt, ipAddress || null, userAgent || null]
        )

        if (!row) {
            throw new Error("Failed to create Remember Me token")
        }

        return row
    } catch (error) {
        logger.error("Failed to create Remember Me token", {
            context: "Auth",
            error: error as Error,
            data: { userId },
        })
        throw error
    }
}
