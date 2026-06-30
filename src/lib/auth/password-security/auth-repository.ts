import { type SupabaseClient } from "@supabase/supabase-js"
import { logger } from "@/lib/logger"

export interface UserRecord {
    id: string
    email: string
    password_hash?: string
    password_algorithm?: string
}

export interface CreateUserParams {
    email: string
    passwordHash: string
    passwordAlgorithm: string
}

/**
 * Authentication Repository
 * Handles all direct database operations for authentication
 */
export class AuthRepository {
    private supabase: SupabaseClient

    constructor(supabaseClient: SupabaseClient) {
        this.supabase = supabaseClient
    }

    /**
     * Checks if a user exists with the given email
     * @param email The email to check
     * @returns Boolean indicating if the user exists
     * @throws Error on database failure (excluding not found)
     */
    async userExistsByEmail(email: string): Promise<boolean> {
        try {
            const { data, error } = await this.supabase
                .from("users")
                .select("id")
                .eq("email", email.toLowerCase())
                .single()

            if (error && error.code !== "PGRST116") {
                logger.error("Database error checking email existence", {
                    email,
                    error: error.message,
                })
                throw error
            }

            return !!data
        } catch (error) {
            logger.error("Error checking email existence", {
                email,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Look up a user by email, returning hash data for validation
     * @param email The email to look up
     * @returns User record if found, null otherwise
     * @throws Error on database failure
     */
    async findUserByEmail(email: string): Promise<UserRecord | null> {
        try {
            const { data, error } = await this.supabase
                .from("users")
                .select("id, email, password_hash, password_algorithm")
                .eq("email", email.toLowerCase())
                .single()

            if (error) {
                if (error.code === "PGRST116") {
                    return null
                }
                logger.error("Database error looking up user", {
                    email,
                    error: error.message,
                })
                throw error
            }

            return data
        } catch (error) {
            logger.error("Error looking up user by email", {
                email,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Create a new user record
     * @param params User creation parameters
     * @returns Created user record
     * @throws Error on database failure
     */
    async createUser(params: CreateUserParams): Promise<UserRecord> {
        try {
            const { data, error } = await this.supabase
                .from("users")
                .insert({
                    email: params.email.toLowerCase(),
                    password_hash: params.passwordHash,
                    password_algorithm: params.passwordAlgorithm,
                    email_verified: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .select("id, email")
                .single()

            if (error) {
                logger.error("Failed to create user record", {
                    email: params.email,
                    error: error.message,
                })
                throw error
            }

            return data
        } catch (error) {
            logger.error("Error creating user record", {
                email: params.email,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }
}
