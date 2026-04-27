/**
 * Network Manager Service
 * Manages social media network linking, unlinking, and status checking
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { createClient } from "@supabase/supabase-js"
import { CACHE_KEYS, CacheManager } from "../cache"
import { createLogger } from "../logger"
import { getTokenStore } from "../token-store"

const logger = createLogger("NetworkManager")

/**
 * Supported social media platforms
 */
export type SocialPlatform =
    | "youtube"
    | "facebook"
    | "instagram"
    | "twitter"
    | "linkedin"

/**
 * Network status
 */
export type NetworkStatus = "connected" | "disconnected" | "expired" | "error"

/**
 * Social network record
 */
export interface SocialNetwork {
    id: string
    userId: string
    platform: SocialPlatform
    platformUserId: string
    platformUsername: string
    status: NetworkStatus
    linkedAt: number
    expiresAt?: number
    metadata?: Record<string, any>
    createdAt: number
    updatedAt: number
}

/**
 * Network Manager
 * Handles network linking, unlinking, and status management
 */
export class NetworkManager {
    private supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    )
    private tokenStore = getTokenStore()

    /**
     * Link a social network to a user account
     */
    async linkNetwork(
        userId: string,
        platform: SocialPlatform,
        platformUserId: string,
        platformUsername: string,
        metadata?: Record<string, any>
    ): Promise<SocialNetwork> {
        try {
            // Check if network is already linked
            const { data: existing } = await this.supabase
                .from("social_networks")
                .select("id")
                .eq("user_id", userId)
                .eq("platform", platform)
                .single()

            const now = Date.now()

            let result

            if (existing) {
                // Update existing network
                result = await this.supabase
                    .from("social_networks")
                    .update({
                        platform_user_id: platformUserId,
                        platform_username: platformUsername,
                        status: "connected",
                        metadata: metadata || null,
                        updated_at: new Date(now),
                    })
                    .eq("user_id", userId)
                    .eq("platform", platform)
                    .select()
                    .single()
            } else {
                // Insert new network
                result = await this.supabase
                    .from("social_networks")
                    .insert({
                        user_id: userId,
                        platform,
                        platform_user_id: platformUserId,
                        platform_username: platformUsername,
                        status: "connected",
                        linked_at: new Date(now),
                        metadata: metadata || null,
                        created_at: new Date(now),
                        updated_at: new Date(now),
                    })
                    .select()
                    .single()
            }

            if (result.error) {
                throw new Error(`Database error: ${result.error.message}`)
            }

            // Invalidate cache
            await CacheManager.delete(CACHE_KEYS.USER_NETWORKS(userId))

            logger.info("Network linked successfully", {
                userId,
                platform,
                platformUserId,
            })

            return this.mapDatabaseToNetwork(result.data)
        } catch (error) {
            logger.error("Failed to link network", {
                userId,
                platform,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Unlink a social network from a user account
     */
    async unlinkNetwork(
        userId: string,
        platform: SocialPlatform
    ): Promise<boolean> {
        try {
            // Get the network to revoke token
            const { data: network } = await this.supabase
                .from("social_networks")
                .select("*")
                .eq("user_id", userId)
                .eq("platform", platform)
                .single()

            if (!network) {
                logger.warn("Network not found for unlinking", {
                    userId,
                    platform,
                })
                return false
            }

            // Revoke token if it exists
            try {
                await this.tokenStore.deleteToken(userId, platform)
            } catch (error) {
                logger.warn("Failed to delete token during unlinking", {
                    userId,
                    platform,
                    error:
                        error instanceof Error ? error.message : String(error),
                })
            }

            // Delete the network
            const { error } = await this.supabase
                .from("social_networks")
                .delete()
                .eq("user_id", userId)
                .eq("platform", platform)

            if (error) {
                throw new Error(`Database error: ${error.message}`)
            }

            // Invalidate cache
            await CacheManager.delete(CACHE_KEYS.USER_NETWORKS(userId))

            logger.info("Network unlinked successfully", {
                userId,
                platform,
            })

            return true
        } catch (error) {
            logger.error("Failed to unlink network", {
                userId,
                platform,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Get all networks for a user
     */
    async getUserNetworks(userId: string): Promise<SocialNetwork[]> {
        try {
            // Try to get from cache first
            const cacheKey = CACHE_KEYS.USER_NETWORKS(userId)
            const cached = await CacheManager.get<SocialNetwork[]>(cacheKey)

            if (cached) {
                logger.debug("User networks retrieved from cache", { userId })
                return cached
            }

            // Get from database
            const { data, error } = await this.supabase
                .from("social_networks")
                .select("*")
                .eq("user_id", userId)

            if (error) {
                throw new Error(`Database error: ${error.message}`)
            }

            const networks = (data || []).map(network =>
                this.mapDatabaseToNetwork(network)
            )

            // Cache for 5 minutes
            await CacheManager.set(cacheKey, networks, 5 * 60)

            logger.info("User networks retrieved", {
                userId,
                count: networks.length,
            })

            return networks
        } catch (error) {
            logger.error("Failed to retrieve user networks", {
                userId,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Get a specific network for a user
     */
    async getNetwork(
        userId: string,
        platform: SocialPlatform
    ): Promise<SocialNetwork | null> {
        try {
            const { data, error } = await this.supabase
                .from("social_networks")
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

            logger.info("Network retrieved", { userId, platform })

            return this.mapDatabaseToNetwork(data)
        } catch (error) {
            logger.error("Failed to retrieve network", {
                userId,
                platform,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Check network status
     */
    async checkNetworkStatus(
        userId: string,
        platform: SocialPlatform
    ): Promise<NetworkStatus> {
        try {
            const network = await this.getNetwork(userId, platform)

            if (!network) {
                return "disconnected"
            }

            // Check if token is valid
            const isTokenValid = await this.tokenStore.isTokenValid(
                userId,
                platform
            )

            if (!isTokenValid) {
                // Update network status
                await this.supabase
                    .from("social_networks")
                    .update({
                        status: "expired",
                        updated_at: new Date(),
                    })
                    .eq("user_id", userId)
                    .eq("platform", platform)

                // Invalidate cache
                await CacheManager.delete(CACHE_KEYS.USER_NETWORKS(userId))

                return "expired"
            }

            return "connected"
        } catch (error) {
            logger.error("Failed to check network status", {
                userId,
                platform,
                error: error instanceof Error ? error.message : String(error),
            })
            return "error"
        }
    }

    /**
     * Get status for all user networks
     */
    async getUserNetworkStatuses(
        userId: string
    ): Promise<Record<SocialPlatform, NetworkStatus>> {
        try {
            const networks = await this.getUserNetworks(userId)
            const statuses: Record<SocialPlatform, NetworkStatus> = {
                youtube: "disconnected",
                facebook: "disconnected",
                instagram: "disconnected",
                twitter: "disconnected",
                linkedin: "disconnected",
            }

            for (const network of networks) {
                const status = await this.checkNetworkStatus(
                    userId,
                    network.platform
                )
                statuses[network.platform] = status
            }

            logger.info("User network statuses retrieved", {
                userId,
                statuses,
            })

            return statuses
        } catch (error) {
            logger.error("Failed to retrieve user network statuses", {
                userId,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Check if user has any linked networks
     */
    async hasLinkedNetworks(userId: string): Promise<boolean> {
        try {
            const networks = await this.getUserNetworks(userId)
            return networks.length > 0
        } catch (error) {
            logger.error("Failed to check linked networks", {
                userId,
                error: error instanceof Error ? error.message : String(error),
            })
            return false
        }
    }

    /**
     * Map database record to SocialNetwork
     */
    private mapDatabaseToNetwork(dbNetwork: any): SocialNetwork {
        return {
            id: dbNetwork.id,
            userId: dbNetwork.user_id,
            platform: dbNetwork.platform,
            platformUserId: dbNetwork.platform_user_id,
            platformUsername: dbNetwork.platform_username,
            status: dbNetwork.status,
            linkedAt: new Date(dbNetwork.linked_at).getTime(),
            expiresAt: dbNetwork.expires_at
                ? new Date(dbNetwork.expires_at).getTime()
                : undefined,
            metadata: dbNetwork.metadata,
            createdAt: new Date(dbNetwork.created_at).getTime(),
            updatedAt: new Date(dbNetwork.updated_at).getTime(),
        }
    }
}

/**
 * Create a singleton Network Manager instance
 */
let networkManagerInstance: NetworkManager | null = null

/**
 * Get or create the Network Manager
 */
export function getNetworkManager(): NetworkManager {
    if (!networkManagerInstance) {
        networkManagerInstance = new NetworkManager()
    }
    return networkManagerInstance
}

/**
 * Reset the Network Manager (useful for testing)
 */
export function resetNetworkManager(): void {
    networkManagerInstance = null
}
