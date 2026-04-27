/**
 * Token Store Service
 * Secure storage for OAuth access tokens with AES-256 encryption
 * Requirements: 10.8, 8.1, 8.2
 */

import { createClient } from "@supabase/supabase-js"
import { createLogger } from "../logger"
import { getTokenEncryptionService } from "../youtube/token-encryption"

const logger = createLogger("TokenStore")

/**
 * Token metadata stored in database
 */
export interface StoredToken {
    id: string
    userId: string
    platform: string
    encryptedToken: string
    refreshToken?: string
    expiresAt?: number
    linkedAt: number
    createdAt: number
    updatedAt: number
}

/**
 * Token data for storage
 */
export interface TokenData {
    accessToken: string
    refreshToken?: string
    expiresAt?: number
    platform: string
    userId: string
}

/**
 * Token Store Service
 * Handles secure storage and retrieval of OAuth tokens
 */
export class TokenStore {
    private supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    )
    private encryptionService = getTokenEncryptionService()

    /**
     * Store an OAuth token securely
     * Encrypts the token before storage
     */
    async storeToken(tokenData: TokenData): Promise<StoredToken> {
        try {
            // Encrypt the access token
            const encryptionResult = await this.encryptionService.encrypt(
                tokenData.accessToken
            )

            if (!encryptionResult.success) {
                throw new Error(`Encryption failed: ${encryptionResult.error}`)
            }

            const now = Date.now()
            const linkedAt = now

            // Check if token already exists for this user and platform
            const { data: existingToken } = await this.supabase
                .from("oauth_tokens")
                .select("id")
                .eq("user_id", tokenData.userId)
                .eq("platform", tokenData.platform)
                .single()

            let result

            if (existingToken) {
                // Update existing token
                result = await this.supabase
                    .from("oauth_tokens")
                    .update({
                        encrypted_token: encryptionResult.encryptedData,
                        refresh_token: tokenData.refreshToken || null,
                        expires_at: tokenData.expiresAt
                            ? new Date(tokenData.expiresAt)
                            : null,
                        updated_at: new Date(now),
                    })
                    .eq("user_id", tokenData.userId)
                    .eq("platform", tokenData.platform)
                    .select()
                    .single()
            } else {
                // Insert new token
                result = await this.supabase
                    .from("oauth_tokens")
                    .insert({
                        user_id: tokenData.userId,
                        platform: tokenData.platform,
                        encrypted_token: encryptionResult.encryptedData,
                        refresh_token: tokenData.refreshToken || null,
                        expires_at: tokenData.expiresAt
                            ? new Date(tokenData.expiresAt)
                            : null,
                        linked_at: new Date(linkedAt),
                        created_at: new Date(now),
                        updated_at: new Date(now),
                    })
                    .select()
                    .single()
            }

            if (result.error) {
                throw new Error(`Database error: ${result.error.message}`)
            }

            logger.info("Token stored successfully", {
                userId: tokenData.userId,
                platform: tokenData.platform,
            })

            return this.mapDatabaseToStoredToken(result.data)
        } catch (error) {
            logger.error("Failed to store token", {
                userId: tokenData.userId,
                platform: tokenData.platform,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Retrieve and decrypt an OAuth token
     */
    async getToken(
        userId: string,
        platform: string
    ): Promise<TokenData | null> {
        try {
            const { data, error } = await this.supabase
                .from("oauth_tokens")
                .select("*")
                .eq("user_id", userId)
                .eq("platform", platform)
                .single()

            if (error) {
                if (error.code === "PGRST116") {
                    // No rows found
                    return null
                }
                throw new Error(`Database error: ${error.message}`)
            }

            if (!data) {
                return null
            }

            // Decrypt the token
            const decryptionResult = await this.encryptionService.decrypt(
                data.encrypted_token
            )

            if (!decryptionResult.success) {
                throw new Error(`Decryption failed: ${decryptionResult.error}`)
            }

            logger.info("Token retrieved successfully", {
                userId,
                platform,
            })

            return {
                accessToken: decryptionResult.decryptedData,
                refreshToken: data.refresh_token || undefined,
                expiresAt: data.expires_at
                    ? new Date(data.expires_at).getTime()
                    : undefined,
                platform,
                userId,
            }
        } catch (error) {
            logger.error("Failed to retrieve token", {
                userId,
                platform,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Check if a token exists and is not expired
     */
    async isTokenValid(userId: string, platform: string): Promise<boolean> {
        try {
            const token = await this.getToken(userId, platform)

            if (!token) {
                return false
            }

            // Check if token is expired
            if (token.expiresAt && token.expiresAt < Date.now()) {
                logger.info("Token is expired", { userId, platform })
                return false
            }

            return true
        } catch (error) {
            logger.error("Failed to validate token", {
                userId,
                platform,
                error: error instanceof Error ? error.message : String(error),
            })
            return false
        }
    }

    /**
     * Refresh an OAuth token
     */
    async refreshToken(
        userId: string,
        platform: string,
        newTokenData: TokenData
    ): Promise<StoredToken> {
        try {
            // Encrypt the new access token
            const encryptionResult = await this.encryptionService.encrypt(
                newTokenData.accessToken
            )

            if (!encryptionResult.success) {
                throw new Error(`Encryption failed: ${encryptionResult.error}`)
            }

            const now = Date.now()

            const { data, error } = await this.supabase
                .from("oauth_tokens")
                .update({
                    encrypted_token: encryptionResult.encryptedData,
                    refresh_token: newTokenData.refreshToken || null,
                    expires_at: newTokenData.expiresAt
                        ? new Date(newTokenData.expiresAt)
                        : null,
                    updated_at: new Date(now),
                })
                .eq("user_id", userId)
                .eq("platform", platform)
                .select()
                .single()

            if (error) {
                throw new Error(`Database error: ${error.message}`)
            }

            logger.info("Token refreshed successfully", {
                userId,
                platform,
            })

            return this.mapDatabaseToStoredToken(data)
        } catch (error) {
            logger.error("Failed to refresh token", {
                userId,
                platform,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Delete an OAuth token (revoke access)
     */
    async deleteToken(userId: string, platform: string): Promise<boolean> {
        try {
            const { error } = await this.supabase
                .from("oauth_tokens")
                .delete()
                .eq("user_id", userId)
                .eq("platform", platform)

            if (error) {
                throw new Error(`Database error: ${error.message}`)
            }

            logger.info("Token deleted successfully", {
                userId,
                platform,
            })

            return true
        } catch (error) {
            logger.error("Failed to delete token", {
                userId,
                platform,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Get all tokens for a user
     */
    async getUserTokens(userId: string): Promise<StoredToken[]> {
        try {
            const { data, error } = await this.supabase
                .from("oauth_tokens")
                .select("*")
                .eq("user_id", userId)

            if (error) {
                throw new Error(`Database error: ${error.message}`)
            }

            logger.info("User tokens retrieved", {
                userId,
                count: data?.length || 0,
            })

            return (data || []).map(token =>
                this.mapDatabaseToStoredToken(token)
            )
        } catch (error) {
            logger.error("Failed to retrieve user tokens", {
                userId,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Get all tokens for a platform
     */
    async getPlatformTokens(platform: string): Promise<StoredToken[]> {
        try {
            const { data, error } = await this.supabase
                .from("oauth_tokens")
                .select("*")
                .eq("platform", platform)

            if (error) {
                throw new Error(`Database error: ${error.message}`)
            }

            logger.info("Platform tokens retrieved", {
                platform,
                count: data?.length || 0,
            })

            return (data || []).map(token =>
                this.mapDatabaseToStoredToken(token)
            )
        } catch (error) {
            logger.error("Failed to retrieve platform tokens", {
                platform,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Check if user has any tokens
     */
    async hasTokens(userId: string): Promise<boolean> {
        try {
            const { data, error } = await this.supabase
                .from("oauth_tokens")
                .select("id", { count: "exact" })
                .eq("user_id", userId)

            if (error) {
                throw new Error(`Database error: ${error.message}`)
            }

            return (data?.length || 0) > 0
        } catch (error) {
            logger.error("Failed to check user tokens", {
                userId,
                error: error instanceof Error ? error.message : String(error),
            })
            return false
        }
    }

    /**
     * Map database record to StoredToken
     */
    private mapDatabaseToStoredToken(dbToken: any): StoredToken {
        return {
            id: dbToken.id,
            userId: dbToken.user_id,
            platform: dbToken.platform,
            encryptedToken: dbToken.encrypted_token,
            refreshToken: dbToken.refresh_token || undefined,
            expiresAt: dbToken.expires_at
                ? new Date(dbToken.expires_at).getTime()
                : undefined,
            linkedAt: new Date(dbToken.linked_at).getTime(),
            createdAt: new Date(dbToken.created_at).getTime(),
            updatedAt: new Date(dbToken.updated_at).getTime(),
        }
    }
}

/**
 * Create a singleton Token Store instance
 */
let tokenStoreInstance: TokenStore | null = null

/**
 * Get or create the Token Store
 */
export function getTokenStore(): TokenStore {
    if (!tokenStoreInstance) {
        tokenStoreInstance = new TokenStore()
    }
    return tokenStoreInstance
}

/**
 * Reset the Token Store (useful for testing)
 */
export function resetTokenStore(): void {
    tokenStoreInstance = null
}
