// Main Application - Wiring All Components Together
// Implements all requirements from distributed-infrastructure-logging spec

import express, { Express } from "express"
import { Redis } from "ioredis"
import { Pool } from "pg"
import { validateEnv } from "../lib/config/env"
import { CreditSystemImpl } from "../lib/credits/credit-system"
import { createCronScheduler } from "../lib/cron"
import { createDiscordAlerter } from "../lib/discord/alerter"
import { createLogger } from "../lib/logger"
import { MeteringSystemImpl } from "../lib/metering"
import { contextMiddleware } from "../lib/middleware/context"
import { metricsHandler, metricsMiddleware } from "../lib/observability/metrics"
import { performanceTimingMiddleware } from "../lib/observability/performance-timing"
import {
    connectDatabaseWithRetry,
    connectRedisWithRetry,
} from "../lib/retry/wrappers"
import { createShutdownHandler } from "../lib/shutdown"
import { createStartupHandler } from "../lib/startup"

const logger = createLogger("Application")

export interface AppComponents {
    app: Express
    dbPool: Pool
    redisClient: Redis
    creditSystem: CreditSystemImpl
    meteringSystem: MeteringSystemImpl
}

/**
 * Initialize and wire all application components
 */
export async function initializeApp(): Promise<AppComponents> {
    try {
        // Validate environment configuration
        logger.info("Validating environment configuration")
        const config = validateEnv()

        // Initialize Express app
        const app = express()
        app.use(express.json())

        // Initialize database with retry
        logger.info("Connecting to database")
        const dbPool = await connectDatabaseWithRetry(config.DATABASE_URL)

        // Initialize Redis with retry
        logger.info("Connecting to Redis")
        const redisClient = await connectRedisWithRetry(config.REDIS_URL)

        // Initialize Discord alerter
        const discordAlerter = createDiscordAlerter(config.DISCORD_WEBHOOK_URL)

        // Initialize credit system
        const creditSystem = new CreditSystemImpl(dbPool)

        // Initialize metering system
        const meteringSystem = new MeteringSystemImpl(dbPool, creditSystem)

        // Initialize shutdown handler
        const shutdownHandler = createShutdownHandler(
            dbPool,
            redisClient,
            discordAlerter
        )
        shutdownHandler.register()

        // Initialize startup handler and log startup
        const startupHandler = createStartupHandler(discordAlerter)
        await startupHandler.logStartup()

        // Initialize cron scheduler
        const cronScheduler = createCronScheduler(
            meteringSystem,
            discordAlerter
        )
        cronScheduler.start()

        // Setup middleware
        app.use(contextMiddleware)
        app.use(performanceTimingMiddleware)
        app.use(metricsMiddleware)

        // Health check endpoint
        app.get("/health", (req, res) => {
            res.json({
                status: "healthy",
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
            })
        })

        // Metrics endpoint
        app.get("/metrics", metricsHandler)

        // API routes
        const { createRoutes } = await import("./routes")
        const apiRoutes = createRoutes(creditSystem, meteringSystem)
        app.use(apiRoutes)

        logger.info("Application initialized successfully")

        return {
            app,
            dbPool,
            redisClient,
            creditSystem,
            meteringSystem,
        }
    } catch (error) {
        logger.error("Failed to initialize application", error as Error)
        throw error
    }
}

/**
 * Start the HTTP server
 */
export async function startServer(port: number = 4000): Promise<void> {
    const components = await initializeApp()

    components.app.listen(port, () => {
        logger.info(`Server listening on port ${port}`)
    })
}

// Start server if this file is run directly
if (require.main === module) {
    const port = parseInt(process.env.PORT || "4000", 10)
    startServer(port).catch(error => {
        logger.error("Failed to start server", error)
        process.exit(1)
    })
}
