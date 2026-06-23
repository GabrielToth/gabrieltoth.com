/**
 * Per-Task Budget Management
 * Manages token budgets at the task level with cumulative tracking
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
 */

import { v4 as uuidv4 } from "uuid"
import { DatabasePool } from "../storage/database"

/**
 * Task budget allocation
 */
export interface TaskBudgetAllocation {
    taskId: string
    budgetId: string
    maxTokens: number
    yellowThreshold: number
    redThreshold: number
    createdAt: Date
}

/**
 * Task budget status for real-time monitoring
 */
export interface TaskBudgetStatus {
    taskId: string
    budgetId: string
    totalTokens: number
    maxTokens: number
    percentageUsed: number
    status: "ok" | "warning_yellow" | "warning_red" | "exceeded"
    requestCount: number
    requestBreakdown: Array<{
        requestId: string
        tokens: number
        timestamp: Date
    }>
    lastUpdated: Date
}

/**
 * Task budget overage report
 */
export interface TaskBudgetOverageReport {
    taskId: string
    budgetId: string
    totalTokens: number
    maxTokens: number
    overageTokens: number
    overagePercentage: number
    requestCount: number
    requestDetails: Array<{
        requestId: string
        tokens: number
        timestamp: Date
        agentType: string
        model: string
    }>
    generatedAt: Date
}

/**
 * Task budget manager
 */
export class TaskBudgetManager {
    private pool: DatabasePool
    private warningCallbacks: Map<string, (status: TaskBudgetStatus) => void> =
        new Map()

    constructor(pool: DatabasePool) {
        this.pool = pool
    }

