/**
 * Rate Limiting for Login Attempts
 * Implements protection against brute force attacks
 * Max 5 failed attempts per hour per IP address
 *
 * Supports both Redis (cloud) and in-memory (local) backends
 */

import { getRedisClient, isRedisConnected } from "@/lib/cache/redis-client"
import { createLogger } from "@/lib/logger"

const logger = createLogger("RateLimiter")

const MAX_ATTEMPTS = 5
const WINDOW_DURATION_HOURS = 1
const WINDOW_DURATION_MS = WINDOW_DURATION_HOURS * 60 * 60 * 1000

// Enhanced rate limiting for degraded mode (CAPTCHA unavailable)
const DEGRADED_MODE_MAX_ATTEMPTS = 3
const DEGRADED_MODE_WINDOW_MINUTES = 10
const DEGRADED_MODE_WINDOW_MS = DEGRADED_MODE_WINDOW_MINUTES * 60 * 1000

/**
 * In-memory store for rate limiting (local development fallback)
 * Structure: { [key: string]: { count: number; resetTime: number } }
 */
const inMemoryStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Generate cache key for rate limiting
 */
function generateKey(ipAddress: string): string {
    return `rate-limit:login:${ipAddress}`
}

/**
 * Clean up expired entries from in-memory store
 */
function cleanupInMemoryStore(): void {
    const now = Date.now()
    for (const [key, value] of inMemoryStore.entries()) {
        if (value.resetTime < now) {
            inMemoryStore.delete(key)
        }
    }
}

/**
 * Get attempt count from in-memory store
 */
function getInMemoryAttemptCount(key: string): number {
    cleanupInMemoryStore()
    const entry = inMemoryStore.get(key)
    if (!entry) {
        return 0
    }
    if (entry.resetTime < Date.now()) {
        inMemoryStore.delete(key)
        return 0
    }
    return entry.count
}

/**
 * Increment attempt count in in-memory store
 */
function incrementInMemoryAttempt(key: string): number {
    cleanupInMemoryStore()
    const entry = inMemoryStore.get(key)
    const now = Date.now()

    if (!entry || entry.resetTime < now) {
        // Create new entry
        const newEntry = { count: 1, resetTime: now + WINDOW_DURATION_MS }
        inMemoryStore.set(key, newEntry)
        return 1
    }

    // Increment existing entry
    entry.count++
    return entry.count
}

/**
 * Reset attempt count in in-memory store
 */
function resetInMemoryAttempts(key: string): void {
    inMemoryStore.delete(key)
}

/**
 * Get attempt count from Redis
 */
async function getRedisAttemptCount(key: string): Promise<number> {
    try {
        const client = await getRedisClient()
        if (!client) {
            return 0
        }

        const count = await client.get(key)
        return count ? parseInt(String(count), 10) : 0
    } catch (error) {
        logger.error("Failed to get attempt count from Redis", {
            key,
            error: error instanceof Error ? error.message : String(error),
        })
        return 0
    }
}

/**
 * Increment attempt count in Redis
 */
async function incrementRedisAttempt(key: string): Promise<number> {
    try {
        const client = await getRedisClient()
        if (!client) {
            return 0
        }

        // Increment and set expiration
        const count = await client.incr(key)

        // Set expiration on first increment
        if (count === 1) {
            await client.expire(key, WINDOW_DURATION_HOURS * 60 * 60)
        }

        return count
    } catch (error) {
        logger.error("Failed to increment attempt count in Redis", {
            key,
            error: error instanceof Error ? error.message : String(error),
        })
        return 0
    }
}

/**
 * Reset attempt count in Redis
 */
async function resetRedisAttempts(key: string): Promise<void> {
    try {
        const client = await getRedisClient()
        if (!client) {
            return
        }

        await client.del(key)
    } catch (error) {
        logger.error("Failed to reset attempt count in Redis", {
            key,
            error: error instanceof Error ? error.message : String(error),
        })
    }
}

/**
 * Check if IP address has exceeded rate limit
 * Returns true if rate limit is exceeded, false otherwise
 */
export async function checkRateLimit(ipAddress: string): Promise<boolean> {
    const key = generateKey(ipAddress)

    try {
        let attemptCount: number

        if (isRedisConnected()) {
            attemptCount = await getRedisAttemptCount(key)
        } else {
            attemptCount = getInMemoryAttemptCount(key)
        }

        const isLimited = attemptCount >= MAX_ATTEMPTS

        if (isLimited) {
            logger.warn("Rate limit exceeded", {
                ipAddress,
                attemptCount,
            })
        }

        return isLimited
    } catch (error) {
        logger.error("Error checking rate limit", {
            ipAddress,
            error: error instanceof Error ? error.message : String(error),
        })
        // Fail open: allow request if rate limiter fails
        return false
    }
}

