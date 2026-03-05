// In-Memory Rate Limiter
// Focus: Simple, efficient, automatic cleanup

import { createLogger } from "../logger/pino-logger"

const logger = createLogger("RateLimiter")

export interface RateLimiter {
    shouldAllow(key: string): boolean
}

export class InMemoryRateLimiter implements RateLimiter {
    private cache = new Map<string, number>()
    private readonly windowMs: number
    private cleanupInterval: NodeJS.Timeout | null = null

    constructor(windowMs: number = 60000) {
        // Default: 1 minute
        this.windowMs = windowMs
        // Proactive cleanup every 5 minutes
        this.cleanupInterval = setInterval(
            () => this.cleanup(Date.now()),
            5 * 60 * 1000
        )
    }

    shouldAllow(key: string): boolean {
        const now = Date.now()
        const lastSent = this.cache.get(key)

        if (!lastSent || now - lastSent >= this.windowMs) {
            this.cache.set(key, now)

            // Cleanup old entries to prevent memory leaks
            this.cleanup(now)

            return true
        }

        logger.debug("Rate limit hit", {
            key,
            lastSent,
            now,
            windowMs: this.windowMs,
        })
        return false
    }

    private cleanup(now: number): void {
        for (const [key, timestamp] of this.cache.entries()) {
            if (now - timestamp >= this.windowMs) {
                this.cache.delete(key)
            }
        }
    }

    // For testing: clear all rate limits
    clear(): void {
        this.cache.clear()
    }

    // For testing: get cache size
    size(): number {
        return this.cache.size
    }

    // Cleanup on destroy
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval)
            this.cleanupInterval = null
        }
        this.cache.clear()
    }
}

export default InMemoryRateLimiter
