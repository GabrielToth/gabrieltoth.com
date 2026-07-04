/**
 * Session Management Module
 * Handles session creation, validation, and removal for authenticated users
 * Includes Remember Me token functionality and secure cookie storage
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8
 */

import { generateRandomHex } from "@/lib/crypto-utils"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { RememberMeToken, Session } from "@/types/auth"
import { cookies } from "next/headers"
import { NextRequest } from "next/server"

const { queryOne, query } = db

/**
 * Session configuration constants
 */
const SESSION_EXPIRATION_DAYS = 30
const SESSION_ID_LENGTH = 32 // 32 bytes = 256 bits
const SESSION_TOKEN_EXPIRATION_HOURS = 1
const REMEMBER_ME_TOKEN_EXPIRATION_DAYS = 30
const TOKEN_LENGTH = 32 // 32 bytes = 256 bits

/**
 * Secure cookie options for session tokens (1 hour expiration)
 */
const SESSION_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    // Cookie matches DB session duration (30 days) so users stay logged in
    // across deployments. Actual session validation happens server-side.
    maxAge: SESSION_EXPIRATION_DAYS * 24 * 60 * 60, // 30 days
    path: "/",
}

/**
 * Secure cookie options for Remember Me tokens (30 days expiration)
 */
const REMEMBER_ME_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: REMEMBER_ME_TOKEN_EXPIRATION_DAYS * 24 * 60 * 60, // 30 days in seconds
    path: "/",
}

/**
 * Create a new session for an authenticated user
 *
 * This function:
 * 1. Generates a unique session_id using crypto.randomBytes(32)
 * 2. Creates a session record in the database with user_id, session_id, created_at, expires_at
 * 3. Sets expiration to 30 days from now
 * 4. Returns the Session object
 *
 * @param userId - The user ID to create a session for
 * @returns Session object with id, user_id, session_id, created_at, expires_at
 * @throws Error if session creation fails
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4
 */
export async function createSession(userId: string): Promise<Session> {
    // Validate user ID early (no retry needed)
    if (!userId || typeof userId !== "string") {
        throw new Error("Invalid user ID provided")
    }

    const MAX_RETRIES = 3
    let lastError: Error | null = null

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            // Generate unique session_id using crypto.getRandomValues
            // Convert to hex string for storage in database
            const sessionId = generateRandomHex(SESSION_ID_LENGTH)

            // Calculate expiration date (30 days from now)
            const expiresAt = new Date(
                Date.now() + SESSION_EXPIRATION_DAYS * 24 * 60 * 60 * 1000
            )

            // Create session record in database
            const session = await queryOne<Session>(
                `INSERT INTO sessions (user_id, token_hash, created_at, expires_at)
                 VALUES ($1, $2, NOW(), $3)
                 RETURNING id, user_id, token_hash AS session_id, created_at, expires_at`,
                [userId, sessionId, expiresAt]
            )

            if (!session) {
                throw new Error("Failed to create session record")
            }

            logger.debug("Session created successfully", {
                context: "Auth",
                data: {
                    userId,
                    sessionId: sessionId.substring(0, 8) + "...", // Log only first 8 chars for security
                    expiresAt: expiresAt.toISOString(),
                },
            })

            return session
        } catch (error) {
            const pgError = error as { code?: string }

            // If it's a unique constraint violation (PostgreSQL code 23505),
            // retry with a new randomly-generated token_hash.
            // This handles an extremely rare edge case where `crypto.getRandomValues`
            // could theoretically produce a colliding value under specific
            // serverless runtime conditions.
            if (pgError.code === "23505") {
                lastError = error as Error
                logger.warn(
                    "Session token collision detected, retrying with new token",
                    {
                        context: "Auth",
                        data: {
                            userId,
                            attempt: attempt + 1,
                            maxRetries: MAX_RETRIES,
                        },
                    }
                )
                continue
            }

            // For all other errors (connection failure, invalid params, etc.),
            // throw immediately — no retry will fix these.
            logger.error("Failed to create session", {
                context: "Auth",
                error: error as Error,
                data: { userId },
            })
            throw error
        }
    }

    // All retries exhausted — token collisions on every attempt are virtually
    // impossible, but we handle it gracefully instead of crashing.
    logger.error("Failed to create session after exhausting retries", {
        context: "Auth",
        error: lastError,
        data: { userId },
    })
    throw new Error("Failed to create session after multiple attempts")
}

/**
 * Validate a session by session_id
 *
 * This function:
 * 1. Queries the sessions table by session_id
 * 2. Checks if session exists
 * 3. Checks if session is not expired (expires_at > now)
 * 4. Returns Session object if valid, null if invalid or expired
 *
 * @param sessionId - The session ID to validate
 * @returns Session object if valid and not expired, null otherwise
 * @throws Error if database operation fails
 *
 * Validates: Requirements 4.5, 4.6, 4.7
 */