/**
 * Increment attempt counter for failed login
 * Returns the new attempt count
 */
export async function incrementAttempt(ipAddress: string): Promise<number> {
    const key = generateKey(ipAddress)

    try {
        let newCount: number

        if (isRedisConnected()) {
            newCount = await incrementRedisAttempt(key)
        } else {
            newCount = incrementInMemoryAttempt(key)
        }

        logger.debug("Login attempt incremented", {
            ipAddress,
            attemptCount: newCount,
        })

        return newCount
    } catch (error) {
        logger.error("Error incrementing attempt count", {
            ipAddress,
            error: error instanceof Error ? error.message : String(error),
        })
        return 0
    }
}

/**
 * Reset attempt counter for successful login
 */
export async function resetAttempt(ipAddress: string): Promise<void> {
    const key = generateKey(ipAddress)

    try {
        if (isRedisConnected()) {
            await resetRedisAttempts(key)
        } else {
            resetInMemoryAttempts(key)
        }

        logger.debug("Login attempts reset", { ipAddress })
    } catch (error) {
        logger.error("Error resetting attempt count", {
            ipAddress,
            error: error instanceof Error ? error.message : String(error),
        })
    }
}

/**
 * Get current attempt count for an IP address
 */
export async function getAttemptCount(ipAddress: string): Promise<number> {
    const key = generateKey(ipAddress)

    try {
        let count: number

        if (isRedisConnected()) {
            count = await getRedisAttemptCount(key)
        } else {
            count = getInMemoryAttemptCount(key)
        }

        return count
    } catch (error) {
        logger.error("Error getting attempt count", {
            ipAddress,
            error: error instanceof Error ? error.message : String(error),
        })
        return 0
    }
}

/**
 * Get remaining attempts before rate limit
 */
export async function getRemainingAttempts(ipAddress: string): Promise<number> {
    const count = await getAttemptCount(ipAddress)
    return Math.max(0, MAX_ATTEMPTS - count)
}

/**
 * Get time until rate limit resets (in seconds)
 */
export async function getTimeUntilReset(ipAddress: string): Promise<number> {
    const key = generateKey(ipAddress)

    try {
        if (isRedisConnected()) {
            const client = await getRedisClient()
            if (!client) {
                return 0
            }

            const ttl = await client.ttl(key)
            return Math.max(0, ttl)
        } else {
            cleanupInMemoryStore()
            const entry = inMemoryStore.get(key)
            if (!entry) {
                return 0
            }

            const timeRemaining = entry.resetTime - Date.now()
            return Math.max(0, Math.ceil(timeRemaining / 1000))
        }
    } catch (error) {
        logger.error("Error getting time until reset", {
            ipAddress,
            error: error instanceof Error ? error.message : String(error),
        })
        return 0
    }
}

/**
 * Clear all rate limit entries (for testing/admin purposes)
 */
export async function clearAllRateLimits(): Promise<void> {
    try {
        if (isRedisConnected()) {
            const client = await getRedisClient()
            if (!client) {
                return
            }

            const keys = await client.keys("rate-limit:login:*")
            if (keys.length > 0) {
                await client.del(...keys)
            }
        } else {
            inMemoryStore.clear()
        }

        logger.info("All rate limits cleared")
    } catch (error) {
        logger.error("Error clearing rate limits", {
            error: error instanceof Error ? error.message : String(error),
        })
    }
}

/**
 * Get rate limiter statistics (for monitoring)
 */
export async function getRateLimiterStats(): Promise<{
    backend: "redis" | "in-memory"
    entriesCount: number
}> {
    try {
        if (isRedisConnected()) {
            const client = await getRedisClient()
            if (!client) {
                return { backend: "in-memory", entriesCount: 0 }
            }

            const keys = await client.keys("rate-limit:login:*")
            return {
                backend: "redis",
                entriesCount: keys.length,
            }
        } else {
            cleanupInMemoryStore()
            return {
                backend: "in-memory",
                entriesCount: inMemoryStore.size,
            }
        }
    } catch (error) {
        logger.error("Error getting rate limiter stats", {
            error: error instanceof Error ? error.message : String(error),
        })
        return { backend: "in-memory", entriesCount: 0 }
    }
}

/**
 * Check rate limit with degraded mode support
 *
 * In degraded mode (CAPTCHA unavailable):
 * - Stricter failure threshold (3 instead of 5)
 * - Shorter lockout window (10 minutes instead of 15)
 * - More aggressive logging
 *
 * @param ipAddress Client IP address
 * @param degradedMode Whether CAPTCHA service is unavailable
 * @returns Object with rate limit status and details
 */
