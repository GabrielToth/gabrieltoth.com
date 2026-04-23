/**
 * Registration Session Management Module
 * Handles registration session creation, validation, and removal for the multi-step registration flow
 *
 * Validates: Requirements 16.1, 16.2, 16.6
 */

import { generateRandomHex } from "@/lib/crypto-utils"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

const { queryOne, query } = db

/**
 * Registration session configuration constants
 */
const REGISTRATION_SESSION_EXPIRATION_MINUTES = 30
const SESSION_ID_LENGTH = 32 // 32 bytes = 256 bits

/**
 * Registration Session interface
 * Represents a registration session with form data and expiration
 */
export interface RegistrationSession {
    id: string
    session_id: string
    email: string
    name: string
    phone: string
    current_step: 1 | 2 | 3 | 4
    created_at: Date
    expires_at: Date
    last_activity_at: Date
}

/**
 * Create a new registration session
 *
 * This function:
 * 1. Generates a unique session_id using crypto.randomBytes(32)
 * 2. Creates a registration session record in the database
 * 3. Sets expiration to 30 minutes from now
 * 4. Returns the RegistrationSession object
 *
 * @param email - The user's email address
 * @returns RegistrationSession object with id, session_id, email, created_at, expires_at
 * @throws Error if session creation fails
 *
 * Validates: Requirements 16.1, 16.2
 */
export async function createRegistrationSession(
    email: string
): Promise<RegistrationSession> {
    try {
        // Validate email
        if (!email || typeof email !== "string") {
            throw new Error("Invalid email provided")
        }

        // Generate unique session_id using crypto.getRandomValues
        // Convert to hex string for storage in database
        const sessionId = generateRandomHex(SESSION_ID_LENGTH)

        // Calculate expiration date (30 minutes from now)
        const now = new Date()
        const expiresAt = new Date(
            now.getTime() + REGISTRATION_SESSION_EXPIRATION_MINUTES * 60 * 1000
        )

        // Create registration session record in database
        const session = await queryOne<RegistrationSession>(
            `INSERT INTO registration_sessions (session_id, email, current_step, created_at, expires_at, last_activity_at)
             VALUES ($1, $2, $3, NOW(), $4, NOW())
             RETURNING id, session_id, email, name, phone, current_step, created_at, expires_at, last_activity_at`,
            [sessionId, email, 1, expiresAt]
        )

        if (!session) {
            throw new Error("Failed to create registration session record")
        }

        logger.debug("Registration session created successfully", {
            context: "Auth",
            data: {
                email,
                sessionId: sessionId.substring(0, 8) + "...", // Log only first 8 chars for security
                expiresAt: expiresAt.toISOString(),
            },
        })

        return session
    } catch (error) {
        logger.error("Failed to create registration session", {
            context: "Auth",
            error: error as Error,
            data: { email },
        })
        throw error
    }
}

/**
 * Validate a registration session by session_id
 *
 * This function:
 * 1. Queries the registration_sessions table by session_id
 * 2. Checks if session exists
 * 3. Checks if session is not expired (expires_at > now)
 * 4. Updates last_activity_at to current time
 * 5. Returns RegistrationSession object if valid, null if invalid or expired
 *
 * @param sessionId - The session ID to validate
 * @returns RegistrationSession object if valid and not expired, null otherwise
 * @throws Error if database operation fails
 *
 * Validates: Requirements 16.1, 16.2, 16.6
 */
