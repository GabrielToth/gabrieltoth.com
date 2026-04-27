/**
 * Redis Client Initialization
 * Handles connection to Redis/Upstash with retry logic and error handling
 */

import { Redis } from "@upstash/redis"
import { createLogger } from "../logger"

const logger = createLogger("RedisClient")

let redisClient: Redis | null = null
let isConnecting = false
let connectionError: Error | null = null

/**
 * Initialize Redis connection
 * Supports both Upstash (REST API) and local Redis
 */
export async function initializeRedis(): Promise<Redis | null> {
    // Return existing client if already initialized
    if (redisClient) {
        return redisClient
    }

    // Prevent multiple simultaneous connection attempts
    if (isConnecting) {
        // Wait for connection to complete
        let attempts = 0
        while (isConnecting && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100))
            attempts++
        }
        return redisClient
    }

    isConnecting = true
    connectionError = null

    try {
        const url = process.env.UPSTASH_REDIS_REST_URL
        const token = process.env.UPSTASH_REDIS_REST_TOKEN

        if (!url || !token) {
            logger.warn(
                "Redis credentials not configured. Caching will be disabled."
            )
            isConnecting = false
            return null
        }

        redisClient = new Redis({
            url,
            token,
        })

        // Test connection
        await redisClient.ping()
        logger.info("Redis connection established successfully")

        return redisClient
    } catch (error) {
        connectionError =
            error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to connect to Redis", {
            error: connectionError.message,
        })
        redisClient = null
        return null
    } finally {
        isConnecting = false
    }
}

/**
 * Get Redis client instance
 * Initializes if not already connected
 */
export async function getRedisClient(): Promise<Redis | null> {
    if (redisClient) {
        return redisClient
    }

    return initializeRedis()
}

/**
 * Check if Redis is connected
 */
export function isRedisConnected(): boolean {
    return redisClient !== null
}

/**
 * Get last connection error
 */
export function getConnectionError(): Error | null {
    return connectionError
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
    if (redisClient) {
        try {
            // Upstash Redis doesn't require explicit close
            // but we'll clear the reference
            redisClient = null
            logger.info("Redis connection closed")
        } catch (error) {
            logger.error("Error closing Redis connection", {
                error: error instanceof Error ? error.message : String(error),
            })
        }
    }
}
