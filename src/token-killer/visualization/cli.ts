/**
 * Token Killer CLI Tool
 * Provides command-line interface for token statistics reporting
 * Implements Requirements 6.8, 6.9, 6.10: CLI reporting with multiple output formats
 */

import { Command } from "commander"
import { DatabasePool } from "../storage/database"
import { createLogger } from "../../lib/logger"
import {
    formatTableOutput,
    formatJsonOutput,
    formatCsvOutput,
    createMetadata,
} from "./cli-formatters"

const logger = createLogger("TokenKillerCLI")

/**
 * Time window type for data aggregation
 */
type TimeWindow = "24h" | "7d" | "30d" | "90d" | "all-time"

/**
 * Output format type
 */
type OutputFormat = "json" | "csv" | "table"

/**
 * Validate time window parameter
 */
function isValidTimeWindow(value: string): value is TimeWindow {
    return ["24h", "7d", "30d", "90d", "all-time"].includes(value)
}

/**
 * Validate output format parameter
 */
function isValidOutputFormat(value: string): value is OutputFormat {
    return ["json", "csv", "table"].includes(value)
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
 * Aggregated token statistics
 */
interface TokenStats {
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
    byModel: Record<string, { tokens: number; cost: number; count: number }>
}

/**
 * Query token statistics from database
 */
async function queryTokenStats(
    pool: DatabasePool,
    timeWindow: TimeWindow
): Promise<TokenStats> {
    const { start, end } = getDateRange(timeWindow)

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

    // Aggregate data
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
                byAgentType[record.agentType] = { tokens: 0, cost: 0, count: 0 }
            }
            byAgentType[record.agentType].tokens += tokens
            byAgentType[record.agentType].cost += cost
            byAgentType[record.agentType].count += record.requestCount || 0
        }

        // Aggregate by model
        if (record.model) {
            if (!byModel[record.model]) {
                byModel[record.model] = { tokens: 0, cost: 0, count: 0 }
            }
            byModel[record.model].tokens += tokens
            byModel[record.model].cost += cost
            byModel[record.model].count += record.requestCount || 0
        }
    }

    // Estimate BRL cost (1 USD = 5 BRL, configurable)
    const exchangeRate = parseFloat(process.env.BRL_EXCHANGE_RATE || "5")
    const costBRL = totalCost * exchangeRate

    return {
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
        byModel,
    }
}

/**
 * Create Token Killer CLI program
 */
export function createTokenKillerCLI(pool: DatabasePool): Command {
    const program = new Command()

    program
        .name("token-killer")
        .description(
            "Token Killer CLI - Token consumption tracking and reporting"
        )
        .version("1.0.0")

    /**
     * stats command: Display token statistics
     * Requirement 6.8-6.10: CLI reporting with multiple output formats
     */
    program
        .command("stats")
        .description("Display token consumption statistics")
        .option("--days <number>", "Number of days to report (default: 7)", "7")
        .option(
            "--format <format>",
            "Output format: json, csv, or table (default: table)",
            "table"
        )
        .action(async options => {
            try {
                // Parse and validate days parameter
                const days = parseInt(options.days, 10)
                if (isNaN(days) || days < 1) {
                    console.error("Error: --days must be a positive integer")
                    process.exit(1)
                }

                // Convert days to time window
                let timeWindow: TimeWindow = "7d"
                if (days === 1) {
                    timeWindow = "24h"
                } else if (days === 7) {
                    timeWindow = "7d"
                } else if (days === 30) {
                    timeWindow = "30d"
                } else if (days === 90) {
                    timeWindow = "90d"
                } else {
                    // For custom days, use all-time and filter in post-processing
                    timeWindow = "all-time"
                }

                // Validate output format
                const format = options.format.toLowerCase()
                if (!isValidOutputFormat(format)) {
                    console.error(
                        `Error: Invalid format '${format}'. Must be one of: json, csv, table`
                    )
                    process.exit(1)
                }

                // Query token statistics
                logger.info("Querying token statistics", { timeWindow, format })
                const stats = await queryTokenStats(pool, timeWindow)

                // Create metadata
                const metadata = createMetadata({
                    timeWindow,
                    daysRequested: days,
                    format,
                })

                // Format and output results
                let output = ""
                switch (format) {
                    case "json":
                        output = formatJsonOutput(stats, metadata)
                        break
                    case "csv":
                        output = formatCsvOutput(stats, metadata)
                        break
                    case "table":
                        output = formatTableOutput(stats, metadata)
                        break
                }

                console.log(output)
                logger.info("Token statistics displayed successfully", {
                    format,
                    totalTokens: stats.totalTokens,
                })
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : String(error)
                console.error(
                    `Error: Failed to retrieve token statistics: ${message}`
                )
                logger.error(
                    "Failed to retrieve token statistics",
                    error as Error
                )
                process.exit(1)
            }
        })

    /**
     * budget command: Display budget status
     */
    program
        .command("budget")
        .description("Display budget status and consumption")
        .action(async () => {
            try {
                console.log("Budget status command not yet implemented")
                logger.info("Budget status command invoked")
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : String(error)
                console.error(`Error: ${message}`)
                logger.error("Budget command failed", error as Error)
                process.exit(1)
            }
        })

    /**
     * strategy command: Manage optimization strategies
     */
    program
        .command("strategy")
        .description("Manage optimization strategies")
        .action(async () => {
            try {
                console.log("Strategy management command not yet implemented")
                logger.info("Strategy command invoked")
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : String(error)
                console.error(`Error: ${message}`)
                logger.error("Strategy command failed", error as Error)
                process.exit(1)
            }
        })

    return program
}

export type { TokenStats, TimeWindow, OutputFormat }
