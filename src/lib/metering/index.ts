// Metering System - Resource Usage Tracking and Billing
// Implements Requirements 5.1-5.10 from distributed-infrastructure-logging spec

import { Pool } from "pg"
import { CreditSystem } from "../credits"
import { createLogger } from "../logger"

const logger = createLogger("MeteringSystem")

export interface MeteringSystem {
    recordBandwidth(userId: string, bytes: number): Promise<void>
    recordStorage(userId: string, bytes: number): Promise<void>
    recordCacheOp(
        userId: string,
        operation: "hit" | "miss" | "set"
    ): Promise<void>
    recordApiCall(userId: string, endpoint: string): Promise<void>
    aggregateDaily(): Promise<AggregationResult>
}

export interface UsageMetric {
    userId: string
    metricType: "bandwidth" | "storage" | "cache_ops" | "api_calls"
    value: number
    unit: string
    timestamp: Date
}

export interface AggregationResult {
    usersProcessed: number
    totalCost: number
    errors: string[]
}

export class MeteringSystemImpl implements MeteringSystem {
    constructor(
        private pool: Pool,
        private creditSystem: CreditSystem
    ) {}

    async recordBandwidth(userId: string, bytes: number): Promise<void> {
        logger.debug("Recording bandwidth", { userId, bytes })

        await this.pool.query(
            `INSERT INTO usage_metrics (user_id, metric_type, value, unit)
       VALUES ($1, 'bandwidth', $2, 'bytes')`,
            [userId, bytes]
        )
    }

    async recordStorage(userId: string, bytes: number): Promise<void> {
        logger.debug("Recording storage", { userId, bytes })

        await this.pool.query(
            `INSERT INTO usage_metrics (user_id, metric_type, value, unit)
       VALUES ($1, 'storage', $2, 'bytes')`,
            [userId, bytes]
        )
    }

    async recordCacheOp(
        userId: string,
        operation: "hit" | "miss" | "set"
    ): Promise<void> {
        logger.debug("Recording cache operation", { userId, operation })

        await this.pool.query(
            `INSERT INTO usage_metrics (user_id, metric_type, value, unit)
       VALUES ($1, 'cache_ops', 1, 'operation')`,
            [userId]
        )
    }

    async recordApiCall(userId: string, endpoint: string): Promise<void> {
        logger.debug("Recording API call", { userId, endpoint })

        await this.pool.query(
            `INSERT INTO usage_metrics (user_id, metric_type, value, unit)
       VALUES ($1, 'api_calls', 1, 'call')`,
            [userId]
        )
    }

    async aggregateDaily(): Promise<AggregationResult> {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const dateStr = yesterday.toISOString().split("T")[0]

        logger.info("Starting daily aggregation", { date: dateStr })

        const client = await this.pool.connect()
        const errors: string[] = []
        let usersProcessed = 0
        let totalCost = 0

        try {
            await client.query("BEGIN")

            // Get pricing config
            const pricingResult = await client.query(
                "SELECT * FROM pricing_config"
            )
            const pricing = new Map(
                pricingResult.rows.map(row => [
                    row.metric_type,
                    {
                        costPerUnit: parseFloat(row.cost_per_unit),
                        unit: row.unit,
                    },
                ])
            )

            // Aggregate metrics by user for yesterday
            const metricsResult = await client.query(
                `SELECT 
          user_id,
          metric_type,
          SUM(value) as total_value
         FROM usage_metrics
         WHERE created_at >= $1::date AND created_at < ($1::date + interval '1 day')
         GROUP BY user_id, metric_type`,
                [dateStr]
            )

            // Group by user
            const userMetrics = new Map<string, Map<string, number>>()
            for (const row of metricsResult.rows) {
                if (!userMetrics.has(row.user_id)) {
                    userMetrics.set(row.user_id, new Map())
                }
                userMetrics
                    .get(row.user_id)!
                    .set(row.metric_type, parseFloat(row.total_value))
            }

            // Process each user
            for (const [userId, metrics] of userMetrics) {
                try {
                    const bandwidthBytes = metrics.get("bandwidth") ?? 0
                    const storageBytes = metrics.get("storage") ?? 0
                    const cacheOps = metrics.get("cache_ops") ?? 0
                    const apiCalls = metrics.get("api_calls") ?? 0

                    // Convert to billable units
                    const bandwidthGb = bandwidthBytes / 1024 ** 3
                    const storageGb = storageBytes / 1024 ** 3

                    // Calculate costs
                    const bandwidthCost =
                        bandwidthGb * pricing.get("bandwidth")!.costPerUnit
                    const storageCost =
                        storageGb * pricing.get("storage")!.costPerUnit
                    const cacheOpsCost =
                        cacheOps * pricing.get("cache_ops")!.costPerUnit
                    const apiCallsCost =
                        apiCalls * pricing.get("api_calls")!.costPerUnit

                    const userTotalCost =
                        bandwidthCost +
                        storageCost +
                        cacheOpsCost +
                        apiCallsCost

                    // Insert summary
                    await client.query(
                        `INSERT INTO daily_usage_summary 
             (user_id, date, bandwidth_gb, storage_gb, cache_ops, api_calls, total_cost)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (user_id, date) DO UPDATE SET
               bandwidth_gb = EXCLUDED.bandwidth_gb,
               storage_gb = EXCLUDED.storage_gb,
               cache_ops = EXCLUDED.cache_ops,
               api_calls = EXCLUDED.api_calls,
               total_cost = EXCLUDED.total_cost`,
                        [
                            userId,
                            dateStr,
                            bandwidthGb,
                            storageGb,
                            cacheOps,
                            apiCalls,
                            userTotalCost,
                        ]
                    )

                    // Debit from user account
                    if (userTotalCost > 0) {
                        const result = await this.creditSystem.debit(
                            userId,
                            userTotalCost,
                            `Daily usage for ${dateStr}`
                        )

                        if (!result.success) {
                            errors.push(
                                `Failed to debit user ${userId}: ${result.error}`
                            )
                            logger.warn(
                                "Failed to debit user for daily usage",
                                {
                                    userId,
                                    cost: userTotalCost,
                                    error: result.error,
                                }
                            )
                        }
                    }

                    usersProcessed++
                    totalCost += userTotalCost
                } catch (error) {
                    const errorMsg = `Error processing user ${userId}: ${(error as Error).message}`
                    errors.push(errorMsg)
                    logger.error(
                        "Error processing user metrics",
                        error as Error,
                        { userId }
                    )
                }
            }

            await client.query("COMMIT")

            logger.info("Daily aggregation complete", {
                date: dateStr,
                usersProcessed,
                totalCost,
                errorCount: errors.length,
            })

            return { usersProcessed, totalCost, errors }
        } catch (error) {
            await client.query("ROLLBACK")
            logger.error("Daily aggregation failed", error as Error)
            throw error
        } finally {
            client.release()
        }
    }
}

// Convenience exports for backward compatibility
export const createMeteringSystem = (
    pool: Pool,
    creditSystem: CreditSystem
): MeteringSystem => {
    return new MeteringSystemImpl(pool, creditSystem)
}
