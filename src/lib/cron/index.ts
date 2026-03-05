// Cron Scheduler for Daily Aggregation
// Implements Requirement 5.7 from distributed-infrastructure-logging spec

import cron from "node-cron"
import { DiscordAlerter } from "../discord/alerter"
import { createLogger } from "../logger"
import { MeteringSystem } from "../metering"

const logger = createLogger("CronScheduler")

export interface CronScheduler {
    start(): void
    stop(): void
}

export class CronSchedulerImpl implements CronScheduler {
    private task: cron.ScheduledTask | null = null

    constructor(
        private meteringSystem: MeteringSystem,
        private discordAlerter: DiscordAlerter
    ) {}

    start(): void {
        // Schedule daily aggregation at 00:00 UTC
        this.task = cron.schedule(
            "0 0 * * *",
            async () => {
                logger.info("Starting scheduled daily aggregation")

                try {
                    const result = await this.meteringSystem.aggregateDaily()

                    logger.info("Daily aggregation completed", {
                        usersProcessed: result.usersProcessed,
                        totalCost: result.totalCost,
                        errorCount: result.errors.length,
                    })

                    // Send alert if there were errors
                    if (result.errors.length > 0) {
                        await this.discordAlerter.sendAlert({
                            level: "error",
                            title: "Daily Aggregation Errors",
                            message: `Daily aggregation completed with ${result.errors.length} errors`,
                            context: {
                                usersProcessed: result.usersProcessed,
                                totalCost: result.totalCost,
                                errors: result.errors.slice(0, 5), // First 5 errors
                            },
                        })
                    }
                } catch (error) {
                    logger.error("Daily aggregation failed", error as Error)

                    // Send critical alert
                    await this.discordAlerter.sendAlert({
                        level: "fatal",
                        title: "Daily Aggregation Failed",
                        message: "Daily aggregation job failed completely",
                        context: {
                            error: (error as Error).message,
                        },
                        stack: (error as Error).stack,
                    })
                }
            },
            {
                timezone: "UTC",
            }
        )

        logger.info("Cron scheduler started (daily at 00:00 UTC)")
    }

    stop(): void {
        if (this.task) {
            this.task.stop()
            this.task = null
            logger.info("Cron scheduler stopped")
        }
    }
}

// Factory function
export const createCronScheduler = (
    meteringSystem: MeteringSystem,
    discordAlerter: DiscordAlerter
): CronScheduler => {
    return new CronSchedulerImpl(meteringSystem, discordAlerter)
}
