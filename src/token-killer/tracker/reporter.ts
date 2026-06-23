/**
 * Token Report Generation Module
 * Generates comprehensive token consumption reports
 */

import {
    TokenRecord,
    TokenReport,
    AgentType,
    SupportedModel,
} from "../core/types"
import { getDatabasePool } from "../storage/database"
import { PricingManager } from "./pricing"

/**
 * Per-request token report
 */
export interface RequestTokenReport {
    requestId: string
    taskId?: string
    agentType: AgentType
    model: SupportedModel
    inputTokens: number
    outputTokens: number
    totalTokens: number
    inputCostUSD: number
    outputCostUSD: number
    totalCostUSD: number
    totalCostBRL: number
    timestamp: Date
    metadata?: Record<string, any>
}

/**
 * Per-task token report with breakdown
 */
export interface TaskTokenReport {
    taskId: string
    totalTokens: number
    inputTokens: number
    outputTokens: number
    totalCostUSD: number
    totalCostBRL: number
    requestCount: number
    requests: RequestTokenReport[]
    byModel: Record<SupportedModel, { tokens: number; cost: number }>
    byAgent: Record<AgentType, { tokens: number; cost: number }>
    startTime: Date
    endTime: Date
    duration: number // milliseconds
}

/**
 * Token Reporter class for generating reports
 */
export class TokenReporter {
    private pool = getDatabasePool()
    private pricingManager: PricingManager
    private exchangeRate: number = 5.0

    constructor(pricingManager?: PricingManager, exchangeRate?: number) {
        this.pricingManager = pricingManager || new PricingManager(exchangeRate)
        if (exchangeRate) {
            this.exchangeRate = exchangeRate
        }
    }

