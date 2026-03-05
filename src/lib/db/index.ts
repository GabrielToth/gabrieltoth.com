// Database Layer - Enhanced with Logging and Helpers
// Focus: Debugability, Performance, Reliability

import { logger } from "@/lib/logger"
import { Pool, PoolClient, QueryResult } from "pg"

// Singleton pool
let pool: Pool | null = null

const SLOW_QUERY_THRESHOLD_MS = 100
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

/**
 * Get or create the database pool
 */
function getPool(): Pool {
    if (!pool) {
        const connectionString = process.env.DATABASE_URL
        if (!connectionString) {
            throw new Error("DATABASE_URL is not defined")
        }

        pool = new Pool({
            connectionString,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
        })

        pool.on("connect", () => {
            logger.debug("New DB connection established", { context: "DB" })
        })

        pool.on("error", err => {
            logger.error("Unexpected DB pool error", {
                context: "DB",
                error: err,
            })
        })

        logger.startup("PostgreSQL Pool")
    }

    return pool
}

/**
 * Execute a query with timing and logging
 */
export async function query<T = unknown>(
    text: string,
    params?: unknown[]
): Promise<QueryResult<T>> {
    const start = Date.now()

    try {
        const result = await getPool().query<T>(text, params)
        const duration = Date.now() - start

        // Log slow queries
        if (duration > SLOW_QUERY_THRESHOLD_MS) {
            logger.warn(`Slow query: ${duration}ms`, {
                context: "DB",
                data: { query: text.slice(0, 100), duration },
            })
        } else {
            logger.debug(`Query: ${duration}ms`, { context: "DB" })
        }

        return result
    } catch (err) {
        logger.error("Query failed", {
            context: "DB",
            error: err as Error,
            data: { query: text.slice(0, 100) },
        })
        throw err
    }
}

/**
 * Get a single row or null
 */
export async function queryOne<T = unknown>(
    text: string,
    params?: unknown[]
): Promise<T | null> {
    const result = await query<T>(text, params)
    return result.rows[0] || null
}

/**
 * Get multiple rows
 */
export async function queryMany<T = unknown>(
    text: string,
    params?: unknown[]
): Promise<T[]> {
    const result = await query<T>(text, params)
    return result.rows
}

/**
 * Execute within a transaction
 */
export async function transaction<T>(
    fn: (client: PoolClient) => Promise<T>
): Promise<T> {
    const client = await getPool().connect()

    try {
        await client.query("BEGIN")
        const result = await fn(client)
        await client.query("COMMIT")
        return result
    } catch (err) {
        await client.query("ROLLBACK")
        logger.error("Transaction rolled back", {
            context: "DB",
            error: err as Error,
        })
        throw err
    } finally {
        client.release()
    }
}

/**
 * Health check with retry logic
 */
export async function healthCheck(): Promise<boolean> {
    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            await query("SELECT 1")
            return true
        } catch (err) {
            logger.warn(
                `DB health check failed, attempt ${i + 1}/${MAX_RETRIES}`,
                { context: "DB" }
            )
            if (i < MAX_RETRIES - 1) {
                await new Promise(r => setTimeout(r, RETRY_DELAY_MS))
            }
        }
    }

    logger.fatal("DB health check failed after retries", { context: "DB" })
    return false
}

/**
 * Graceful shutdown
 */
export async function shutdown(): Promise<void> {
    if (pool) {
        logger.shutdown("PostgreSQL Pool")
        await pool.end()
        pool = null
    }
}

export default {
    query,
    queryOne,
    queryMany,
    transaction,
    healthCheck,
    shutdown,
}