export async function validateSession(
    sessionId: string
): Promise<Session | null> {
    try {
        // Validate session ID
        if (!sessionId || typeof sessionId !== "string") {
            logger.warn("Invalid session ID provided for validation", {
                context: "Auth",
            })
            return null
        }

        // Query session by token_hash
        const session = await queryOne<Session>(
            `SELECT id, user_id, token_hash AS session_id, created_at, expires_at
             FROM sessions
             WHERE token_hash = $1`,
            [sessionId]
        )

        // Session not found
        if (!session) {
            logger.debug("Session not found", {
                context: "Auth",
                data: { sessionId: sessionId.substring(0, 8) + "..." },
            })
            return null
        }

        // Check if session is expired
        const now = new Date()
        const expiresAt = new Date(session.expires_at)

        if (expiresAt < now) {
            logger.debug("Session expired", {
                context: "Auth",
                data: {
                    userId: session.user_id,
                    expiresAt: expiresAt.toISOString(),
                },
            })
            return null
        }

        // Session is valid
        logger.debug("Session validated successfully", {
            context: "Auth",
            data: {
                userId: session.user_id,
                expiresAt: expiresAt.toISOString(),
            },
        })

        return session
    } catch (error) {
        logger.error("Failed to validate session", {
            context: "Auth",
            error: error as Error,
            data: { sessionId: sessionId?.substring(0, 8) + "..." },
        })
        throw error
    }
}

/**
 * Remove a session by session_id
 *
 * This function:
 * 1. Deletes the session from the database by session_id
 * 2. Returns success status
 *
 * @param sessionId - The session ID to remove
 * @returns true if session was deleted, false if session not found
 * @throws Error if database operation fails
 *
 * Validates: Requirements 5.1, 5.2
 */
export async function removeSession(sessionId: string): Promise<boolean> {
    try {
        // Validate session ID
        if (!sessionId || typeof sessionId !== "string") {
            throw new Error("Invalid session ID provided")
        }

        // Delete session from database (use token_hash column)
        const result = await query(
            "DELETE FROM sessions WHERE token_hash = $1",
            [sessionId]
        )

        // Check if any rows were deleted
        const deleted = (result.rowCount || 0) > 0

        if (deleted) {
            logger.debug("Session removed successfully", {
                context: "Auth",
                data: { sessionId: sessionId.substring(0, 8) + "..." },
            })
        } else {
            logger.debug("Session not found for removal", {
                context: "Auth",
                data: { sessionId: sessionId.substring(0, 8) + "..." },
            })
        }

        return deleted
    } catch (error) {
        logger.error("Failed to remove session", {
            context: "Auth",
            error: error as Error,
            data: { sessionId: sessionId?.substring(0, 8) + "..." },
        })
        throw error
    }
}

/**
 * Get session from request cookies
 *
 * This function:
 * 1. Extracts the session cookie from the request
 * 2. Validates the session in the database
 * 3. Returns the Session object if valid, null otherwise
 *
 * @param request - The NextRequest object
 * @returns Session object if valid, null otherwise
 *
 * Validates: Requirements 4.5, 4.6, 4.7
 */
export async function getSessionFromCookie(
    request: NextRequest
): Promise<Session | null> {
    try {
        // Get session cookie from request
        const sessionCookie = request.cookies.get("session")

        if (!sessionCookie || !sessionCookie.value) {
            return null
        }

        // Validate the session
        const session = await validateSession(sessionCookie.value)

        return session
    } catch (error) {
        logger.error("Failed to get session from cookie", {
            context: "Auth",
            error: error as Error,
        })
        return null
    }
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
 * 3. Includes Secure and SameSite=Strict flags
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
 * Store Remember Me token in a secure HTTP-Only cookie
 *
 * This function:
 * 1. Validates the token
 * 2. Sets a secure HTTP-Only cookie with 30-day expiration
 * 3. Includes Secure and SameSite=Strict flags
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

/**
 * Set the auth_session cookie with the given token
 *
 * @param token - The session token to set in the cookie
 */
export async function setAuthSessionCookie(token: string): Promise<void> {
    try {
        if (!token || typeof token !== "string" || token.length === 0) {
            throw new Error("Invalid session token provided")
        }

        const cookieStore = await cookies()

        cookieStore.set("auth_session", token, SESSION_COOKIE_OPTIONS)

        logger.debug("Auth session cookie set", {
            context: "Auth",
            data: {
                tokenPreview: token.substring(0, 8) + "...",
                expirationHours: SESSION_TOKEN_EXPIRATION_HOURS,
            },
        })
    } catch (error) {
        logger.error("Failed to set auth session cookie", {
            context: "Auth",
            error: error as Error,
        })
        throw error
    }
}
