/**
 * Session Core Module
 * Handles session creation, validation, removal, and cookie operations
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8
 */

import { generateRandomHex } from "@/lib/crypto-utils"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { Session } from "@/types/auth"
import { cookies } from "next/headers"
import { NextRequest } from "next/server"

const { queryOne, query } = db

/**
 * Session configuration constants
 */
export const SESSION_EXPIRATION_DAYS = 30
export const SESSION_ID_LENGTH = 32 // 32 bytes = 256 bits
export const TOKEN_LENGTH = 32 // 32 bytes = 256 bits

/**
 * Secure cookie options for session tokens (1 hour expiration)
 */
export const SESSION_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    // Cookie matches DB session duration (30 days) so users stay logged in
    // across deployments. Actual session validation happens server-side.
    maxAge: SESSION_EXPIRATION_DAYS * 24 * 60 * 60, // 30 days
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
        // Get session cookie from request (actual cookie name is "auth_session")
        const sessionCookie = request.cookies.get("auth_session")

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
