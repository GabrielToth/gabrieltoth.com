/**
 * Account Completion Performance Optimization Module
 *
 * Provides caching, query optimization, and performance monitoring
 * for the account completion flow.
 *
 * Validates: Phase 9 - Performance Optimization
 */

import { logger } from "@/lib/logger"
import { OAuthUser } from "@/types/auth"

/**
 * In-memory cache for user lookups
 * TTL: 5 minutes
 */
const userCache = new Map<string, { data: OAuthUser; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds

/**
 * Cache for email uniqueness checks
 * TTL: 2 minutes
 */
const emailCache = new Map<string, { exists: boolean; timestamp: number }>()
const EMAIL_CACHE_TTL = 2 * 60 * 1000 // 2 minutes in milliseconds

/**
 * Get user from cache or return null if expired
 */
export function getCachedUser(key: string): OAuthUser | null {
    const cached = userCache.get(key)
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > CACHE_TTL
    if (isExpired) {
        userCache.delete(key)
        return null
    }

    return cached.data
}

/**
 * Set user in cache
 */
export function setCachedUser(key: string, user: OAuthUser): void {
    userCache.set(key, {
        data: user,
        timestamp: Date.now(),
    })
}

/**
 * Clear user cache
 */
export function clearUserCache(key?: string): void {
    if (key) {
        userCache.delete(key)
    } else {
        userCache.clear()
    }
}

/**
 * Get email existence from cache
 */
export function getCachedEmailExists(email: string): boolean | null {
    const cached = emailCache.get(email.toLowerCase())
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > EMAIL_CACHE_TTL
    if (isExpired) {
        emailCache.delete(email.toLowerCase())
        return null
    }

    return cached.exists
}

/**
 * Set email existence in cache
 */
export function setCachedEmailExists(email: string, exists: boolean): void {
    emailCache.set(email.toLowerCase(), {
        exists,
        timestamp: Date.now(),
    })
}

/**
 * Clear email cache
 */
export function clearEmailCache(email?: string): void {
    if (email) {
        emailCache.delete(email.toLowerCase())
    } else {
        emailCache.clear()
    }
}

/**
 * Performance metrics for account completion
 */
export interface PerformanceMetrics {
    queryTime: number // milliseconds
    cacheHit: boolean
    totalTime: number // milliseconds
}

/**
 * Measure query performance
 */
export function measurePerformance(
    operation: string,
    startTime: number,
    cacheHit: boolean = false
): PerformanceMetrics {
    const totalTime = Date.now() - startTime

    const metrics: PerformanceMetrics = {
        queryTime: totalTime,
        cacheHit,
        totalTime,
    }

    // Log slow queries (> 100ms)
    if (totalTime > 100) {
        logger.warn("Slow query detected", {
            context: "AccountCompletionPerformance",
            operation,
            duration: totalTime,
            cacheHit,
        })
    }

    return metrics
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
    userCacheSize: number
    emailCacheSize: number
    totalCacheSize: number
} {
    return {
        userCacheSize: userCache.size,
        emailCacheSize: emailCache.size,
        totalCacheSize: userCache.size + emailCache.size,
    }
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
    userCache.clear()
    emailCache.clear()
    logger.info("All caches cleared", {
        context: "AccountCompletionPerformance",
    })
}

/**
 * Cleanup expired cache entries
 */
export function cleanupExpiredCacheEntries(): void {
    const now = Date.now()
    let userCleaned = 0
    let emailCleaned = 0

    // Cleanup user cache
    for (const [key, value] of userCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
            userCache.delete(key)
            userCleaned++
        }
    }

    // Cleanup email cache
    for (const [key, value] of emailCache.entries()) {
        if (now - value.timestamp > EMAIL_CACHE_TTL) {
            emailCache.delete(key)
            emailCleaned++
        }
    }

    if (userCleaned > 0 || emailCleaned > 0) {
        logger.debug("Cache cleanup completed", {
            context: "AccountCompletionPerformance",
            userCleaned,
            emailCleaned,
        })
    }
}

/**
 * Periodic cache cleanup (run every 5 minutes)
 */
export function startCacheCleanupInterval(): NodeJS.Timeout {
    return setInterval(
        () => {
            cleanupExpiredCacheEntries()
        },
        5 * 60 * 1000
    ) // 5 minutes
}
