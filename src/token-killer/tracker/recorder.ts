/**
 * Token Recording and Aggregation Module
 * Handles recording token consumption with metadata and task-level aggregation
 */

import { v4 as uuidv4 } from "uuid"
import { TokenRecord, AgentType, SupportedModel } from "../core/types"
import { getDatabasePool } from "../storage/database"

/**
 * Token recording request
 */
export interface RecordTokenRequest {
    requestId: string
    taskId?: string
    agentType: AgentType
    model: SupportedModel
    inputTokens: number
    outputTokens: number
    inputCost: number // USD
    outputCost: number // USD
    metadata?: Record<string, any>
}

/**
 * Task aggregation result
 */
export interface TaskAggregation {
    taskId: string
    totalTokens: number
    inputTokens: number
    outputTokens: number
    totalCostUSD: number
    totalCostBRL: number
    requestCount: number
    byModel: Record<SupportedModel, number>
    byAgent: Record<AgentType, number>
    startTime: Date
    endTime: Date
}

/**
 * Running total for active task
 */
export interface RunningTotal {
    taskId: string
    currentTokens: number
    currentCostUSD: number
    currentCostBRL: number
    requestCount: number
    lastUpdated: Date
}

/**
 * Token Recorder class for recording and aggregating token consumption
 */
export class TokenRecorder {
    private pool = getDatabasePool()
    private runningTotals: Map<string, RunningTotal> = new Map()
    private batchBuffer: TokenRecord[] = []
    private batchSize: number = 10
    private batchFlushInterval: number = 5000 // 5 seconds
    private flushTimer?: NodeJS.Timeout
    private exchangeRate: number = 5.0 // BRL per USD (default)

    constructor(exchangeRate?: number) {
        if (exchangeRate) {
            this.exchangeRate = exchangeRate
        }
    }

    /**
     * Set exchange rate for BRL conversion
     */
    setExchangeRate(rate: number): void {
        if (rate <= 0) {
            throw new Error("Exchange rate must be positive")
        }
        this.exchangeRate = rate
    }

    /**
     * Get exchange rate
     */
    getExchangeRate(): number {
        return this.exchangeRate
    }

    /**
     * Record token consumption
     */
    async recordToken(request: RecordTokenRequest): Promise<TokenRecord> {
        // Validate input
        if (request.inputTokens < 0 || request.outputTokens < 0) {
            throw new Error("Token counts must be non-negative")
        }

        if (request.inputCost < 0 || request.outputCost < 0) {
            throw new Error("Costs must be non-negative")
        }

        const totalTokens = request.inputTokens + request.outputTokens
        const totalCostUSD = request.inputCost + request.outputCost
        const totalCostBRL = totalCostUSD * this.exchangeRate

        const record: TokenRecord = {
            id: uuidv4(),
            requestId: request.requestId,
            taskId: request.taskId,
            agentType: request.agentType,
            model: request.model,
            inputTokens: request.inputTokens,
            outputTokens: request.outputTokens,
            totalTokens,
            inputCost: request.inputCost,
            outputCost: request.outputCost,
            totalCost: totalCostUSD,
            timestamp: new Date(),
            metadata: request.metadata,
            createdAt: new Date(),
        }

        // Add to batch buffer
        this.batchBuffer.push(record)

        // Update running total if task ID is provided
        if (request.taskId) {
            this.updateRunningTotal(request.taskId, record)
        }

        // Flush if batch is full
        if (this.batchBuffer.length >= this.batchSize) {
            await this.flushBatch()
        } else if (!this.flushTimer) {
            // Start flush timer if not already running
            this.flushTimer = setTimeout(
                () => this.flushBatch(),
                this.batchFlushInterval
            )
        }

        return record
    }

    /**
     * Flush batch to database
     */
    private async flushBatch(): Promise<void> {
        if (this.batchBuffer.length === 0) {
            return
        }

        const records = [...this.batchBuffer]
        this.batchBuffer = []

        if (this.flushTimer) {
            clearTimeout(this.flushTimer)
            this.flushTimer = undefined
        }

        try {
            await this.pool.transaction(async db => {
                for (const record of records) {
                    await new Promise<void>((resolve, reject) => {
                        const query = `
              INSERT INTO token_records (
                id, requestId, taskId, agentType, model,
                inputTokens, outputTokens, totalTokens,
                inputCost, outputCost, totalCost,
                timestamp, metadata, createdAt
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `

                        db.run(
                            query,
                            [
                                record.id,
                                record.requestId,
                                record.taskId || null,
                                record.agentType,
                                record.model,
                                record.inputTokens,
                                record.outputTokens,
                                record.totalTokens,
                                record.inputCost,
                                record.outputCost,
                                record.totalCost,
                                record.timestamp.toISOString(),
                                record.metadata
                                    ? JSON.stringify(record.metadata)
                                    : null,
                                record.createdAt.toISOString(),
                            ],
                            err => {
                                if (err) reject(err)
                                else resolve()
                            }
                        )
                    })
                }
            })
        } catch (error) {
            // Re-add records to buffer on failure
            this.batchBuffer.unshift(...records)
            throw error
        }
    }

    /**
     * Update running total for a task
     */
    private updateRunningTotal(taskId: string, record: TokenRecord): void {
        const existing = this.runningTotals.get(taskId)

        if (existing) {
            existing.currentTokens += record.totalTokens
            existing.currentCostUSD += record.inputCost + record.outputCost
            existing.currentCostBRL =
                existing.currentCostUSD * this.exchangeRate
            existing.requestCount += 1
            existing.lastUpdated = new Date()
        } else {
            this.runningTotals.set(taskId, {
                taskId,
                currentTokens: record.totalTokens,
                currentCostUSD: record.inputCost + record.outputCost,
                currentCostBRL:
                    (record.inputCost + record.outputCost) * this.exchangeRate,
                requestCount: 1,
                lastUpdated: new Date(),
            })
        }
    }

