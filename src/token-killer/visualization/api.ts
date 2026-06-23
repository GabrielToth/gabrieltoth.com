/**
 * Token Killer Web Dashboard API
 * Provides Express.js endpoints for token data aggregation, analytics, and visualization
 * Implements Requirements 6.1-6.5: Token usage visualization with multiple time windows
 */

import { Router, Request, Response } from "express"
import { DatabasePool } from "../storage/database"
import { createLogger } from "../../lib/logger"

const logger = createLogger("TokenKillerAPI")

/**
 * Time window type for data aggregation
 */
type TimeWindow = "24h" | "7d" | "30d" | "90d" | "all-time"

/**
 * Aggregated token data for a time window
 */
interface AggregatedTokenData {
    timeWindow: TimeWindow
    startDate: Date
    endDate: Date
    totalTokens: number
    inputTokens: number
    outputTokens: number
    totalCost: number
    costUSD: number
    costBRL: number
    requestCount: number
    taskCount: number
    byAgentType: Record<string, { tokens: number; cost: number; count: number }>
    byRequestType: Record<
        string,
        { tokens: number; cost: number; count: number }
    >
    byModel: Record<string, { tokens: number; cost: number; count: number }>
    byOptimizationStrategy: Record<
        string,
        { tokensSaved: number; count: number }
    >
}

/**
 * Anomaly detection result
 */
interface AnomalyDetectionResult {
    anomalies: Array<{
        timestamp: Date
        totalTokens: number
        zScore: number
        deviation: string
        context: string
    }>
    mean: number
    stdDev: number
    threshold: number
}

/**
 * API error response
 */
interface ApiErrorResponse {
    error: string
    code: string
    message: string
    timestamp: Date
}

/**
 * Calculate date range for time window
 */
function getDateRange(timeWindow: TimeWindow): { start: Date; end: Date } {
    const end = new Date()
    const start = new Date()

    switch (timeWindow) {
        case "24h":
            start.setHours(start.getHours() - 24)
            break
        case "7d":
            start.setDate(start.getDate() - 7)
            break
        case "30d":
            start.setDate(start.getDate() - 30)
            break
        case "90d":
            start.setDate(start.getDate() - 90)
            break
        case "all-time":
            start.setFullYear(2000) // Far past date
            break
    }

    return { start, end }
}

/**
 * Validate time window parameter
 */
function isValidTimeWindow(value: any): value is TimeWindow {
    return ["24h", "7d", "30d", "90d", "all-time"].includes(value)
}

/**
 * Create error response
 */
function createErrorResponse(code: string, message: string): ApiErrorResponse {
    return {
        error: code,
        code,
        message,
        timestamp: new Date(),
    }
}

/**
 * Create Token Killer API router
 */