    /**
     * Generate per-request token report
     */
    async generateRequestReport(recordId: string): Promise<RequestTokenReport> {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM token_records WHERE id = ?`

            this.pool
                .getConnection()
                .get(query, [recordId], (err, row: any) => {
                    if (err) {
                        reject(err)
                        return
                    }

                    if (!row) {
                        reject(new Error(`Token record not found: ${recordId}`))
                        return
                    }

                    const totalCostBRL = row.totalCost * this.exchangeRate

                    const report: RequestTokenReport = {
                        requestId: row.requestId,
                        taskId: row.taskId,
                        agentType: row.agentType,
                        model: row.model,
                        inputTokens: row.inputTokens,
                        outputTokens: row.outputTokens,
                        totalTokens: row.totalTokens,
                        inputCostUSD: row.inputCost,
                        outputCostUSD: row.outputCost,
                        totalCostUSD: row.totalCost,
                        totalCostBRL,
                        timestamp: new Date(row.timestamp),
                        metadata: row.metadata
                            ? JSON.parse(row.metadata)
                            : undefined,
                    }

                    resolve(report)
                })
        })
    }

    /**
     * Generate per-task token report with breakdown
     */
    async generateTaskReport(taskId: string): Promise<TaskTokenReport> {
        return new Promise((resolve, reject) => {
            const query = `
        SELECT * FROM token_records
        WHERE taskId = ?
        ORDER BY timestamp ASC
      `

            this.pool
                .getConnection()
                .all(query, [taskId], async (err, rows: any[]) => {
                    if (err) {
                        reject(err)
                        return
                    }

                    if (!rows || rows.length === 0) {
                        reject(
                            new Error(
                                `No token records found for task: ${taskId}`
                            )
                        )
                        return
                    }

                    try {
                        let totalTokens = 0
                        let inputTokens = 0
                        let outputTokens = 0
                        let totalCostUSD = 0
                        let startTime: Date | null = null
                        let endTime: Date | null = null
                        const byModel: Record<
                            SupportedModel,
                            { tokens: number; cost: number }
                        > = {} as any
                        const byAgent: Record<
                            AgentType,
                            { tokens: number; cost: number }
                        > = {} as any
                        const requests: RequestTokenReport[] = []

                        for (const row of rows) {
                            const totalCostBRL =
                                row.totalCost * this.exchangeRate

                            const request: RequestTokenReport = {
                                requestId: row.requestId,
                                taskId: row.taskId,
                                agentType: row.agentType,
                                model: row.model,
                                inputTokens: row.inputTokens,
                                outputTokens: row.outputTokens,
                                totalTokens: row.totalTokens,
                                inputCostUSD: row.inputCost,
                                outputCostUSD: row.outputCost,
                                totalCostUSD: row.totalCost,
                                totalCostBRL,
                                timestamp: new Date(row.timestamp),
                                metadata: row.metadata
                                    ? JSON.parse(row.metadata)
                                    : undefined,
                            }

                            requests.push(request)

                            totalTokens += row.totalTokens
                            inputTokens += row.inputTokens
                            outputTokens += row.outputTokens
                            totalCostUSD += row.totalCost

                            const timestamp = new Date(row.timestamp)
                            if (!startTime || timestamp < startTime) {
                                startTime = timestamp
                            }
                            if (!endTime || timestamp > endTime) {
                                endTime = timestamp
                            }

                            // Aggregate by model
                            if (!byModel[row.model]) {
                                byModel[row.model] = { tokens: 0, cost: 0 }
                            }
                            byModel[row.model].tokens += row.totalTokens
                            byModel[row.model].cost += row.totalCost

                            // Aggregate by agent
                            if (!byAgent[row.agentType]) {
                                byAgent[row.agentType] = { tokens: 0, cost: 0 }
                            }
                            byAgent[row.agentType].tokens += row.totalTokens
                            byAgent[row.agentType].cost += row.totalCost
                        }

                        const totalCostBRL = totalCostUSD * this.exchangeRate
                        const duration =
                            endTime!.getTime() - startTime!.getTime()

                        const report: TaskTokenReport = {
                            taskId,
                            totalTokens,
                            inputTokens,
                            outputTokens,
                            totalCostUSD,
                            totalCostBRL,
                            requestCount: rows.length,
                            requests,
                            byModel,
                            byAgent,
                            startTime: startTime!,
                            endTime: endTime!,
                            duration,
                        }

                        resolve(report)
                    } catch (error) {
                        reject(error)
                    }
                })
        })
    }

    /**
     * Generate comprehensive token report for a time period
     */
    async generateComprehensiveReport(
        startDate: Date,
        endDate: Date
    ): Promise<TokenReport> {
        return new Promise((resolve, reject) => {
            const query = `
        SELECT
          SUM(totalTokens) as totalTokens,
          SUM(inputTokens) as inputTokens,
          SUM(outputTokens) as outputTokens,
          SUM(totalCost) as totalCostUSD,
          agentType,
          model
        FROM token_records
        WHERE timestamp >= ? AND timestamp <= ?
        GROUP BY agentType, model
      `

            this.pool
                .getConnection()
                .all(
                    query,
                    [startDate.toISOString(), endDate.toISOString()],
                    (err, rows: any[]) => {
                        if (err) {
                            reject(err)
                            return
                        }

                        let totalTokens = 0
                        let inputTokens = 0
                        let outputTokens = 0
                        let totalCostUSD = 0
                        const byAgent: Record<AgentType, number> = {} as any
                        const byModel: Record<SupportedModel, number> =
                            {} as any

                        for (const row of rows) {
                            totalTokens += row.totalTokens || 0
                            inputTokens += row.inputTokens || 0
                            outputTokens += row.outputTokens || 0
                            totalCostUSD += row.totalCostUSD || 0

                            if (row.agentType) {
                                byAgent[row.agentType] =
                                    (byAgent[row.agentType] || 0) +
                                    (row.totalTokens || 0)
                            }
                            if (row.model) {
                                byModel[row.model] =
                                    (byModel[row.model] || 0) +
                                    (row.totalTokens || 0)
                            }
                        }

                        const totalCostBRL = totalCostUSD * this.exchangeRate

                        const report: TokenReport = {
                            totalTokens,
                            inputTokens,
                            outputTokens,
                            totalCostUSD,
                            totalCostBRL,
                            byAgent,
                            byModel,
                            timestamp: new Date(),
                            period: {
                                start: startDate,
                                end: endDate,
                            },
                        }

                        resolve(report)
                    }
                )
        })
    }

    /**
     * Export report as JSON
     */
    async exportAsJSON(
        report: TokenReport | TaskTokenReport | RequestTokenReport
    ): Promise<string> {
        return JSON.stringify(report, null, 2)
    }

    /**
     * Export report as CSV
     */
    async exportAsCSV(report: TaskTokenReport): Promise<string> {
        const headers = [
            "Request ID",
            "Task ID",
            "Agent Type",
            "Model",
            "Input Tokens",
            "Output Tokens",
            "Total Tokens",
            "Input Cost (USD)",
            "Output Cost (USD)",
            "Total Cost (USD)",
            "Total Cost (BRL)",
            "Timestamp",
        ]

        const rows = report.requests.map(req => [
            req.requestId,
            req.taskId || "",
            req.agentType,
            req.model,
            req.inputTokens,
            req.outputTokens,
            req.totalTokens,
            req.inputCostUSD.toFixed(6),
            req.outputCostUSD.toFixed(6),
            req.totalCostUSD.toFixed(6),
            req.totalCostBRL.toFixed(2),
            req.timestamp.toISOString(),
        ])

        const csv = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
        ].join("\n")

        return csv
    }

    /**
     * Format report for display
     */
    formatReportForDisplay(report: TokenReport | TaskTokenReport): string {
        let output = ""

        if ("requestCount" in report) {
            // Task report
            const taskReport = report as TaskTokenReport
            output += `\n=== Task Token Report ===\n`
            output += `Task ID: ${taskReport.taskId}\n`
            output += `Request Count: ${taskReport.requestCount}\n`
            output += `Duration: ${(taskReport.duration / 1000).toFixed(2)}s\n`
        } else {
            // Comprehensive report
            const compReport = report as TokenReport
            output += `\n=== Comprehensive Token Report ===\n`
            output += `Period: ${compReport.period.start.toISOString()} to ${compReport.period.end.toISOString()}\n`
        }

        output += `\nToken Usage:\n`
        output += `  Input Tokens: ${report.inputTokens.toLocaleString()}\n`
        output += `  Output Tokens: ${report.outputTokens.toLocaleString()}\n`
        output += `  Total Tokens: ${report.totalTokens.toLocaleString()}\n`

        output += `\nCost:\n`
        output += `  USD: $${report.totalCostUSD.toFixed(2)}\n`
        output += `  BRL: R$${report.totalCostBRL.toFixed(2)}\n`

        if (Object.keys(report.byAgent).length > 0) {
            output += `\nBy Agent Type:\n`
            for (const [agent, tokens] of Object.entries(report.byAgent)) {
                output += `  ${agent}: ${tokens.toLocaleString()} tokens\n`
            }
        }

        if (Object.keys(report.byModel).length > 0) {
            output += `\nBy Model:\n`
            for (const [model, tokens] of Object.entries(report.byModel)) {
                output += `  ${model}: ${tokens.toLocaleString()} tokens\n`
            }
        }

        return output
    }

    /**
     * Set exchange rate for BRL conversion
     */
    setExchangeRate(rate: number): void {
        if (rate <= 0) {
            throw new Error("Exchange rate must be positive")
        }
        this.exchangeRate = rate
        this.pricingManager.setExchangeRate(rate)
    }

    /**
     * Get exchange rate
     */
    getExchangeRate(): number {
        return this.exchangeRate
    }
}

export default TokenReporter
