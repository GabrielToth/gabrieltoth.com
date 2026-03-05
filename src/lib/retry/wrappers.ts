// Retry Wrappers for Critical Operations
// Applies retry logic to database, Redis, and Discord operations

import { Redis } from "ioredis"
import { Pool } from "pg"
import { createLogger } from "../logger"
import {
    RetryConfig,
    defaultRetryConfig,
    withRetry,
    withRetryAndFilter,
} from "./index"

const logger = createLogger("RetryWrappers")

/**
 * Wrap database connection with retry logic
 */
export async function connectDatabaseWithRetry(
    connectionString: string,
    config: RetryConfig = defaultRetryConfig
): Promise<Pool> {
    return withRetry(async () => {
        logger.info("Attempting database connection")
        const pool = new Pool({ connectionString })

        // Test connection
        const client = await pool.connect()
        client.release()

        logger.info("Database connection successful")
        return pool
    }, config)
}

/**
 * Wrap Redis connection with retry logic
 */
export async function connectRedisWithRetry(
    url: string,
    config: RetryConfig = defaultRetryConfig
): Promise<Redis> {
    return withRetry(async () => {
        logger.info("Attempting Redis connection")
        const redis = new Redis(url)

        // Test connection
        await redis.ping()

        logger.info("Redis connection successful")
        return redis
    }, config)
}

/**
 * Wrap Discord webhook with retry logic (optional - only retry on network errors)
 */
export async function sendDiscordWithRetry(
    webhookUrl: string,
    payload: any,
    config: RetryConfig = { ...defaultRetryConfig, maxAttempts: 2 }
): Promise<void> {
    return withRetryAndFilter(
        async () => {
            const response = await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                throw new Error(`Discord webhook failed: ${response.status}`)
            }
        },
        error => {
            // Only retry on network errors, not on 4xx errors
            return !error.message.includes("4")
        },
        config
    )
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error): boolean {
    const retryableMessages = [
        "ECONNREFUSED",
        "ETIMEDOUT",
        "ENOTFOUND",
        "ENETUNREACH",
        "connection timeout",
        "network error",
    ]

    return retryableMessages.some(msg =>
        error.message.toLowerCase().includes(msg.toLowerCase())
    )
}