export function createTokenKillerRouter(pool: DatabasePool): Router {
    const router = Router()

    /**
     * GET /api/token-killer/stats/:timeWindow
     * Get aggregated token statistics for a time window
     * Requirement 6.1-6.2: Token consumption data with multiple time windows
     */
    router.get(
        "/api/token-killer/stats/:timeWindow",
        async (req: Request, res: Response) => {
            try {
                const { timeWindow } = req.params

                // Validate time window parameter
                if (!isValidTimeWindow(timeWindow)) {
                    return res
                        .status(400)
                        .json(
                            createErrorResponse(
                                "INVALID_TIME_WINDOW",
                                `Invalid time window: ${timeWindow}. Must be one of: 24h, 7d, 30d, 90d, all-time`
                            )
                        )
                }

                const { start, end } = getDateRange(timeWindow)

                // Query token records for the time window
                const query = `
          SELECT
            SUM(inputTokens) as totalInputTokens,
            SUM(outputTokens) as totalOutputTokens,
            SUM(totalTokens) as totalTokens,
            SUM(totalCost) as totalCost,
            COUNT(DISTINCT requestId) as requestCount,
            COUNT(DISTINCT taskId) as taskCount,
            agentType,
            model
          FROM token_records
          WHERE timestamp >= ? AND timestamp <= ?
          GROUP BY agentType, model
        `

                const records = await pool.execute<any[]>(
                    query,
                    [start.toISOString(), end.toISOString()],
                    { readonly: true }
                )

                // Aggregate data by agent type, request type, and model
                const byAgentType: Record<
                    string,
                    { tokens: number; cost: number; count: number }
                > = {}
                const byModel: Record<
                    string,
                    { tokens: number; cost: number; count: number }
                > = {}
                let totalTokens = 0
                let totalInputTokens = 0
                let totalOutputTokens = 0
                let totalCost = 0
                let requestCount = 0
                let taskCount = 0

                for (const record of records) {
                    const tokens = record.totalTokens || 0
                    const cost = record.totalCost || 0

                    totalTokens += tokens
                    totalInputTokens += record.totalInputTokens || 0
                    totalOutputTokens += record.totalOutputTokens || 0
                    totalCost += cost
                    requestCount += record.requestCount || 0
                    taskCount += record.taskCount || 0

                    // Aggregate by agent type
                    if (record.agentType) {
                        if (!byAgentType[record.agentType]) {
                            byAgentType[record.agentType] = {
                                tokens: 0,
                                cost: 0,
                                count: 0,
                            }
                        }
                        byAgentType[record.agentType].tokens += tokens
                        byAgentType[record.agentType].cost += cost
                        byAgentType[record.agentType].count +=
                            record.requestCount || 0
                    }

                    // Aggregate by model
                    if (record.model) {
                        if (!byModel[record.model]) {
                            byModel[record.model] = {
                                tokens: 0,
                                cost: 0,
                                count: 0,
                            }
                        }
                        byModel[record.model].tokens += tokens
                        byModel[record.model].cost += cost
                        byModel[record.model].count += record.requestCount || 0
                    }
                }

                // Estimate BRL cost (1 USD = 5 BRL, configurable)
                const exchangeRate = parseFloat(
                    process.env.BRL_EXCHANGE_RATE || "5"
                )
                const costBRL = totalCost * exchangeRate

                const result: AggregatedTokenData = {
                    timeWindow,
                    startDate: start,
                    endDate: end,
                    totalTokens,
                    inputTokens: totalInputTokens,
                    outputTokens: totalOutputTokens,
                    totalCost,
                    costUSD: totalCost,
                    costBRL,
                    requestCount,
                    taskCount,
                    byAgentType,
                    byRequestType: {}, // Will be populated from metadata if available
                    byModel,
                    byOptimizationStrategy: {},
                }

                logger.info("Token stats retrieved", {
                    timeWindow,
                    totalTokens,
                    totalCost,
                })

                res.json(result)
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : String(error)
                logger.error("Failed to retrieve token stats", error as Error)
                res.status(500).json(
                    createErrorResponse(
                        "STATS_RETRIEVAL_FAILED",
                        `Failed to retrieve token statistics: ${message}`
                    )
                )
            }
        }
    )

    /**
     * GET /api/token-killer/breakdown/:timeWindow/:breakdownType
     * Get token breakdown by agent type, request type, or optimization strategy
     * Requirement 6.2-6.3: Token breakdown by various dimensions
     */
    router.get(
        "/api/token-killer/breakdown/:timeWindow/:breakdownType",
        async (req: Request, res: Response) => {
            try {
                const { timeWindow, breakdownType } = req.params
                const breakdownTypeStr = Array.isArray(breakdownType)
                    ? breakdownType[0]
                    : breakdownType

                // Validate time window
                if (!isValidTimeWindow(timeWindow)) {
                    return res
                        .status(400)
                        .json(
                            createErrorResponse(
                                "INVALID_TIME_WINDOW",
                                `Invalid time window: ${timeWindow}`
                            )
                        )
                }

                // Validate breakdown type
                const validBreakdownTypes = [
                    "agent-type",
                    "request-type",
                    "model",
                    "strategy",
                ]
                if (!validBreakdownTypes.includes(breakdownTypeStr)) {
                    return res
                        .status(400)
                        .json(
                            createErrorResponse(
                                "INVALID_BREAKDOWN_TYPE",
                                `Invalid breakdown type: ${breakdownTypeStr}. Must be one of: ${validBreakdownTypes.join(", ")}`
                            )
                        )
                }

                const { start, end } = getDateRange(timeWindow)

                let query = ""
                let groupByField = ""

                switch (breakdownTypeStr) {
                    case "agent-type":
                        groupByField = "agentType"
                        break
                    case "request-type":
                        groupByField = "metadata" // Will need to parse JSON
                        break
                    case "model":
                        groupByField = "model"
                        break
                    case "strategy":
                        groupByField = "metadata" // Will need to parse JSON
                        break
                }

                if (
                    breakdownType === "agent-type" ||
                    breakdownType === "model"
                ) {
                    query = `
            SELECT
              ${groupByField} as category,
              SUM(inputTokens) as inputTokens,
              SUM(outputTokens) as outputTokens,
              SUM(totalTokens) as totalTokens,
              SUM(totalCost) as totalCost,
              COUNT(*) as count
            FROM token_records
            WHERE timestamp >= ? AND timestamp <= ?
            GROUP BY ${groupByField}
            ORDER BY totalTokens DESC
          `
                } else {
                    // For request-type and strategy, we need to parse metadata
                    query = `
            SELECT
              metadata,
              SUM(inputTokens) as inputTokens,
              SUM(outputTokens) as outputTokens,
              SUM(totalTokens) as totalTokens,
              SUM(totalCost) as totalCost,
              COUNT(*) as count
            FROM token_records
            WHERE timestamp >= ? AND timestamp <= ?
            GROUP BY metadata
            ORDER BY totalTokens DESC
          `
                }

                const startStr = start.toISOString()
                const endStr = end.toISOString()
                const records = await pool.execute<any[]>(
                    query,
                    [startStr, endStr],
                    { readonly: true }
                )

                const breakdown = records.map(record => ({
                    category: record.category || "unknown",
                    inputTokens: record.inputTokens || 0,
                    outputTokens: record.outputTokens || 0,
                    totalTokens: record.totalTokens || 0,
                    totalCost: record.totalCost || 0,
                    count: record.count || 0,
                    percentage: 0, // Will be calculated below
                }))

                // Calculate percentages
                const totalTokens = breakdown.reduce(
                    (sum, item) => sum + item.totalTokens,
                    0
                )
                for (const item of breakdown) {
                    item.percentage =
                        totalTokens > 0
                            ? (item.totalTokens / totalTokens) * 100
                            : 0
                }

                logger.info("Token breakdown retrieved", {
                    timeWindow,
                    breakdownType,
                    categories: breakdown.length,
                })

                res.json({
                    timeWindow,
                    breakdownType: breakdownTypeStr,
                    breakdown,
                    totalTokens,
                })
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : String(error)
                logger.error(
                    "Failed to retrieve token breakdown",
                    error as Error
                )
                res.status(500).json(
                    createErrorResponse(
                        "BREAKDOWN_RETRIEVAL_FAILED",
                        `Failed to retrieve token breakdown: ${message}`
                    )
                )
            }
        }
    )

    /**
     * GET /api/token-killer/anomalies/:timeWindow
     * Detect and return anomalies in token consumption
     * Requirement 6.4: Anomaly detection endpoint
     */
    router.get(
        "/api/token-killer/anomalies/:timeWindow",
        async (req: Request, res: Response) => {
            try {
                const { timeWindow } = req.params
                const threshold = parseFloat(req.query.threshold as string) || 2 // Z-score threshold

                // Validate time window
                if (!isValidTimeWindow(timeWindow)) {
                    return res
                        .status(400)
                        .json(
                            createErrorResponse(
                                "INVALID_TIME_WINDOW",
                                `Invalid time window: ${timeWindow}`
                            )
                        )
                }

                // Validate threshold
                if (threshold <= 0 || threshold > 10) {
                    return res
                        .status(400)
                        .json(
                            createErrorResponse(
                                "INVALID_THRESHOLD",
                                "Threshold must be between 0 and 10"
                            )
                        )
                }

                const { start, end } = getDateRange(timeWindow)

                // Query daily aggregated token consumption
                const query = `
          SELECT
            DATE(timestamp) as date,
            SUM(totalTokens) as dailyTokens,
            COUNT(*) as recordCount
          FROM token_records
          WHERE timestamp >= ? AND timestamp <= ?
          GROUP BY DATE(timestamp)
          ORDER BY date ASC
        `

                const records = await pool.execute<any[]>(
                    query,
                    [start.toISOString(), end.toISOString()],
                    { readonly: true }
                )

                if (records.length === 0) {
                    return res.json({
                        anomalies: [],
                        mean: 0,
                        stdDev: 0,
                        threshold,
                        message: "No data available for anomaly detection",
                    })
                }

                // Calculate statistics
                const values = records.map(r => r.dailyTokens || 0)
                const mean = values.reduce((a, b) => a + b, 0) / values.length
                const variance =
                    values.reduce(
                        (sum, val) => sum + Math.pow(val - mean, 2),
                        0
                    ) / values.length
                const stdDev = Math.sqrt(variance)

                // Detect anomalies (Z-score > threshold)
                const anomalies = records
                    .map((record, index) => {
                        const zScore =
                            stdDev > 0
                                ? (record.dailyTokens - mean) / stdDev
                                : 0
                        return {
                            index,
                            date: record.date,
                            dailyTokens: record.dailyTokens,
                            zScore,
                            isAnomaly: Math.abs(zScore) > threshold,
                            recordCount: record.recordCount,
                        }
                    })
                    .filter(item => item.isAnomaly)
                    .map(item => ({
                        timestamp: new Date(item.date),
                        totalTokens: item.dailyTokens,
                        zScore: item.zScore,
                        deviation: `${(((item.zScore * stdDev) / mean) * 100).toFixed(1)}% above mean`,
                        context: `${item.recordCount} records on ${item.date}`,
                    }))

                logger.info("Anomalies detected", {
                    timeWindow,
                    anomalyCount: anomalies.length,
                    mean: mean.toFixed(2),
                    stdDev: stdDev.toFixed(2),
                })

                res.json({
                    anomalies,
                    mean,
                    stdDev,
                    threshold,
                    dataPoints: records.length,
                })
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : String(error)
                logger.error("Failed to detect anomalies", error as Error)
                res.status(500).json(
                    createErrorResponse(
                        "ANOMALY_DETECTION_FAILED",
                        `Failed to detect anomalies: ${message}`
                    )
                )
            }
        }
    )

    /**
     * GET /api/token-killer/health
     * Health check endpoint for the token killer API
     * Requirement 6.5: Error handling and data validation
     */
    router.get(
        "/api/token-killer/health",
        async (req: Request, res: Response) => {
            try {
                const healthCheck = await pool.healthCheck()

                if (!healthCheck.healthy) {
                    return res.status(503).json({
                        status: "unhealthy",
                        error: healthCheck.error,
                        responseTime: healthCheck.responseTime,
                        timestamp: new Date(),
                    })
                }

                res.json({
                    status: "healthy",
                    responseTime: healthCheck.responseTime,
                    timestamp: new Date(),
                })
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : String(error)
                logger.error("Health check failed", error as Error)
                res.status(503).json(
                    createErrorResponse(
                        "HEALTH_CHECK_FAILED",
                        `Health check failed: ${message}`
                    )
                )
            }
        }
    )

    /**
     * Error handler for invalid routes
     */
    router.use((req: Request, res: Response) => {
        res.status(404).json(
            createErrorResponse(
                "NOT_FOUND",
                `Endpoint not found: ${req.method} ${req.path}`
            )
        )
    })

    return router
}

export type { AggregatedTokenData, AnomalyDetectionResult, ApiErrorResponse }
