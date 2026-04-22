/**
 * Account Completion Monitoring and Observability Module
 *
 * Provides metrics collection, structured logging, and alerting
 * for the account completion flow.
 *
 * Validates: Phase 10 - Monitoring and Observability
 */

import { logger } from "@/lib/logger"

/**
 * Metrics for account completion flow
 */
export interface AccountCompletionMetrics {
    totalAttempts: number
    successfulCompletions: number
    failedAttempts: number
    averageCompletionTime: number // milliseconds
    errorsByType: Record<string, number>
    apiResponseTimes: number[] // milliseconds
    databaseQueryTimes: number[] // milliseconds
    cacheHitRate: number // percentage
}

/**
 * Global metrics storage
 */
const metrics: AccountCompletionMetrics = {
    totalAttempts: 0,
    successfulCompletions: 0,
    failedAttempts: 0,
    averageCompletionTime: 0,
    errorsByType: {},
    apiResponseTimes: [],
    databaseQueryTimes: [],
    cacheHitRate: 0,
}

/**
 * Record a completion attempt
 */
export function recordCompletionAttempt(): void {
    metrics.totalAttempts++
    logger.info("Account completion attempt recorded", {
        context: "AccountCompletionMonitoring",
        totalAttempts: metrics.totalAttempts,
    })
}

/**
 * Record a successful completion
 */
export function recordSuccessfulCompletion(completionTimeMs: number): void {
    metrics.successfulCompletions++

    // Update average completion time
    const totalTime =
        metrics.averageCompletionTime * (metrics.successfulCompletions - 1) +
        completionTimeMs
    metrics.averageCompletionTime = totalTime / metrics.successfulCompletions

    // Record API response time
    metrics.apiResponseTimes.push(completionTimeMs)
    if (metrics.apiResponseTimes.length > 1000) {
        metrics.apiResponseTimes.shift() // Keep last 1000 measurements
    }

    logger.info("Account completion successful", {
        context: "AccountCompletionMonitoring",
        completionTimeMs,
        averageCompletionTime: metrics.averageCompletionTime,
        successfulCompletions: metrics.successfulCompletions,
    })
}

/**
 * Record a failed attempt
 */
export function recordFailedAttempt(errorType: string): void {
    metrics.failedAttempts++
    metrics.errorsByType[errorType] = (metrics.errorsByType[errorType] || 0) + 1

    const completionRate =
        (metrics.successfulCompletions / metrics.totalAttempts) * 100

    logger.warn("Account completion failed", {
        context: "AccountCompletionMonitoring",
        errorType,
        failedAttempts: metrics.failedAttempts,
        completionRate: completionRate.toFixed(2),
    })

    // Alert if error rate is too high
    if (completionRate < 50) {
        alertHighErrorRate(completionRate)
    }
}

/**
 * Record database query time
 */
export function recordDatabaseQueryTime(queryTimeMs: number): void {
    metrics.databaseQueryTimes.push(queryTimeMs)
    if (metrics.databaseQueryTimes.length > 1000) {
        metrics.databaseQueryTimes.shift() // Keep last 1000 measurements
    }

    // Alert if query is slow (> 500ms)
    if (queryTimeMs > 500) {
        alertSlowDatabaseQuery(queryTimeMs)
    }
}

/**
 * Record API response time
 */
export function recordAPIResponseTime(responseTimeMs: number): void {
    metrics.apiResponseTimes.push(responseTimeMs)
    if (metrics.apiResponseTimes.length > 1000) {
        metrics.apiResponseTimes.shift() // Keep last 1000 measurements
    }

    // Alert if response is slow (> 1000ms)
    if (responseTimeMs > 1000) {
        alertSlowAPIResponse(responseTimeMs)
    }
}

/**
 * Update cache hit rate
 */
export function updateCacheHitRate(hitRate: number): void {
    metrics.cacheHitRate = hitRate

    logger.debug("Cache hit rate updated", {
        context: "AccountCompletionMonitoring",
        cacheHitRate: hitRate.toFixed(2),
    })
}

/**
 * Get current metrics
 */
export function getMetrics(): AccountCompletionMetrics {
    return {
        ...metrics,
        averageCompletionTime: Math.round(metrics.averageCompletionTime),
    }
}

/**
 * Get completion rate
 */
export function getCompletionRate(): number {
    if (metrics.totalAttempts === 0) return 0
    return (metrics.successfulCompletions / metrics.totalAttempts) * 100
}

/**
 * Get average API response time
 */
export function getAverageAPIResponseTime(): number {
    if (metrics.apiResponseTimes.length === 0) return 0
    const sum = metrics.apiResponseTimes.reduce((a, b) => a + b, 0)
    return Math.round(sum / metrics.apiResponseTimes.length)
}

/**
 * Get average database query time
 */
export function getAverageDatabaseQueryTime(): number {
    if (metrics.databaseQueryTimes.length === 0) return 0
    const sum = metrics.databaseQueryTimes.reduce((a, b) => a + b, 0)
    return Math.round(sum / metrics.databaseQueryTimes.length)
}

