/**
 * Cache Manager
 * Provides high-level caching operations with key patterns and TTL policies
 * Supports network status, user preferences, and publication queue caching
 */

import { createLogger } from "../logger"
import { getRedisClient, isRedisConnected } from "./redis-client"

const logger = createLogger("CacheManager")

/**
 * Cache key patterns for different data types
 */
export const CACHE_KEYS = {
    // Network status cache
    NETWORK_STATUS: (userId: string) => `network:status:${userId}`,
    NETWORK_LIST: (userId: string) => `network:list:${userId}`,
    USER_NETWORKS: (userId: string) => `networks:user:${userId}`,
    NETWORK_GROUPS: (userId: string) => `network:groups:${userId}`,
    USER_GROUPS: (userId: string) => `groups:user:${userId}`,
    NETWORK_GROUP_DETAIL: (userId: string, groupId: string) =>
        `network:group:${userId}:${groupId}`,

    // User preferences cache
    USER_PREFERENCES: (userId: string) => `preferences:${userId}`,
    USER_TIMEZONE: (userId: string) => `preferences:timezone:${userId}`,
    USER_DEFAULT_NETWORKS: (userId: string) =>
        `preferences:default_networks:${userId}`,

    // Publication queue cache
    PUBLICATION_QUEUE: (userId: string) => `queue:${userId}`,
    SCHEDULED_POST: (postId: string) => `post:scheduled:${postId}`,
    PUBLICATION_HISTORY: (userId: string) => `history:${userId}`,

    // OAuth token cache
    OAUTH_TOKEN: (userId: string, platform: string) =>
        `oauth:token:${userId}:${platform}`,
    OAUTH_STATUS: (userId: string) => `oauth:status:${userId}`,

    // General cache
    GENERAL: (key: string) => `cache:${key}`,
}

/**
 * TTL (Time To Live) policies for different cache types
 * Values in seconds
 */
export const CACHE_TTL = {
    // Short-lived cache (5 minutes)
    SHORT: 5 * 60,

    // Medium-lived cache (30 minutes)
    MEDIUM: 30 * 60,

    // Long-lived cache (1 hour)
    LONG: 60 * 60,

    // Very long-lived cache (24 hours)
    VERY_LONG: 24 * 60 * 60,

    // Network status (15 minutes - refresh frequently)
    NETWORK_STATUS: 15 * 60,

    // User preferences (1 hour - stable data)
    USER_PREFERENCES: 60 * 60,

    // Publication queue (5 minutes - frequently updated)
    PUBLICATION_QUEUE: 5 * 60,

    // OAuth tokens (1 hour - refresh before expiry)
    OAUTH_TOKEN: 60 * 60,

    // Publication history (30 minutes)
    PUBLICATION_HISTORY: 30 * 60,
}

/**
 * Cache Manager class
 * Provides methods for getting, setting, and invalidating cache
 */
export class CacheManager {
    /**
     * Get value from cache
     */
    static async get<T>(key: string): Promise<T | null> {
        try {
            if (!isRedisConnected()) {
                return null
            }

            const client = await getRedisClient()
            if (!client) {
                return null
            }

            const value = await client.get(key)
            if (!value) {
                return null
            }

            // Parse JSON if it's a string
            if (typeof value === "string") {
                try {
                    return JSON.parse(value) as T
                } catch {
                    // Return as-is if not JSON
                    return value as T
                }
            }

            return value as T
        } catch (error) {
            logger.error("Cache get error", {
                key,
                error: error instanceof Error ? error.message : String(error),
            })
            return null
        }
    }

    /**
     * Set value in cache with TTL
     */
    static async set<T>(
        key: string,
        value: T,
        ttl: number = CACHE_TTL.MEDIUM
    ): Promise<boolean> {
        try {
            if (!isRedisConnected()) {
                return false
            }

            const client = await getRedisClient()
            if (!client) {
                return false
            }

            // Serialize value to JSON
            const serialized =
                typeof value === "string" ? value : JSON.stringify(value)

            await client.setex(key, ttl, serialized)
            return true
        } catch (error) {
            logger.error("Cache set error", {
                key,
                error: error instanceof Error ? error.message : String(error),
            })
            return false
        }
    }

    /**
     * Delete value from cache
     */
    static async delete(key: string): Promise<boolean> {
        try {
            if (!isRedisConnected()) {
                return false
            }

            const client = await getRedisClient()
            if (!client) {
                return false
            }

            const result = await client.del(key)
            return result > 0
        } catch (error) {
            logger.error("Cache delete error", {
                key,
                error: error instanceof Error ? error.message : String(error),
            })
            return false
        }
    }

