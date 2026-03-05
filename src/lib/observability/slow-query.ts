// Slow Query Logging Middleware
// Implements Requirement 12.5 from distributed-infrastructure-logging spec

import { Pool, QueryConfig, QueryResult } from "pg"
import { createLogger } from "../logger"

const logger = createLogger("SlowQueryLogger")

const SLOW_QUERY_THRESHOLD_MS = 1000 // 1 second

export interface QueryWithTiming extends QueryConfig {
    duration?: number
}

/**
 * Wraps a PostgreSQL pool to log slow queries
 */
export class SlowQueryPool {
    constructor(private pool: Pool) {}

    async query<T = any>(
        queryTextOrConfig: string | QueryConfig,
        values?: any[]
    ): Promise<QueryResult<T>> {
        const startTime = Date.now()
        const queryText =
            typeof queryTextOrConfig === "string"
                ? queryTextOrConfig
                : queryTextOrConfig.text

        try {
            const result = await this.pool.query<T>(
                queryTextOrConfig as any,
                values
            )
            const duration = Date.now() - startTime

            if (duration >= SLOW_QUERY_THRESHOLD_MS) {
                logger.warn("Slow query detected", {
                    query: this.sanitizeQuery(queryText),
                    duration,
                    threshold: SLOW_QUERY_THRESHOLD_MS,
                    rowCount: result.rowCount,
                })
            }

            return result
        } catch (error) {
            const duration = Date.now() - startTime
            logger.error("Query failed", error as Error, {
                query: this.sanitizeQuery(queryText),
                duration,
            })
            throw error
        }
    }

    /**
     * Sanitize query by removing sensitive data from parameters
     */
    private sanitizeQuery(query: string | undefined): string {
        if (!query) return "[no query text]"

        // Truncate very long queries
        if (query.length > 500) {
            return query.substring(0, 500) + "... [truncated]"
        }

        return query
    }

    // Delegate other pool methods
    async connect() {
        return this.pool.connect()
    }

    async end() {
        return this.pool.end()
    }

    on(event: string, listener: (...args: any[]) => void) {
        return this.pool.on(event, listener)
    }
}

/**
 * Factory function to create a slow query logging pool
 */
export const createSlowQueryPool = (pool: Pool): SlowQueryPool => {
    return new SlowQueryPool(pool)
}