    /**
     * Get running total for a task
     */
    getRunningTotal(taskId: string): RunningTotal | undefined {
        return this.runningTotals.get(taskId)
    }

    /**
     * Get all running totals
     */
    getAllRunningTotals(): RunningTotal[] {
        return Array.from(this.runningTotals.values())
    }

    /**
     * Clear running total for a task
     */
    clearRunningTotal(taskId: string): void {
        this.runningTotals.delete(taskId)
    }

    /**
     * Aggregate tokens for a task
     */
    async aggregateTask(taskId: string): Promise<TaskAggregation> {
        await this.flushBatch()

        return new Promise((resolve, reject) => {
            const query = `
        SELECT
          taskId,
          SUM(totalTokens) as totalTokens,
          SUM(inputTokens) as inputTokens,
          SUM(outputTokens) as outputTokens,
          SUM(totalCost) as totalCostUSD,
          COUNT(*) as requestCount,
          MIN(timestamp) as startTime,
          MAX(timestamp) as endTime,
          model,
          agentType
        FROM token_records
        WHERE taskId = ?
        GROUP BY taskId, model, agentType
      `

            this.pool
                .getConnection()
                .all(query, [taskId], (err, rows: any[]) => {
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

                    // Aggregate results
                    let totalTokens = 0
                    let inputTokens = 0
                    let outputTokens = 0
                    let totalCostUSD = 0
                    let requestCount = 0
                    let startTime: Date | null = null
                    let endTime: Date | null = null
                    const byModel: Record<SupportedModel, number> = {} as any
                    const byAgent: Record<AgentType, number> = {} as any

                    for (const row of rows) {
                        totalTokens += row.totalTokens || 0
                        inputTokens += row.inputTokens || 0
                        outputTokens += row.outputTokens || 0
                        totalCostUSD += row.totalCostUSD || 0
                        requestCount += row.requestCount || 0

                        if (!startTime || new Date(row.startTime) < startTime) {
                            startTime = new Date(row.startTime)
                        }
                        if (!endTime || new Date(row.endTime) > endTime) {
                            endTime = new Date(row.endTime)
                        }

                        if (row.model) {
                            byModel[row.model] =
                                (byModel[row.model] || 0) +
                                (row.totalTokens || 0)
                        }
                        if (row.agentType) {
                            byAgent[row.agentType] =
                                (byAgent[row.agentType] || 0) +
                                (row.totalTokens || 0)
                        }
                    }

                    const totalCostBRL = totalCostUSD * this.exchangeRate

                    resolve({
                        taskId,
                        totalTokens,
                        inputTokens,
                        outputTokens,
                        totalCostUSD,
                        totalCostBRL,
                        requestCount,
                        byModel,
                        byAgent,
                        startTime: startTime!,
                        endTime: endTime!,
                    })
                })
        })
    }

    /**
     * Get token records for a task
     */
    async getTaskRecords(taskId: string): Promise<TokenRecord[]> {
        await this.flushBatch()

        return new Promise((resolve, reject) => {
            const query = `
        SELECT * FROM token_records
        WHERE taskId = ?
        ORDER BY timestamp ASC
      `

            this.pool
                .getConnection()
                .all(query, [taskId], (err, rows: any[]) => {
                    if (err) {
                        reject(err)
                        return
                    }

                    const records: TokenRecord[] = (rows || []).map(row => ({
                        id: row.id,
                        requestId: row.requestId,
                        taskId: row.taskId,
                        agentType: row.agentType,
                        model: row.model,
                        inputTokens: row.inputTokens,
                        outputTokens: row.outputTokens,
                        totalTokens: row.totalTokens,
                        inputCost: row.inputCost,
                        outputCost: row.outputCost,
                        totalCost: row.totalCost,
                        timestamp: new Date(row.timestamp),
                        metadata: row.metadata
                            ? JSON.parse(row.metadata)
                            : undefined,
                        createdAt: new Date(row.createdAt),
                    }))

                    resolve(records)
                })
        })
    }

    /**
     * Get token record by ID
     */
    async getRecord(recordId: string): Promise<TokenRecord | null> {
        await this.flushBatch()

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
                        resolve(null)
                        return
                    }

                    const record: TokenRecord = {
                        id: row.id,
                        requestId: row.requestId,
                        taskId: row.taskId,
                        agentType: row.agentType,
                        model: row.model,
                        inputTokens: row.inputTokens,
                        outputTokens: row.outputTokens,
                        totalTokens: row.totalTokens,
                        inputCost: row.inputCost,
                        outputCost: row.outputCost,
                        totalCost: row.totalCost,
                        timestamp: new Date(row.timestamp),
                        metadata: row.metadata
                            ? JSON.parse(row.metadata)
                            : undefined,
                        createdAt: new Date(row.createdAt),
                    }

                    resolve(record)
                })
        })
    }

    /**
     * Flush any pending batch writes
     */
    async flush(): Promise<void> {
        await this.flushBatch()
    }

    /**
     * Clean up resources
     */
    async cleanup(): Promise<void> {
        if (this.flushTimer) {
            clearTimeout(this.flushTimer)
            this.flushTimer = undefined
        }
        await this.flushBatch()
        this.runningTotals.clear()
    }
}

export default TokenRecorder