export async function validateRegistrationSession(
    sessionId: string
): Promise<RegistrationSession | null> {
    try {
        // Validate session ID
        if (!sessionId || typeof sessionId !== "string") {
            logger.warn("Invalid session ID provided for validation", {
                context: "Auth",
            })
            return null
        }

        // Query session by session_id
        const session = await queryOne<RegistrationSession>(
            `SELECT id, session_id, email, name, phone, current_step, created_at, expires_at, last_activity_at
             FROM registration_sessions
             WHERE session_id = $1`,
            [sessionId]
        )

        // Session not found
        if (!session) {
            logger.debug("Registration session not found", {
                context: "Auth",
                data: { sessionId: sessionId.substring(0, 8) + "..." },
            })
            return null
        }

        // Check if session is expired
        const now = new Date()
        const expiresAt = new Date(session.expires_at)

        if (expiresAt < now) {
            logger.debug("Registration session expired", {
                context: "Auth",
                data: {
                    email: session.email,
                    expiresAt: expiresAt.toISOString(),
                },
            })
            return null
        }

        // Update last_activity_at to current time
        await query(
            `UPDATE registration_sessions
             SET last_activity_at = NOW()
             WHERE session_id = $1`,
            [sessionId]
        )

        // Session is valid
        logger.debug("Registration session validated successfully", {
            context: "Auth",
            data: {
                email: session.email,
                currentStep: session.current_step,
                expiresAt: expiresAt.toISOString(),
            },
        })

        return session
    } catch (error) {
        logger.error("Failed to validate registration session", {
            context: "Auth",
            error: error as Error,
            data: { sessionId: sessionId?.substring(0, 8) + "..." },
        })
        throw error
    }
}

/**
 * Retrieve a registration session by session_id
 *
 * This function:
 * 1. Queries the registration_sessions table by session_id
 * 2. Returns the session if found, null otherwise
 * 3. Does NOT check expiration (use validateRegistrationSession for that)
 *
 * @param sessionId - The session ID to retrieve
 * @returns RegistrationSession object if found, null otherwise
 * @throws Error if database operation fails
 *
 * Validates: Requirements 16.1, 16.6
 */
export async function getRegistrationSession(
    sessionId: string
): Promise<RegistrationSession | null> {
    try {
        // Validate session ID
        if (!sessionId || typeof sessionId !== "string") {
            logger.warn("Invalid session ID provided for retrieval", {
                context: "Auth",
            })
            return null
        }

        // Query session by session_id
        const session = await queryOne<RegistrationSession>(
            `SELECT id, session_id, email, name, phone, current_step, created_at, expires_at, last_activity_at
             FROM registration_sessions
             WHERE session_id = $1`,
            [sessionId]
        )

        if (!session) {
            logger.debug("Registration session not found for retrieval", {
                context: "Auth",
                data: { sessionId: sessionId.substring(0, 8) + "..." },
            })
            return null
        }

        logger.debug("Registration session retrieved successfully", {
            context: "Auth",
            data: {
                email: session.email,
                currentStep: session.current_step,
            },
        })

        return session
    } catch (error) {
        logger.error("Failed to retrieve registration session", {
            context: "Auth",
            error: error as Error,
            data: { sessionId: sessionId?.substring(0, 8) + "..." },
        })
        throw error
    }
}

/**
 * Update registration session with form data
 *
 * This function:
 * 1. Updates the registration session with new form data
 * 2. Updates the current_step
 * 3. Updates last_activity_at to current time
 * 4. Returns the updated RegistrationSession object
 *
 * @param sessionId - The session ID to update
 * @param data - Partial registration session data to update
 * @returns Updated RegistrationSession object
 * @throws Error if session not found or update fails
 *
 * Validates: Requirements 16.1, 16.6
 */