    /**
     * Delete multiple keys matching a pattern
     */
    static async deletePattern(pattern: string): Promise<number> {
        try {
            if (!isRedisConnected()) {
                return 0
            }

            const client = await getRedisClient()
            if (!client) {
                return 0
            }

            // Get all keys matching pattern
            const keys = await client.keys(pattern)
            if (keys.length === 0) {
                return 0
            }

            // Delete all matching keys
            const result = await client.del(...keys)
            return result
        } catch (error) {
            logger.error("Cache delete pattern error", {
                pattern,
                error: error instanceof Error ? error.message : String(error),
            })
            return 0
        }
    }

    /**
     * Check if key exists in cache
     */
    static async exists(key: string): Promise<boolean> {
        try {
            if (!isRedisConnected()) {
                return false
            }

            const client = await getRedisClient()
            if (!client) {
                return false
            }

            const result = await client.exists(key)
            return result === 1
        } catch (error) {
            logger.error("Cache exists error", {
                key,
                error: error instanceof Error ? error.message : String(error),
            })
            return false
        }
    }

    /**
     * Get TTL of a key
     */
    static async getTTL(key: string): Promise<number> {
        try {
            if (!isRedisConnected()) {
                return -1
            }

            const client = await getRedisClient()
            if (!client) {
                return -1
            }

            const ttl = await client.ttl(key)
            return ttl
        } catch (error) {
            logger.error("Cache getTTL error", {
                key,
                error: error instanceof Error ? error.message : String(error),
            })
            return -1
        }
    }

    /**
     * Extend TTL of a key
     */
    static async extendTTL(key: string, ttl: number): Promise<boolean> {
        try {
            if (!isRedisConnected()) {
                return false
            }

            const client = await getRedisClient()
            if (!client) {
                return false
            }

            const result = await client.expire(key, ttl)
            return result === 1
        } catch (error) {
            logger.error("Cache extendTTL error", {
                key,
                error: error instanceof Error ? error.message : String(error),
            })
            return false
        }
    }

    /**
     * Clear all cache (use with caution!)
     */
    static async clearAll(): Promise<boolean> {
        try {
            if (!isRedisConnected()) {
                return false
            }

            const client = await getRedisClient()
            if (!client) {
                return false
            }

            await client.flushdb()
            logger.warn("All cache cleared")
            return true
        } catch (error) {
            logger.error("Cache clearAll error", {
                error: error instanceof Error ? error.message : String(error),
            })
            return false
        }
    }

    /**
     * Get cache statistics
     */
    static async getStats(): Promise<{
        connected: boolean
        error: string | null
    }> {
        return {
            connected: isRedisConnected(),
            error: null,
        }
    }
}

/**
 * Cache invalidation utilities
 */
export class CacheInvalidation {
    /**
     * Invalidate all cache for a user
     */
    static async invalidateUserCache(userId: string): Promise<void> {
        const patterns = [
            `network:*:${userId}`,
            `preferences:*:${userId}`,
            `queue:${userId}`,
            `history:${userId}`,
            `oauth:*:${userId}`,
        ]

        for (const pattern of patterns) {
            await CacheManager.deletePattern(pattern)
        }

        logger.info("User cache invalidated", { userId })
    }

    /**
     * Invalidate network cache for a user
     */
    static async invalidateNetworkCache(userId: string): Promise<void> {
        const patterns = [`network:*:${userId}`, `oauth:*:${userId}`]

        for (const pattern of patterns) {
            await CacheManager.deletePattern(pattern)
        }

        logger.info("Network cache invalidated", { userId })
    }

    /**
     * Invalidate preferences cache for a user
     */
    static async invalidatePreferencesCache(userId: string): Promise<void> {
        const patterns = [`preferences:*:${userId}`]

        for (const pattern of patterns) {
            await CacheManager.deletePattern(pattern)
        }

        logger.info("Preferences cache invalidated", { userId })
    }

    /**
     * Invalidate publication queue cache for a user
     */
    static async invalidateQueueCache(userId: string): Promise<void> {
        const patterns = [
            `queue:${userId}`,
            `post:scheduled:*`,
            `history:${userId}`,
        ]

        for (const pattern of patterns) {
            await CacheManager.deletePattern(pattern)
        }

        logger.info("Queue cache invalidated", { userId })
    }

    /**
     * Invalidate specific network group cache
     */
    static async invalidateGroupCache(
        userId: string,
        groupId?: string
    ): Promise<void> {
        if (groupId) {
            await CacheManager.delete(
                CACHE_KEYS.NETWORK_GROUP_DETAIL(userId, groupId)
            )
        }
        await CacheManager.delete(CACHE_KEYS.NETWORK_GROUPS(userId))
        logger.info("Group cache invalidated", { userId, groupId })
    }
}
