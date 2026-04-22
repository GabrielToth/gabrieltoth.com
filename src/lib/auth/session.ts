/**
 * Session Management Module
 * Handles session creation, validation, and removal for authenticated users
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.1, 5.2
 */

import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { Session } from "@/types/auth"
import { randomBytes } from "crypto"

const { queryOne, query } = db

/**
 * Session configuration constants
 */
const SESSION_EXPIRATION_DAYS = 30
const SESSION_ID_LENGTH = 32 // 32 bytes = 256 bits for crypto.randomBytes

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
    try {
        // Validate user ID
        if (!userId || typeof userId !== "string") {
            throw new Error("Invalid user ID provided")
        }

        // Generate unique session_id using crypto.randomBytes
        // Convert to hex string for storage in database
        const sessionIdBuffer = randomBytes(SESSION_ID_LENGTH)
        const sessionId = sessionIdBuffer.toString("hex")

        // Calculate expiration date (30 days from now)
        const now = new Date()
        const expiresAt = new Date(
            now.getTime() + SESSION_EXPIRATION_DAYS * 24 * 60 * 60 * 1000
        )

        // Create session record in database
        const session = await queryOne<Session>(
            `INSERT INTO sessions (user_id, session_id, created_at, expires_at)
             VALUES ($1, $2, NOW(), $3)
             RETURNING id, user_id, session_id, created_at, expires_at`,
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
        logger.error("Failed to create session", {
            context: "Auth",
            error: error as Error,
            data: { userId },
        })
        throw error
    }
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

        // Query session by session_id
        const session = await queryOne<Session>(
            `SELECT id, user_id, session_id, created_at, expires_at
             FROM sessions
             WHERE session_id = $1`,
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

        // Delete session from database
        const result = await query(
            `DELETE FROM sessions WHERE session_id = $1`,
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
