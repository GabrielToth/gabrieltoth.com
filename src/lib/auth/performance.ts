/**
 * Performance Optimization Utilities for Login System
 * Provides performance monitoring, optimization strategies, and metrics
 *
 * Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8
 */

import { createLogger } from "@/lib/logger"

const logger = createLogger("Performance")

/**
 * Performance metrics for monitoring
 */
export interface PerformanceMetrics {
    endpoint: string
    method: string
    duration: number
    timestamp: Date
    statusCode: number
    cached: boolean
    dbQueryTime?: number
    passwordHashTime?: number
    rateLimitTime?: number
    sessionTime?: number
}

/**
 * Performance thresholds (in milliseconds)
 */
export const PERFORMANCE_THRESHOLDS = {
    LOGIN_ENDPOINT: 500, // 500ms for complete login
    CSRF_VALIDATION: 50, // 50ms for CSRF validation
    RATE_LIMITING: 50, // 50ms for rate limiting check
    PASSWORD_HASHING: 250, // 250ms for Argon2id verify/hash
    DATABASE_QUERY: 100, // 100ms for database queries
    SESSION_STORAGE: 50, // 50ms for session storage
}

/**
 * In-memory metrics store for performance monitoring
 */
const metricsStore: PerformanceMetrics[] = []
const MAX_METRICS_STORED = 1000

/**
 * Record performance metric
 */
export function recordMetric(metric: PerformanceMetrics): void {
    metricsStore.push(metric)

    // Keep only recent metrics to avoid memory bloat
    if (metricsStore.length > MAX_METRICS_STORED) {
        metricsStore.shift()
    }

    // Log if threshold exceeded
    if (metric.duration > PERFORMANCE_THRESHOLDS.LOGIN_ENDPOINT) {
        logger.warn("Performance threshold exceeded", {
            endpoint: metric.endpoint,
            duration: metric.duration,
            threshold: PERFORMANCE_THRESHOLDS.LOGIN_ENDPOINT,
        })
    }
}

/**
 * Get performance metrics for analysis
 */
export function getMetrics(
    endpoint?: string,
    limit: number = 100
): PerformanceMetrics[] {
    let metrics = metricsStore

    if (endpoint) {
        metrics = metrics.filter(m => m.endpoint === endpoint)
    }

    return metrics.slice(-limit)
}

/**
 * Calculate average response time
 */
export function getAverageResponseTime(endpoint?: string): number {
    const metrics = getMetrics(endpoint)

    if (metrics.length === 0) {
        return 0
    }

    const total = metrics.reduce((sum, m) => sum + m.duration, 0)
    return total / metrics.length
}

/**
 * Calculate percentile response time (e.g., p95, p99)
 */
export function getPercentileResponseTime(
    percentile: number,
    endpoint?: string
): number {
    const metrics = getMetrics(endpoint)

    if (metrics.length === 0) {
        return 0
    }

    const sorted = metrics.map(m => m.duration).sort((a, b) => a - b)

    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]
}

/**
 * Get performance statistics
 */
export function getPerformanceStats(endpoint?: string): {
    count: number
    min: number
    max: number
    avg: number
    p50: number
    p95: number
    p99: number
} {
    const metrics = getMetrics(endpoint)

    if (metrics.length === 0) {
        return {
            count: 0,
            min: 0,
            max: 0,
            avg: 0,
            p50: 0,
            p95: 0,
            p99: 0,
        }
    }

    const durations = metrics.map(m => m.duration).sort((a, b) => a - b)

    return {
        count: metrics.length,
        min: durations[0],
        max: durations[durations.length - 1],
        avg: getAverageResponseTime(endpoint),
        p50: getPercentileResponseTime(50, endpoint),
        p95: getPercentileResponseTime(95, endpoint),
        p99: getPercentileResponseTime(99, endpoint),
    }
}

/**
 * Check if performance is within acceptable thresholds
 */
export function isPerformanceAcceptable(
    duration: number,
    threshold: number = PERFORMANCE_THRESHOLDS.LOGIN_ENDPOINT
): boolean {
    return duration <= threshold
}

/**
 * Get performance report
 */
export function getPerformanceReport(): {
    endpoints: Record<string, ReturnType<typeof getPerformanceStats>>
    overallStats: ReturnType<typeof getPerformanceStats>
    thresholdsExceeded: Array<{
        endpoint: string
        count: number
        percentage: number
    }>
} {
    const metrics = getMetrics()
    const endpoints = new Set(metrics.map(m => m.endpoint))

    const endpointStats: Record<
        string,
        ReturnType<typeof getPerformanceStats>
    > = {}
    const thresholdsExceeded: Array<{
        endpoint: string
        count: number
        percentage: number
    }> = []

    for (const endpoint of endpoints) {
        endpointStats[endpoint] = getPerformanceStats(endpoint)

        const endpointMetrics = metrics.filter(m => m.endpoint === endpoint)
        const exceededCount = endpointMetrics.filter(
            m => m.duration > PERFORMANCE_THRESHOLDS.LOGIN_ENDPOINT
        ).length

        if (exceededCount > 0) {
            thresholdsExceeded.push({
                endpoint,
                count: exceededCount,
                percentage: (exceededCount / endpointMetrics.length) * 100,
            })
        }
    }

    return {
        endpoints: endpointStats,
        overallStats: getPerformanceStats(),
        thresholdsExceeded,
    }
}

/**
 * Clear performance metrics (for testing)
 */
export function clearMetrics(): void {
    metricsStore.length = 0
}

/**
 * Measure function execution time
 */
export async function measureAsync<T>(
    fn: () => Promise<T>,
    label?: string
): Promise<{ result: T; duration: number }> {
    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start

    if (label) {
        logger.debug(`${label} took ${duration.toFixed(2)}ms`)
    }

    return { result, duration }
}

