/**
 * User Management Module
 * Handles user creation and updates for OAuth authentication
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.6, 11.3
 */

import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { GoogleUserData, OAuthUser, User } from "@/types/auth"

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
 * Get user by email (supports both old google_email and new email column)
 *
 * @param email - The email address
 * @returns User object or null if not found
 * @throws Error if database operation fails
 *
 * Validates: Requirements 2.5, 3.6
 */
export async function getUserByEmail(email: string): Promise<OAuthUser | null> {
    try {
        // Try new schema first (with email column)
        const user = await db.queryOne<OAuthUser>(
            `SELECT id, email, password_hash, oauth_provider, oauth_id, name, picture, email_verified, created_at, updated_at
             FROM users
             WHERE email = $1`,
            [email]
        )

        if (user) {
            return user
        }

        // Fallback to old schema (google_email column) for backward compatibility
        const legacyUser = await db.queryOne<User>(
            `SELECT id, google_id, google_email, google_name, google_picture, created_at, updated_at
             FROM users
             WHERE google_email = $1`,
            [email]
        )

        return legacyUser as OAuthUser | null
    } catch (error) {
        logger.error("Failed to get user by email", {
            context: "Auth",
            error: error as Error,
            data: { email },
        })
        throw error
    }
}

/**
 * Create a new OAuth user with email and password
 *
 * This function creates a user record with OAuth provider information
 * and a password hash, enabling dual authentication methods.
 *
 * @param data - User data including email, password_hash, OAuth info, and profile data
 * @returns User object (created)
 * @throws Error if database operation fails or required fields are missing
 *
 * Validates: Requirements 2.5, 3.6, 11.3
 */
export async function createOAuthUser(data: {
    email: string
    password_hash: string
    oauth_provider: string
    oauth_id: string
    name: string
    picture?: string
}): Promise<OAuthUser> {
    try {
        // Validate required fields
        if (
            !data.email ||
            !data.password_hash ||
            !data.oauth_provider ||
            !data.oauth_id ||
            !data.name
        ) {
            throw new Error(
                "Missing required fields: email, password_hash, oauth_provider, oauth_id, or name"
            )
        }

        // Validate oauth_provider is one of the allowed values
        const allowedProviders = ["google", "facebook", "tiktok"]
        if (!allowedProviders.includes(data.oauth_provider)) {
            throw new Error(
                `Invalid oauth_provider: ${data.oauth_provider}. Must be one of: ${allowedProviders.join(", ")}`
            )
        }

        // Create new OAuth user
        const newUser = await db.queryOne<OAuthUser>(
            `INSERT INTO users (email, password_hash, oauth_provider, oauth_id, name, picture, email_verified, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
             RETURNING id, email, password_hash, oauth_provider, oauth_id, name, picture, email_verified, created_at, updated_at`,
            [
                data.email,
                data.password_hash,
                data.oauth_provider,
                data.oauth_id,
                data.name,
                data.picture || null,
                data.oauth_provider === "google", // Google emails are pre-verified
            ]
        )

        if (!newUser) {
            throw new Error("Failed to create OAuth user")
        }

        logger.debug("New OAuth user created", {
            context: "Auth",
            data: {
                userId: newUser.id,
                email: newUser.email,
                provider: newUser.oauth_provider,
            },
        })

        return newUser
    } catch (error) {
        logger.error("Failed to create OAuth user", {
            context: "Auth",
            error: error as Error,
            data: {
                email: data.email,
                oauth_provider: data.oauth_provider,
                oauth_id: data.oauth_id,
            },
        })
        throw error
    }
}

/**
 * Update a user's password
 *
 * This function updates the password_hash for an existing user,
 * typically used for migration of existing OAuth users or password changes.
 *
 * @param userId - The user ID
 * @param password_hash - The new bcrypt password hash
 * @returns Updated User object
 * @throws Error if database operation fails or user not found
 *
 * Validates: Requirements 11.3
 */
export async function updateUserPassword(
    userId: string,
    password_hash: string
): Promise<OAuthUser> {
    try {
        // Validate required fields
        if (!userId || !password_hash) {
            throw new Error("Missing required fields: userId or password_hash")
        }

        // Update user password
        const updatedUser = await db.queryOne<OAuthUser>(
            `UPDATE users
             SET password_hash = $1, updated_at = NOW()
             WHERE id = $2
             RETURNING id, email, password_hash, oauth_provider, oauth_id, name, picture, email_verified, created_at, updated_at`,
            [password_hash, userId]
        )

        if (!updatedUser) {
            throw new Error("User not found or failed to update password")
        }

        logger.debug("User password updated", {
            context: "Auth",
            data: { userId: updatedUser.id },
        })

        return updatedUser
    } catch (error) {
        logger.error("Failed to update user password", {
            context: "Auth",
            error: error as Error,
            data: { userId },
        })
        throw error
    }
}