    /**
     * Allocate a budget to a task
     * Requirement 3.1: Task budget allocation
     */
    async allocateBudget(
        taskId: string,
        maxTokens: number,
        yellowThreshold: number = 50,
        redThreshold: number = 80
    ): Promise<TaskBudgetAllocation> {
        if (maxTokens <= 0) {
            throw new Error("maxTokens must be greater than 0")
        }
        if (yellowThreshold <= 0 || yellowThreshold >= 100) {
            throw new Error("yellowThreshold must be between 0 and 100")
        }
        if (redThreshold <= yellowThreshold || redThreshold >= 100) {
            throw new Error(
                "redThreshold must be between yellowThreshold and 100"
            )
        }

        const budgetId = uuidv4()
        const now = new Date()

        return new Promise((resolve, reject) => {
            const connection = this.pool.getConnection()

            // Create budget config
            connection.run(
                `INSERT INTO budget_configs (id, type, name, maxTokens, yellowThreshold, redThreshold, enabled, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    budgetId,
                    "task",
                    `task-${taskId}`,
                    maxTokens,
                    yellowThreshold,
                    redThreshold,
                    1,
                    now.toISOString(),
                    now.toISOString(),
                ],
                err => {
                    if (err) {
                        reject(
                            new Error(
                                `Failed to create task budget: ${err.message}`
                            )
                        )
                        return
                    }

                    // Initialize budget usage
                    connection.run(
                        `INSERT INTO budget_usage (id, budgetId, currentTokens, status, lastUpdated)
             VALUES (?, ?, ?, ?, ?)`,
                        [uuidv4(), budgetId, 0, "ok", now.toISOString()],
                        usageErr => {
                            if (usageErr) {
                                reject(
                                    new Error(
                                        `Failed to initialize task budget usage: ${usageErr.message}`
                                    )
                                )
                                return
                            }

                            // Link budget to task
                            connection.run(
                                `UPDATE tasks SET budgetId = ? WHERE id = ?`,
                                [budgetId, taskId],
                                linkErr => {
                                    if (linkErr) {
                                        reject(
                                            new Error(
                                                `Failed to link budget to task: ${linkErr.message}`
                                            )
                                        )
                                    } else {
                                        resolve({
                                            taskId,
                                            budgetId,
                                            maxTokens,
                                            yellowThreshold,
                                            redThreshold,
                                            createdAt: now,
                                        })
                                    }
                                }
                            )
                        }
                    )
                }
            )
        })
    }

    /**
     * Track token consumption for a task
     * Requirement 3.2: Cumulative token consumption tracking
     */
    async trackTokenConsumption(
        taskId: string,
        requestId: string,
        tokens: number
    ): Promise<TaskBudgetStatus> {
        if (tokens < 0) {
            throw new Error("tokens must be non-negative")
        }

        return new Promise((resolve, reject) => {
            const connection = this.pool.getConnection()

            // Get task budget
            connection.get(
                `SELECT budgetId FROM tasks WHERE id = ?`,
                [taskId],
                (err, taskRow: any) => {
                    if (err) {
                        reject(new Error(`Failed to get task: ${err.message}`))
                        return
                    }

                    if (!taskRow || !taskRow.budgetId) {
                        reject(
                            new Error(
                                `Task not found or has no budget: ${taskId}`
                            )
                        )
                        return
                    }

                    const budgetId = taskRow.budgetId

                    // Get budget config
                    connection.get(
                        `SELECT maxTokens, yellowThreshold, redThreshold FROM budget_configs WHERE id = ?`,
                        [budgetId],
                        (budgetErr, budgetRow: any) => {
                            if (budgetErr) {
                                reject(
                                    new Error(
                                        `Failed to get budget: ${budgetErr.message}`
                                    )
                                )
                                return
                            }

                            // Get current usage
                            connection.get(
                                `SELECT currentTokens FROM budget_usage WHERE budgetId = ?`,
                                [budgetId],
                                (usageErr, usageRow: any) => {
                                    if (usageErr) {
                                        reject(
                                            new Error(
                                                `Failed to get budget usage: ${usageErr.message}`
                                            )
                                        )
                                        return
                                    }

                                    const currentTokens =
                                        (usageRow?.currentTokens || 0) + tokens
                                    const maxTokens = budgetRow.maxTokens
                                    const percentageUsed =
                                        (currentTokens / maxTokens) * 100
                                    let status:
                                        | "ok"
                                        | "warning_yellow"
                                        | "warning_red"
                                        | "exceeded" = "ok"
                                    let warningLevel:
                                        | "yellow"
                                        | "red"
                                        | "critical"
                                        | null = null

                                    // Determine status
                                    if (percentageUsed >= 100) {
                                        status = "exceeded"
                                        warningLevel = "critical"
                                    } else if (
                                        percentageUsed >= budgetRow.redThreshold
                                    ) {
                                        status = "warning_red"
                                        warningLevel = "red"
                                    } else if (
                                        percentageUsed >=
                                        budgetRow.yellowThreshold
                                    ) {
                                        status = "warning_yellow"
                                        warningLevel = "yellow"
                                    }

                                    const now = new Date()

                                    // Update budget usage
                                    connection.run(
                                        `UPDATE budget_usage SET currentTokens = ?, status = ?, lastUpdated = ? WHERE budgetId = ?`,
                                        [
                                            currentTokens,
                                            status,
                                            now.toISOString(),
                                            budgetId,
                                        ],
                                        updateErr => {
                                            if (updateErr) {
                                                reject(
                                                    new Error(
                                                        `Failed to update budget usage: ${updateErr.message}`
                                                    )
                                                )
                                                return
                                            }

                                            // Log warning if needed
                                            if (warningLevel) {
                                                const warningMessage =
                                                    this.generateWarningMessage(
                                                        warningLevel,
                                                        currentTokens,
                                                        maxTokens,
                                                        percentageUsed
                                                    )

                                                connection.run(
                                                    `INSERT INTO budget_warnings (id, budgetId, level, currentTokens, maxTokens, percentageUsed, message, timestamp)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                                                    [
                                                        uuidv4(),
                                                        budgetId,
                                                        warningLevel,
                                                        currentTokens,
                                                        maxTokens,
                                                        percentageUsed,
                                                        warningMessage,
                                                        now.toISOString(),
                                                    ],
                                                    warningErr => {
                                                        if (warningErr) {
                                                            reject(
                                                                new Error(
                                                                    `Failed to log warning: ${warningErr.message}`
                                                                )
                                                            )
                                                            return
                                                        }

                                                        // Get request count
                                                        connection.get(
                                                            `SELECT COUNT(*) as count FROM token_records WHERE taskId = ?`,
                                                            [taskId],
                                                            (
                                                                countErr,
                                                                countRow: any
                                                            ) => {
                                                                if (countErr) {
                                                                    reject(
                                                                        new Error(
                                                                            `Failed to get request count: ${countErr.message}`
                                                                        )
                                                                    )
                                                                    return
                                                                }

                                                                // Emit warning callback
                                                                const callback =
                                                                    this.warningCallbacks.get(
                                                                        taskId
                                                                    )
                                                                if (callback) {
                                                                    callback({
                                                                        taskId,
                                                                        budgetId,
                                                                        totalTokens:
                                                                            currentTokens,
                                                                        maxTokens,
                                                                        percentageUsed,
                                                                        status,
                                                                        requestCount:
                                                                            countRow?.count ||
                                                                            0,
                                                                        requestBreakdown:
                                                                            [],
                                                                        lastUpdated:
                                                                            now,
                                                                    })
                                                                }

                                                                resolve({
                                                                    taskId,
                                                                    budgetId,
                                                                    totalTokens:
                                                                        currentTokens,
                                                                    maxTokens,
                                                                    percentageUsed,
                                                                    status,
                                                                    requestCount:
                                                                        countRow?.count ||
                                                                        0,
                                                                    requestBreakdown:
                                                                        [],
                                                                    lastUpdated:
                                                                        now,
                                                                })
                                                            }
                                                        )
                                                    }
                                                )
                                            } else {
                                                // Get request count
                                                connection.get(
                                                    `SELECT COUNT(*) as count FROM token_records WHERE taskId = ?`,
                                                    [taskId],
                                                    (
                                                        countErr,
                                                        countRow: any
                                                    ) => {
                                                        if (countErr) {
                                                            reject(
                                                                new Error(
                                                                    `Failed to get request count: ${countErr.message}`
                                                                )
                                                            )
                                                            return
                                                        }

                                                        resolve({
                                                            taskId,
                                                            budgetId,
                                                            totalTokens:
                                                                currentTokens,
                                                            maxTokens,
                                                            percentageUsed,
                                                            status,
                                                            requestCount:
                                                                countRow?.count ||
                                                                0,
                                                            requestBreakdown:
                                                                [],
                                                            lastUpdated: now,
                                                        })
                                                    }
                                                )
                                            }
                                        }
                                    )
                                }
                            )
                        }
                    )
                }
            )
        })
    }

    /**
     * Get real-time budget status for a task
     * Requirement 3.8: Real-time budget status for monitoring systems
     */
    async getTaskBudgetStatus(
        taskId: string
    ): Promise<TaskBudgetStatus | null> {
        return new Promise((resolve, reject) => {
            const connection = this.pool.getConnection()

            // Get task budget
            connection.get(
                `SELECT budgetId FROM tasks WHERE id = ?`,
                [taskId],
                (err, taskRow: any) => {
                    if (err) {
                        reject(new Error(`Failed to get task: ${err.message}`))
                        return
                    }

                    if (!taskRow || !taskRow.budgetId) {
                        resolve(null)
                        return
                    }

                    const budgetId = taskRow.budgetId

                    // Get budget usage
                    connection.get(
                        `SELECT bu.currentTokens, bu.status, bu.lastUpdated, bc.maxTokens
             FROM budget_usage bu
             JOIN budget_configs bc ON bu.budgetId = bc.id
             WHERE bu.budgetId = ?`,
                        [budgetId],
                        (usageErr, usageRow: any) => {
                            if (usageErr) {
                                reject(
                                    new Error(
                                        `Failed to get budget usage: ${usageErr.message}`
                                    )
                                )
                                return
                            }

                            if (!usageRow) {
                                resolve(null)
                                return
                            }

                            const percentageUsed =
                                (usageRow.currentTokens / usageRow.maxTokens) *
                                100

                            // Get request breakdown
                            connection.all(
                                `SELECT id, totalTokens, timestamp FROM token_records WHERE taskId = ? ORDER BY timestamp DESC LIMIT 100`,
                                [taskId],
                                (breakdownErr, breakdownRows: any[]) => {
                                    if (breakdownErr) {
                                        reject(
                                            new Error(
                                                `Failed to get request breakdown: ${breakdownErr.message}`
                                            )
                                        )
                                        return
                                    }

                                    // Get request count
                                    connection.get(
                                        `SELECT COUNT(*) as count FROM token_records WHERE taskId = ?`,
                                        [taskId],
                                        (countErr, countRow: any) => {
                                            if (countErr) {
                                                reject(
                                                    new Error(
                                                        `Failed to get request count: ${countErr.message}`
                                                    )
                                                )
                                                return
                                            }

                                            resolve({
                                                taskId,
                                                budgetId,
                                                totalTokens:
                                                    usageRow.currentTokens,
                                                maxTokens: usageRow.maxTokens,
                                                percentageUsed,
                                                status: usageRow.status,
                                                requestCount:
                                                    countRow?.count || 0,
                                                requestBreakdown: (
                                                    breakdownRows || []
                                                ).map(row => ({
                                                    requestId: row.id,
                                                    tokens: row.totalTokens,
                                                    timestamp: new Date(
                                                        row.timestamp
                                                    ),
                                                })),
                                                lastUpdated: new Date(
                                                    usageRow.lastUpdated
                                                ),
                                            })
                                        }
                                    )
                                }
                            )
                        }
                    )
                }
            )
        })
    }

    /**
     * Generate detailed breakdown report for task budget overages
     * Requirement 3.5: Detailed breakdown reports for task budget overages
     */
    async generateOverageReport(
        taskId: string
    ): Promise<TaskBudgetOverageReport | null> {
        return new Promise((resolve, reject) => {
            const connection = this.pool.getConnection()

            // Get task budget
            connection.get(
                `SELECT budgetId FROM tasks WHERE id = ?`,
                [taskId],
                (err, taskRow: any) => {
                    if (err) {
                        reject(new Error(`Failed to get task: ${err.message}`))
                        return
                    }

                    if (!taskRow || !taskRow.budgetId) {
                        resolve(null)
                        return
                    }

                    const budgetId = taskRow.budgetId

                    // Get budget usage
                    connection.get(
                        `SELECT bu.currentTokens, bc.maxTokens
             FROM budget_usage bu
             JOIN budget_configs bc ON bu.budgetId = bc.id
             WHERE bu.budgetId = ?`,
                        [budgetId],
                        (usageErr, usageRow: any) => {
                            if (usageErr) {
                                reject(
                                    new Error(
                                        `Failed to get budget usage: ${usageErr.message}`
                                    )
                                )
                                return
                            }

                            if (!usageRow) {
                                resolve(null)
                                return
                            }

                            const totalTokens = usageRow.currentTokens
                            const maxTokens = usageRow.maxTokens
                            const overageTokens = Math.max(
                                0,
                                totalTokens - maxTokens
                            )
                            const overagePercentage =
                                (overageTokens / maxTokens) * 100

                            // Get request details
                            connection.all(
                                `SELECT id, totalTokens, timestamp, agentType, model FROM token_records WHERE taskId = ? ORDER BY timestamp DESC`,
                                [taskId],
                                (detailsErr, detailsRows: any[]) => {
                                    if (detailsErr) {
                                        reject(
                                            new Error(
                                                `Failed to get request details: ${detailsErr.message}`
                                            )
                                        )
                                        return
                                    }

                                    resolve({
                                        taskId,
                                        budgetId,
                                        totalTokens,
                                        maxTokens,
                                        overageTokens,
                                        overagePercentage,
                                        requestCount: detailsRows?.length || 0,
                                        requestDetails: (detailsRows || []).map(
                                            row => ({
                                                requestId: row.id,
                                                tokens: row.totalTokens,
                                                timestamp: new Date(
                                                    row.timestamp
                                                ),
                                                agentType: row.agentType,
                                                model: row.model,
                                            })
                                        ),
                                        generatedAt: new Date(),
                                    })
                                }
                            )
                        }
                    )
                }
            )
        })
    }

    /**
     * Register a callback for task budget status updates
     */
    onStatusUpdate(
        taskId: string,
        callback: (status: TaskBudgetStatus) => void
    ): void {
        this.warningCallbacks.set(taskId, callback)
    }

    /**
     * Unregister a status update callback
     */
    offStatusUpdate(taskId: string): void {
        this.warningCallbacks.delete(taskId)
    }

    /**
     * Generate warning message based on level and consumption
     */
    private generateWarningMessage(
        level: "yellow" | "red" | "critical",
        currentTokens: number,
        maxTokens: number,
        percentageUsed: number
    ): string {
        const remaining = maxTokens - currentTokens

        switch (level) {
            case "yellow":
                return `⚠️ YELLOW: Task budget at ${percentageUsed.toFixed(1)}% (${currentTokens}/${maxTokens} tokens). Remaining: ${remaining} tokens.`
            case "red":
                return `🔴 RED: Task budget at ${percentageUsed.toFixed(1)}% (${currentTokens}/${maxTokens} tokens). Urgent: Only ${remaining} tokens remaining.`
            case "critical":
                return `🚨 CRITICAL: Task budget exceeded at ${percentageUsed.toFixed(1)}% (${currentTokens}/${maxTokens} tokens). Over by ${currentTokens - maxTokens} tokens.`
        }
    }

    /**
     * Get all tasks with their budget status
     */
    async getAllTasksWithBudgets(): Promise<
        Array<{ taskId: string; status: TaskBudgetStatus | null }>
    > {
        return new Promise((resolve, reject) => {
            const connection = this.pool.getConnection()

            connection.all(
                `SELECT id FROM tasks WHERE status = 'running' ORDER BY startedAt DESC`,
                async (err, rows: any[]) => {
                    if (err) {
                        reject(new Error(`Failed to get tasks: ${err.message}`))
                        return
                    }

                    const results: Array<{
                        taskId: string
                        status: TaskBudgetStatus | null
                    }> = []

                    for (const row of rows || []) {
                        try {
                            const status = await this.getTaskBudgetStatus(
                                row.id
                            )
                            results.push({ taskId: row.id, status })
                        } catch (e) {
                            // Continue on error
                        }
                    }

                    resolve(results)
                }
            )
        })
    }

    /**
     * Complete a task and finalize budget tracking
     */
    async completeTask(taskId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const connection = this.pool.getConnection()
            const now = new Date()

            connection.run(
                `UPDATE tasks SET status = 'completed', completedAt = ? WHERE id = ?`,
                [now.toISOString(), taskId],
                err => {
                    if (err) {
                        reject(
                            new Error(`Failed to complete task: ${err.message}`)
                        )
                    } else {
                        resolve()
                    }
                }
            )
        })
    }
}

export default TaskBudgetManager