/**
 * Get percentile for API response times
 */
export function getAPIResponseTimePercentile(percentile: number): number {
    if (metrics.apiResponseTimes.length === 0) return 0
    const sorted = [...metrics.apiResponseTimes].sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]
}

/**
 * Get percentile for database query times
 */
export function getDatabaseQueryTimePercentile(percentile: number): number {
    if (metrics.databaseQueryTimes.length === 0) return 0
    const sorted = [...metrics.databaseQueryTimes].sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]
}

/**
 * Alert: High error rate
 */
function alertHighErrorRate(completionRate: number): void {
    logger.error("ALERT: High error rate detected", {
        context: "AccountCompletionMonitoring",
        completionRate: completionRate.toFixed(2),
        threshold: "50%",
        action: "Review error logs and investigate root cause",
    })
}

/**
 * Alert: Slow API response
 */
function alertSlowAPIResponse(responseTimeMs: number): void {
    logger.warn("ALERT: Slow API response detected", {
        context: "AccountCompletionMonitoring",
        responseTimeMs,
        threshold: "1000ms",
        action: "Check API performance and database queries",
    })
}

/**
 * Alert: Slow database query
 */
function alertSlowDatabaseQuery(queryTimeMs: number): void {
    logger.warn("ALERT: Slow database query detected", {
        context: "AccountCompletionMonitoring",
        queryTimeMs,
        threshold: "500ms",
        action: "Review query performance and add indexes if needed",
    })
}

/**
 * Alert: Database connection failure
 */
export function alertDatabaseConnectionFailure(error: Error): void {
    logger.error("ALERT: Database connection failure", {
        context: "AccountCompletionMonitoring",
        error: error.message,
        action: "Check database connectivity and credentials",
    })
}

/**
 * Alert: Security issue detected
 */
export function alertSecurityIssue(
    issueType: string,
    details: Record<string, unknown>
): void {
    logger.error("ALERT: Security issue detected", {
        context: "AccountCompletionMonitoring",
        issueType,
        details,
        action: "Investigate and take appropriate security measures",
    })
}

/**
 * Structured logging for account completion events
 */
export interface AccountCompletionLog {
    timestamp: Date
    eventType: string
    userId?: string
    email?: string
    ipAddress?: string
    status: "success" | "failure"
    errorType?: string
    duration?: number
    metadata?: Record<string, unknown>
}

/**
 * Log account completion event
 */
export function logAccountCompletionEvent(log: AccountCompletionLog): void {
    logger.info("Account completion event", {
        context: "AccountCompletionMonitoring",
        timestamp: log.timestamp.toISOString(),
        eventType: log.eventType,
        userId: log.userId,
        email: log.email,
        ipAddress: log.ipAddress,
        status: log.status,
        errorType: log.errorType,
        duration: log.duration,
        metadata: log.metadata,
    })
}

/**
 * Reset metrics (for testing)
 */
export function resetMetrics(): void {
    metrics.totalAttempts = 0
    metrics.successfulCompletions = 0
    metrics.failedAttempts = 0
    metrics.averageCompletionTime = 0
    metrics.errorsByType = {}
    metrics.apiResponseTimes = []
    metrics.databaseQueryTimes = []
    metrics.cacheHitRate = 0

    logger.info("Metrics reset", {
        context: "AccountCompletionMonitoring",
    })
}

/**
 * Generate metrics report
 */
export function generateMetricsReport(): string {
    const completionRate = getCompletionRate()
    const avgAPIResponseTime = getAverageAPIResponseTime()
    const avgDatabaseQueryTime = getAverageDatabaseQueryTime()
    const p95APIResponseTime = getAPIResponseTimePercentile(95)
    const p95DatabaseQueryTime = getDatabaseQueryTimePercentile(95)

    return `
Account Completion Flow - Metrics Report
==========================================

Completion Metrics:
  - Total Attempts: ${metrics.totalAttempts}
  - Successful Completions: ${metrics.successfulCompletions}
  - Failed Attempts: ${metrics.failedAttempts}
  - Completion Rate: ${completionRate.toFixed(2)}%
  - Average Completion Time: ${metrics.averageCompletionTime}ms

Error Breakdown:
${Object.entries(metrics.errorsByType)
    .map(([type, count]) => `  - ${type}: ${count}`)
    .join("\n")}

Performance Metrics:
  - Average API Response Time: ${avgAPIResponseTime}ms
  - P95 API Response Time: ${p95APIResponseTime}ms
  - Average Database Query Time: ${avgDatabaseQueryTime}ms
  - P95 Database Query Time: ${p95DatabaseQueryTime}ms
  - Cache Hit Rate: ${metrics.cacheHitRate.toFixed(2)}%

Measurements:
  - API Response Time Samples: ${metrics.apiResponseTimes.length}
  - Database Query Time Samples: ${metrics.databaseQueryTimes.length}
    `
}
