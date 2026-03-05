// Graceful Shutdown Handler
// Implements Requirements 11.1-11.7 from distributed-infrastructure-logging spec

import { Redis } from "ioredis"
import { Pool } from "pg"
import { DiscordAlerter } from "../discord/alerter"
import { createLogger } from "../logger"

const logger = createLogger("ShutdownHandler")

export interface ShutdownHandler {
    register(): void
    shutdown(signal: string): Promise<void>
}

export class ShutdownHandlerImpl implements ShutdownHandler {
    private isShuttingDown = false
    private pendingOperations = 0

    constructor(
        private dbPool: Pool,
        private redisClient: Redis,
        private discordAlerter: DiscordAlerter
    ) {}

    register(): void {
        // Listen for shutdown signals
        process.on("SIGTERM", () => this.shutdown("SIGTERM"))
        process.on("SIGINT", () => this.shutdown("SIGINT"))

        logger.info("Shutdown handlers registered")
    }

    async shutdown(signal: string): Promise<void> {
        if (this.isShuttingDown) {
            logger.warn("Shutdown already in progress", { signal })
            return
        }

        this.isShuttingDown = true
        logger.info("Shutdown initiated", { signal })

        try {
            // Send shutdown alert to Discord
            await this.discordAlerter.sendAlert({
                level: "shutdown",
                title: "Application Shutdown",
                message: `Application is shutting down (signal: ${signal})`,
                context: { signal, timestamp: new Date().toISOString() },
            })

            // Wait for pending operations to complete (with timeout)
            const maxWaitTime = 30000 // 30 seconds
            const startTime = Date.now()

            while (
                this.pendingOperations > 0 &&
                Date.now() - startTime < maxWaitTime
            ) {
                logger.info("Waiting for pending operations", {
                    pending: this.pendingOperations,
                    elapsed: Date.now() - startTime,
                })
                await new Promise(resolve => setTimeout(resolve, 100))
            }

            if (this.pendingOperations > 0) {
                logger.warn(
                    "Shutdown timeout reached with pending operations",
                    {
                        pending: this.pendingOperations,
                    }
                )
            }

            // Close database pool gracefully
            logger.info("Closing database pool")
            await this.dbPool.end()
            logger.info("Database pool closed")

            // Close Redis connection gracefully
            logger.info("Closing Redis connection")
            await this.redisClient.quit()
            logger.info("Redis connection closed")

            // Flush pending logs
            logger.info("Flushing pending logs")
            // Pino automatically flushes on process exit, but we can force it
            await new Promise(resolve => setTimeout(resolve, 100))

            logger.info("Shutdown complete")

            // Exit with success code
            process.exit(0)
        } catch (error) {
            logger.error("Error during shutdown", error as Error)
            process.exit(1)
        }
    }

    // Methods to track pending operations
    incrementPending(): void {
        this.pendingOperations++
    }

    decrementPending(): void {
        this.pendingOperations = Math.max(0, this.pendingOperations - 1)
    }

    getPendingCount(): number {
        return this.pendingOperations
    }
}

// Factory function
export const createShutdownHandler = (
    dbPool: Pool,
    redisClient: Redis,
    discordAlerter: DiscordAlerter
): ShutdownHandler => {
    return new ShutdownHandlerImpl(dbPool, redisClient, discordAlerter)
}