export async function checkRateLimitWithDegradation(
    ipAddress: string,
    degradedMode: boolean = false
): Promise<{
    allowed: boolean
    remainingAttempts: number
    degradedMode: boolean
    reason?: string
}> {
    const key = generateKey(ipAddress)
    const maxAttempts = degradedMode ? DEGRADED_MODE_MAX_ATTEMPTS : MAX_ATTEMPTS
    const windowMs = degradedMode ? DEGRADED_MODE_WINDOW_MS : WINDOW_DURATION_MS

    try {
        let attemptCount: number

        if (isRedisConnected()) {
            attemptCount = await getRedisAttemptCount(key)
        } else {
            attemptCount = getInMemoryAttemptCount(key)
        }

        const isLimited = attemptCount >= maxAttempts

        if (isLimited) {
            const logLevel = degradedMode ? "error" : "warn"
            logger[logLevel as "warn" | "error"](
                "Rate limit exceeded" +
                    (degradedMode ? " (degraded mode)" : ""),
                {
                    ipAddress,
                    attemptCount,
                    maxAttempts,
                    degradedMode,
                    windowMinutes: degradedMode
                        ? DEGRADED_MODE_WINDOW_MINUTES
                        : WINDOW_DURATION_HOURS * 60,
                }
            )

            // Log degraded mode rate limiting for audit trail
            if (degradedMode) {
                logger.info("Degraded mode rate limiting applied", {
                    event_type: "rate_limit_degraded_mode",
                    ipAddress,
                    attemptCount,
                    maxAttempts: DEGRADED_MODE_MAX_ATTEMPTS,
                    lockout_window_minutes: DEGRADED_MODE_WINDOW_MINUTES,
                    timestamp: new Date().toISOString(),
                })
            }
        }

        return {
            allowed: !isLimited,
            remainingAttempts: Math.max(0, maxAttempts - attemptCount),
            degradedMode,
            reason: isLimited
                ? degradedMode
                    ? `Too many attempts (degraded mode: ${maxAttempts} attempts in ${DEGRADED_MODE_WINDOW_MINUTES} minutes)`
                    : `Too many attempts (${maxAttempts} attempts in ${WINDOW_DURATION_HOURS} hour)`
                : undefined,
        }
    } catch (error) {
        logger.error("Error checking rate limit with degradation", {
            ipAddress,
            degradedMode,
            error: error instanceof Error ? error.message : String(error),
        })
        // Fail open: allow request if rate limiter fails
        return {
            allowed: true,
            remainingAttempts: maxAttempts,
            degradedMode,
        }
    }
}

/**
 * Increment attempt counter with degraded mode support
 *
 * In degraded mode, uses shorter window (10 minutes instead of 15)
 * and logs more aggressively for audit trail.
 *
 * @param ipAddress Client IP address
 * @param degradedMode Whether CAPTCHA service is unavailable
 * @returns New attempt count
 */
export async function incrementAttemptWithDegradation(
    ipAddress: string,
    degradedMode: boolean = false
): Promise<number> {
    const key = generateKey(ipAddress)
    const windowMs = degradedMode ? DEGRADED_MODE_WINDOW_MS : WINDOW_DURATION_MS

    try {
        let newCount: number

        if (isRedisConnected()) {
            const client = await getRedisClient()
            if (!client) {
                return 0
            }

            // Increment and set expiration
            newCount = await client.incr(key)

            // Set expiration on first increment
            if (newCount === 1) {
                const expirationSeconds = degradedMode
                    ? DEGRADED_MODE_WINDOW_MINUTES * 60
                    : WINDOW_DURATION_HOURS * 60 * 60
                await client.expire(key, expirationSeconds)
            }
        } else {
            cleanupInMemoryStore()
            const entry = inMemoryStore.get(key)
            const now = Date.now()

            if (!entry || entry.resetTime < now) {
                // Create new entry
                const newEntry = {
                    count: 1,
                    resetTime: now + windowMs,
                }
                inMemoryStore.set(key, newEntry)
                newCount = 1
            } else {
                // Increment existing entry
                entry.count++
                newCount = entry.count
            }
        }

        // Log with degraded mode indicator
        if (degradedMode) {
            logger.warn("Login attempt incremented (degraded mode)", {
                ipAddress,
                attemptCount: newCount,
                maxAttempts: DEGRADED_MODE_MAX_ATTEMPTS,
                windowMinutes: DEGRADED_MODE_WINDOW_MINUTES,
            })
        } else {
            logger.debug("Login attempt incremented", {
                ipAddress,
                attemptCount: newCount,
            })
        }

        return newCount
    } catch (error) {
        logger.error("Error incrementing attempt count with degradation", {
            ipAddress,
            degradedMode,
            error: error instanceof Error ? error.message : String(error),
        })
        return 0
    }
}