/**
 * Get user by OAuth ID and provider
 *
 * @param provider - The OAuth provider (google, facebook, tiktok)
 * @param oauthId - The OAuth ID from the provider
 * @returns User object or null if not found
 * @throws Error if database operation fails
 *
 * Validates: Requirements 2.5, 3.6
 */
export async function getUserByOAuthId(
    provider: string,
    oauthId: string
): Promise<OAuthUser | null> {
    try {
        // Validate required fields
        if (!provider || !oauthId) {
            throw new Error("Missing required fields: provider or oauthId")
        }

        return await db.queryOne<OAuthUser>(
            `SELECT id, email, password_hash, oauth_provider, oauth_id, name, picture, email_verified, created_at, updated_at
             FROM users
             WHERE oauth_provider = $1 AND oauth_id = $2`,
            [provider, oauthId]
        )
    } catch (error) {
        logger.error("Failed to get user by OAuth ID", {
            context: "Auth",
            error: error as Error,
            data: { provider, oauthId },
        })
        throw error
    }
}

/**
 * Update user account completion data
 *
 * Updates a user's account with completion data including password, phone, birth date,
 * and account completion status.
 *
 * @param userId - The user ID
 * @param data - Account completion data
 * @returns Updated OAuthUser object
 * @throws Error if database operation fails or user not found
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 8.1
 */
export async function updateUserAccountCompletion(
    userId: string,
    data: {
        email?: string
        name?: string
        password_hash?: string
        phone_number?: string
        birth_date?: string | Date
        account_completion_status?: "pending" | "in_progress" | "completed"
        account_completed_at?: Date
    }
): Promise<OAuthUser> {
    try {
        // Validate required fields
        if (!userId) {
            throw new Error("User ID is required")
        }

        // Build dynamic UPDATE query based on provided fields
        const updates: string[] = []
        const values: unknown[] = []
        let paramIndex = 1

        if (data.email !== undefined) {
            updates.push(`email = $${paramIndex}`)
            values.push(data.email)
            paramIndex++
        }

        if (data.name !== undefined) {
            updates.push(`name = $${paramIndex}`)
            values.push(data.name)
            paramIndex++
        }

        if (data.password_hash !== undefined) {
            updates.push(`password_hash = $${paramIndex}`)
            values.push(data.password_hash)
            paramIndex++
        }

        if (data.phone_number !== undefined) {
            updates.push(`phone_number = $${paramIndex}`)
            values.push(data.phone_number)
            paramIndex++
        }

        if (data.birth_date !== undefined) {
            updates.push(`birth_date = $${paramIndex}`)
            values.push(data.birth_date)
            paramIndex++
        }

        if (data.account_completion_status !== undefined) {
            updates.push(`account_completion_status = $${paramIndex}`)
            values.push(data.account_completion_status)
            paramIndex++
        }

        if (data.account_completed_at !== undefined) {
            updates.push(`account_completed_at = $${paramIndex}`)
            values.push(data.account_completed_at)
            paramIndex++
        }

        // Always update the updated_at timestamp
        updates.push(`updated_at = NOW()`)

        if (updates.length === 1) {
            // Only updated_at was set, no actual data to update
            throw new Error("No data provided to update")
        }

        // Add user ID as the last parameter
        values.push(userId)

        const query = `UPDATE users
                       SET ${updates.join(", ")}
                       WHERE id = $${paramIndex}
                       RETURNING id, email, password_hash, oauth_provider, oauth_id, name, picture, phone_number, birth_date, account_completion_status, account_completed_at, email_verified, created_at, updated_at`

        const updatedUser = await db.queryOne<OAuthUser>(query, values)

        if (!updatedUser) {
            throw new Error("User not found or failed to update account")
        }

        logger.debug("User account completion updated", {
            context: "Auth",
            data: {
                userId: updatedUser.id,
                status: updatedUser.account_completion_status,
            },
        })

        return updatedUser
    } catch (error) {
        logger.error("Failed to update user account completion", {
            context: "Auth",
            error: error as Error,
            data: { userId },
        })
        throw error
    }
}

/**
 * Mark account as in progress
 *
 * Updates the account_completion_status to 'in_progress'
 *
 * @param userId - The user ID
 * @returns Updated OAuthUser object
 * @throws Error if database operation fails
 *
 * Validates: Requirement 1.1
 */
export async function markAccountInProgress(
    userId: string
): Promise<OAuthUser> {
    return updateUserAccountCompletion(userId, {
        account_completion_status: "in_progress",
    })
}

/**
 * Mark account as completed
 *
 * Updates the account_completion_status to 'completed' and sets account_completed_at
 *
 * @param userId - The user ID
 * @returns Updated OAuthUser object
 * @throws Error if database operation fails
 *
 * Validates: Requirement 1.1
 */
export async function markAccountCompleted(userId: string): Promise<OAuthUser> {
    return updateUserAccountCompletion(userId, {
        account_completion_status: "completed",
        account_completed_at: new Date(),
    })
}