/**
 * Measure synchronous function execution time
 */
export function measureSync<T>(
    fn: () => T,
    label?: string
): { result: T; duration: number } {
    const start = performance.now()
    const result = fn()
    const duration = performance.now() - start

    if (label) {
        logger.debug(`${label} took ${duration.toFixed(2)}ms`)
    }

    return { result, duration }
}

/**
 * Cache decorator for performance optimization
 */
export function withCache<T>(
    fn: () => Promise<T>,
    ttl: number = 60000 // 1 minute default
): () => Promise<T> {
    let cachedResult: T | null = null
    let cacheExpiry: number = 0

    return async () => {
        const now = Date.now()

        if (cachedResult !== null && now < cacheExpiry) {
            return cachedResult
        }

        cachedResult = await fn()
        cacheExpiry = now + ttl

        return cachedResult
    }
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null

    return (...args: Parameters<T>) => {
        if (timeoutId) {
            clearTimeout(timeoutId)
        }

        timeoutId = setTimeout(() => {
            fn(...args)
            timeoutId = null
        }, delay)
    }
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let lastCall = 0

    return (...args: Parameters<T>) => {
        const now = Date.now()

        if (now - lastCall >= delay) {
            fn(...args)
            lastCall = now
        }
    }
}

/**
 * Batch operations for performance optimization
 */
export class BatchProcessor<T, R> {
    private queue: T[] = []
    private processing = false
    private flushTimer: NodeJS.Timeout | null = null

    constructor(
        private processor: (items: T[]) => Promise<R[]>,
        private batchSize: number = 10,
        private flushInterval: number = 100
    ) {}

    async add(item: T): Promise<void> {
        this.queue.push(item)

        if (this.queue.length >= this.batchSize) {
            await this.flush()
        } else if (!this.flushTimer) {
            this.flushTimer = setTimeout(() => this.flush(), this.flushInterval)
        }
    }

    async flush(): Promise<R[]> {
        if (this.flushTimer) {
            clearTimeout(this.flushTimer)
            this.flushTimer = null
        }

        if (this.queue.length === 0) {
            return []
        }

        if (this.processing) {
            return []
        }

        this.processing = true

        try {
            const items = this.queue.splice(0, this.batchSize)
            return await this.processor(items)
        } finally {
            this.processing = false

            if (this.queue.length > 0) {
                await this.flush()
            }
        }
    }

    getQueueSize(): number {
        return this.queue.length
    }
}

/**
 * Connection pool for database performance optimization
 */
export class ConnectionPool {
    private connections: any[] = []
    private available: any[] = []
    private waiting: Array<(conn: any) => void> = []

    constructor(
        private factory: () => Promise<any>,
        private poolSize: number = 10
    ) {}

    async initialize(): Promise<void> {
        for (let i = 0; i < this.poolSize; i++) {
            const conn = await this.factory()
            this.connections.push(conn)
            this.available.push(conn)
        }
    }

    async acquire(): Promise<any> {
        if (this.available.length > 0) {
            return this.available.pop()
        }

        return new Promise(resolve => {
            this.waiting.push(resolve)
        })
    }

    release(conn: any): void {
        if (this.waiting.length > 0) {
            const resolve = this.waiting.shift()
            if (resolve) {
                resolve(conn)
            }
        } else {
            this.available.push(conn)
        }
    }

    async close(): Promise<void> {
        for (const conn of this.connections) {
            if (conn && typeof conn.close === "function") {
                await conn.close()
            }
        }

        this.connections = []
        this.available = []
        this.waiting = []
    }

    getStats(): {
        total: number
        available: number
        inUse: number
        waiting: number
    } {
        return {
            total: this.connections.length,
            available: this.available.length,
            inUse: this.connections.length - this.available.length,
            waiting: this.waiting.length,
        }
    }
}

/**
 * Query optimizer for database performance
 */
export class QueryOptimizer {
    private queryCache = new Map<string, { result: any; timestamp: number }>()
    private cacheTTL: number = 60000 // 1 minute

    /**
     * Execute query with caching
     */
    async executeWithCache<T>(
        key: string,
        query: () => Promise<T>
    ): Promise<T> {
        const cached = this.queryCache.get(key)

        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            logger.debug("Query cache hit", { key })
            return cached.result
        }

        const result = await query()
        this.queryCache.set(key, { result, timestamp: Date.now() })

        return result
    }

    /**
     * Invalidate cache entry
     */
    invalidateCache(key: string): void {
        this.queryCache.delete(key)
    }

    /**
     * Clear all cache
     */
    clearCache(): void {
        this.queryCache.clear()
    }

    /**
     * Get cache stats
     */
    getCacheStats(): {
        size: number
        entries: Array<{ key: string; age: number }>
    } {
        const entries = Array.from(this.queryCache.entries()).map(
            ([key, value]) => ({
                key,
                age: Date.now() - value.timestamp,
            })
        )

        return {
            size: this.queryCache.size,
            entries,
        }
    }
}

/**
 * Global query optimizer instance
 */
export const queryOptimizer = new QueryOptimizer()

/**
 * Performance monitoring middleware
 */
export function createPerformanceMiddleware() {
    return (req: any, res: any, next: any) => {
        const start = performance.now()

        // Wrap res.end to capture response
        const originalEnd = res.end
        res.end = function (...args: any[]) {
            const duration = performance.now() - start

            recordMetric({
                endpoint: req.path,
                method: req.method,
                duration,
                timestamp: new Date(),
                statusCode: res.statusCode,
                cached: false,
            })

            originalEnd.apply(res, args)
        }

        next()
    }
}