export async function updateRegistrationSession(
    sessionId: string,
    data: Partial<
        Omit<
            RegistrationSession,
            | "id"
            | "session_id"
            | "created_at"
            | "expires_at"
            | "last_activity_at"
        >
    >
): Promise<RegistrationSession> {
    try {
        // Validate session ID
        if (!sessionId || typeof sessionId !== "string") {
            throw new Error("Invalid session ID provided")
        }

        // Build update query dynamically based on provided data
        const updateFields: string[] = []
        const updateValues: any[] = [sessionId]
        let paramIndex = 2

        if (data.email !== undefined) {
            updateFields.push(`email = $${paramIndex}`)
            updateValues.push(data.email)
            paramIndex++
        }

        if (data.name !== undefined) {
            updateFields.push(`name = $${paramIndex}`)
            updateValues.push(data.name)
            paramIndex++
        }

        if (data.phone !== undefined) {
            updateFields.push(`phone = $${paramIndex}`)
            updateValues.push(data.phone)
            paramIndex++
        }

        if (data.current_step !== undefined) {
            updateFields.push(`current_step = $${paramIndex}`)
            updateValues.push(data.current_step)
            paramIndex++
        }

        // Always update last_activity_at
        updateFields.push(`last_activity_at = NOW()`)

        if (updateFields.length === 1) {
            // Only last_activity_at is being updated
            throw new Error("No data provided to update")
        }

        // Update session record in database
        const updatedSession = await queryOne<RegistrationSession>(
            `UPDATE registration_sessions
             SET ${updateFields.join(", ")}
             WHERE session_id = $1
             RETURNING id, session_id, email, name, phone, current_step, created_at, expires_at, last_activity_at`,
            updateValues
        )

        if (!updatedSession) {
            throw new Error("Registration session not found for update")
        }

        logger.debug("Registration session updated successfully", {
            context: "Auth",
            data: {
                email: updatedSession.email,
                currentStep: updatedSession.current_step,
                sessionId: sessionId.substring(0, 8) + "...",
            },
        })

        return updatedSession
    } catch (error) {
        logger.error("Failed to update registration session", {
            context: "Auth",
            error: error as Error,
            data: { sessionId: sessionId?.substring(0, 8) + "..." },
        })
        throw error
    }
}

/**
 * Remove a registration session by session_id
 *
 * This function:
 * 1. Deletes the registration session from the database by session_id
 * 2. Returns success status
 *
 * @param sessionId - The session ID to remove
 * @returns true if session was deleted, false if session not found
 * @throws Error if database operation fails
 *
 * Validates: Requirements 16.1, 16.6
 */
export async function removeRegistrationSession(
    sessionId: string
): Promise<boolean> {
    try {
        // Validate session ID
        if (!sessionId || typeof sessionId !== "string") {
            throw new Error("Invalid session ID provided")
        }

        // Delete session from database
        const result = await query(
            `DELETE FROM registration_sessions WHERE session_id = $1`,
            [sessionId]
        )

        // Check if any rows were deleted
        const deleted = (result.rowCount || 0) > 0

        if (deleted) {
            logger.debug("Registration session removed successfully", {
                context: "Auth",
                data: { sessionId: sessionId.substring(0, 8) + "..." },
            })
        } else {
            logger.debug("Registration session not found for removal", {
                context: "Auth",
                data: { sessionId: sessionId.substring(0, 8) + "..." },
            })
        }

        return deleted
    } catch (error) {
        logger.error("Failed to remove registration session", {
            context: "Auth",
            error: error as Error,
            data: { sessionId: sessionId?.substring(0, 8) + "..." },
        })
        throw error
    }
}

/**
 * Clean up expired registration sessions
 *
 * This function:
 * 1. Deletes all registration sessions that have expired
 * 2. Returns the number of sessions deleted
 *
 * @returns Number of expired sessions deleted
 * @throws Error if database operation fails
 *
 * Validates: Requirements 16.2
 */
export async function cleanupExpiredRegistrationSessions(): Promise<number> {
    try {
        const result = await query(
            `DELETE FROM registration_sessions WHERE expires_at < NOW()`
        )

        const deletedCount = result.rowCount || 0

        logger.debug("Expired registration sessions cleaned up", {
            context: "Auth",
            data: { deletedCount },
        })

        return deletedCount
    } catch (error) {
        logger.error("Failed to cleanup expired registration sessions", {
            context: "Auth",
            error: error as Error,
        })
        throw error
    }
}
