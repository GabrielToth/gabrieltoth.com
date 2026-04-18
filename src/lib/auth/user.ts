/**
 * User Management Module
 * Handles user creation and updates for Google OAuth authentication
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { GoogleUserData, User } from "@/types/auth"

/**
 * Create or update a user based on Google OAuth data
 *
 * This function implements the upsert pattern:
 * 1. Check if user exists by google_id
 * 2. If not exists: create new user with all Google data
 * 3. If exists: update google_name and google_picture if changed
 * 4. Return the User object
 *
 * @param googleData - User data extracted from Google OAuth token
 * @returns User object (created or updated)
 * @throws Error if database operation fails
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
 */
export async function upsertUser(googleData: GoogleUserData): Promise<User> {
    try {
        // Validate required fields
        if (
            !googleData.google_id ||
            !googleData.google_email ||
            !googleData.google_name
        ) {
            throw new Error(
                "Missing required Google user data: google_id, google_email, or google_name"
            )
        }

        // Check if user exists by google_id
        const existingUser = await db.queryOne<User>(
            `SELECT id, google_id, google_email, google_name, google_picture, created_at, updated_at
             FROM users
             WHERE google_id = $1`,
            [googleData.google_id]
        )

        if (existingUser) {
            // User exists - check if profile data changed
            const nameChanged =
                existingUser.google_name !== googleData.google_name
            const pictureChanged =
                existingUser.google_picture !== googleData.google_picture

            if (nameChanged || pictureChanged) {
                // Update user with new data
                const updatedUser = await db.queryOne<User>(
                    `UPDATE users
                     SET google_name = $1, google_picture = $2, updated_at = NOW()
                     WHERE google_id = $3
                     RETURNING id, google_id, google_email, google_name, google_picture, created_at, updated_at`,
                    [
                        googleData.google_name,
                        googleData.google_picture || null,
                        googleData.google_id,
                    ]
                )

                if (!updatedUser) {
                    throw new Error("Failed to update user")
                }

                logger.debug("User profile updated", {
                    context: "Auth",
                    data: {
                        userId: updatedUser.id,
                        nameChanged,
                        pictureChanged,
                    },
                })

                return updatedUser
            }

            // No changes needed
            logger.debug("User already exists with same profile data", {
                context: "Auth",
                data: { userId: existingUser.id },
            })

            return existingUser
        }

        // User does not exist - create new user
        const newUser = await db.queryOne<User>(
            `INSERT INTO users (google_id, google_email, google_name, google_picture, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())
             RETURNING id, google_id, google_email, google_name, google_picture, created_at, updated_at`,
            [
                googleData.google_id,
                googleData.google_email,
                googleData.google_name,
                googleData.google_picture || null,
            ]
        )

        if (!newUser) {
            throw new Error("Failed to create user")
        }

        logger.debug("New user created via Google OAuth", {
            context: "Auth",
            data: { userId: newUser.id, email: newUser.google_email },
        })

        return newUser
    } catch (error) {
        logger.error("Failed to upsert user", {
            context: "Auth",
            error: error as Error,
            data: { google_id: googleData.google_id },
        })
        throw error
    }
}

/**
 * Get user by ID
 *
 * @param userId - The user ID
 * @returns User object or null if not found
 * @throws Error if database operation fails
 */
export async function getUserById(userId: string): Promise<User | null> {
    try {
        return await db.queryOne<User>(
            `SELECT id, google_id, google_email, google_name, google_picture, created_at, updated_at
             FROM users
             WHERE id = $1`,
            [userId]
        )
    } catch (error) {
        logger.error("Failed to get user by ID", {
            context: "Auth",
            error: error as Error,
            data: { userId },
        })
        throw error
    }
}

/**
 * Get user by google_id
 *
 * @param googleId - The Google ID
 * @returns User object or null if not found
 * @throws Error if database operation fails
 */
export async function getUserByGoogleId(
    googleId: string
): Promise<User | null> {
    try {
        return await db.queryOne<User>(
            `SELECT id, google_id, google_email, google_name, google_picture, created_at, updated_at
             FROM users
             WHERE google_id = $1`,
            [googleId]
        )
    } catch (error) {
        logger.error("Failed to get user by Google ID", {
            context: "Auth",
            error: error as Error,
            data: { googleId },
        })
        throw error
    }
}

/**
 * Get user by google_email
 *
 * @param email - The Google email
 * @returns User object or null if not found
 * @throws Error if database operation fails
 */
export async function getUserByEmail(email: string): Promise<User | null> {
    try {
        return await db.queryOne<User>(
            `SELECT id, google_id, google_email, google_name, google_picture, created_at, updated_at
             FROM users
             WHERE google_email = $1`,
            [email]
        )
    } catch (error) {
        logger.error("Failed to get user by email", {
            context: "Auth",
            error: error as Error,
            data: { email },
        })
        throw error
    }
}
