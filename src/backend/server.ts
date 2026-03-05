/**
 * Backend API Server
 *
 * Separate backend service that handles:
 * - Database operations
 * - Redis caching
 * - Business logic
 *
 * Health check endpoint: GET /health
 * Requirements: 1.4, 6.6, 6.7, 6.8
 */

import express, { Request, Response } from "express"
import Redis from "ioredis"
import { Pool } from "pg"
import { validateEnv } from "../lib/config/env"
import { createLogger } from "../lib/logger"

const logger = createLogger("BackendServer")

// Track application start time for uptime calculation
const startTime = Date.now()

// Initialize Express app
const app = express()
app.use(express.json())

// Validate environment configuration
let config: ReturnType<typeof validateEnv>
try {
    config = validateEnv()
    logger.info("Environment configuration validated", {
        environment: config.NODE_ENV,
    })
} catch (error) {
    logger.fatal("Environment validation failed", error as Error)
    process.exit(1)
}

// Initialize database pool
const dbPool = new Pool({
    connectionString: config.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
})

// Initialize Redis client
const redis = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000)
        return delay
    },
})

// Handle Redis connection events (with cleanup)
const redisConnectHandler = () => {
    logger.info("Redis connected")
}

const redisErrorHandler = (error: Error) => {
    logger.error("Redis connection error", error)
}

redis.on("connect", redisConnectHandler)
redis.on("error", redisErrorHandler)

// Store handlers for cleanup
const eventHandlers = {
    redis: { connect: redisConnectHandler, error: redisErrorHandler },
}

/**
 * Health Check Response Interface
 */
interface HealthCheckResponse {
    status: "healthy" | "unhealthy"
    timestamp: string
    uptime: number
    checks: {
        database: CheckResult
        redis: CheckResult
        memory: CheckResult
    }
}

interface CheckResult {
    status: "pass" | "fail"
    message?: string
    responseTime?: number
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<CheckResult> {
    const startTime = Date.now()
    try {
        await dbPool.query("SELECT 1")
        const responseTime = Date.now() - startTime
        return {
            status: "pass",
            message: "Database connection successful",
            responseTime,
        }
    } catch (error) {
        const responseTime = Date.now() - startTime
        logger.error("Database health check failed", error as Error)
        return {
            status: "fail",
            message: (error as Error).message,
            responseTime,
        }
    }
}

/**
 * Check Redis connectivity
 */
async function checkRedis(): Promise<CheckResult> {
    const startTime = Date.now()
    try {
        await redis.ping()
        const responseTime = Date.now() - startTime
        return {
            status: "pass",
            message: "Redis connection successful",
            responseTime,
        }
    } catch (error) {
        const responseTime = Date.now() - startTime
        logger.error("Redis health check failed", error as Error)
        return {
            status: "fail",
            message: (error as Error).message,
            responseTime,
        }
    }
}

/**
 * Check memory usage
 */
function checkMemory(): CheckResult {
    const memUsage = process.memoryUsage()
    const heapStats = v8.getHeapStatistics()

    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024)
    const heapLimitMB = Math.round(heapStats.heap_size_limit / 1024 / 1024)
    const usagePercent = Math.round(
        (memUsage.heapUsed / heapStats.heap_size_limit) * 100
    )

    // Consider unhealthy if using more than 90% of heap
    const isHealthy = usagePercent < 90

    return {
        status: isHealthy ? "pass" : "fail",
        message: `Heap usage: ${heapUsedMB}MB / ${heapLimitMB}MB (${usagePercent}%)`,
    }
}

/**
 * Health Check Endpoint
 *
 * GET /health
 *
 * Returns:
 * - 200 if all checks pass
 * - 503 if any check fails
 *
 * Checks:
 * - Database connectivity (pg_isready equivalent)
 * - Redis connectivity (ping)
 * - Memory usage
 */
app.get("/health", async (req: Request, res: Response) => {
    const uptime = Math.floor((Date.now() - startTime) / 1000) // uptime in seconds

    // Run all health checks in parallel
    const [databaseCheck, redisCheck, memoryCheck] = await Promise.all([
        checkDatabase(),
        checkRedis(),
        Promise.resolve(checkMemory()),
    ])

    // Determine overall status
    const allHealthy =
        databaseCheck.status === "pass" &&
        redisCheck.status === "pass" &&
        memoryCheck.status === "pass"

    const status = allHealthy ? "healthy" : "unhealthy"
    const httpStatus = allHealthy ? 200 : 503

    const response: HealthCheckResponse = {
        status,
        timestamp: new Date().toISOString(),
        uptime,
        checks: {
            database: databaseCheck,
            redis: redisCheck,
            memory: memoryCheck,
        },
    }

    // Log unhealthy status
    if (!allHealthy) {
        logger.warn("Health check failed", { response })
    }

    res.status(httpStatus).json(response)
})

/**
 * Root endpoint
 */
app.get("/", (req: Request, res: Response) => {
    res.json({
        service: "Backend API",
        version: "1.0.0",
        status: "running",
    })
})

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal: string) {
    logger.info("Shutdown signal received", { signal })

    // Remove event listeners to prevent memory leaks
    redis.removeListener("connect", eventHandlers.redis.connect)
    redis.removeListener("error", eventHandlers.redis.error)

    // Close server
    server.close(() => {
        logger.info("HTTP server closed")
    })

    // Close database connections
    try {
        await dbPool.end()
        logger.info("Database pool closed")
    } catch (error) {
        logger.error("Error closing database pool", error as Error)
    }

    // Close Redis connection
    try {
        await redis.quit()
        logger.info("Redis connection closed")
    } catch (error) {
        logger.error("Error closing Redis connection", error as Error)
    }

    process.exit(0)
}

// Register shutdown handlers (idempotent)
let shutdownRegistered = false
function registerShutdownHandlers() {
    if (shutdownRegistered) return
    shutdownRegistered = true

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
    process.on("SIGINT", () => gracefulShutdown("SIGINT"))
}

registerShutdownHandlers()

// Start server
const PORT = config.PORT || 4000
const server = app.listen(PORT, () => {
    logger.info("Backend server started", {
        port: PORT,
        environment: config.NODE_ENV,
        nodeVersion: process.version,
    })
})

// Handle unhandled rejections
process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
    logger.error("Unhandled rejection", new Error(reason), { promise })
})

// Handle uncaught exceptions
process.on("uncaughtException", (error: Error) => {
    logger.fatal("Uncaught exception", error)
    process.exit(1)
})

export { app, dbPool, redis }
