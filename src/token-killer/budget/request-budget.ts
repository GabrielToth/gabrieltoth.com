/**
 * Per-Request Budget Management
 * Manages token budgets at the request level with warning thresholds
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.8
 */

import { v4 as uuidv4 } from "uuid"
import { DatabasePool } from "../storage/database"

/**
 * Budget configuration for a request type
 */
export interface BudgetConfig {
    id: string
    type: "request" | "task" | "agent"
    name: string
    maxTokens: number
    yellowThreshold: number // percentage (default 50)
    redThreshold: number // percentage (default 80)
    enabled: boolean
    createdAt: Date
    updatedAt: Date
}

/**
 * Current budget usage status
 */
export interface BudgetUsage {
    budgetId: string
    currentTokens: number
    maxTokens: number
    percentageUsed: number
    status: "ok" | "warning_yellow" | "warning_red" | "exceeded"
    lastUpdated: Date
}

/**
 * Budget warning event
 */
export interface BudgetWarning {
    id: string
    budgetId: string
    level: "yellow" | "red" | "critical"
    currentTokens: number
    maxTokens: number
    percentageUsed: number
    message: string
    timestamp: Date
}

/**
 * Request budget manager
 */
export class RequestBudgetManager {
    private pool: DatabasePool
    private warningCallbacks: Map<string, (warning: BudgetWarning) => void> =
        new Map()

    constructor(pool: DatabasePool) {
        this.pool = pool
    }

    /**
     * Create a new budget configuration for a request type
     * Requirement 2.1: Budget creation
     */
    async createBudget(
        name: string,
        maxTokens: number,
        yellowThreshold: number = 50,
        redThreshold: number = 80
    ): Promise<BudgetConfig> {
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

        const id = uuidv4()
        const now = new Date()

        return new Promise((resolve, reject) => {
            const connection = this.pool.getConnection()

            connection.run(
                `INSERT INTO budget_configs (id, type, name, maxTokens, yellowThreshold, redThreshold, enabled, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id,
                    "request",
                    name,
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
                            new Error(`Failed to create budget: ${err.message}`)
                        )
                    } else {
                        // Initialize budget usage
                        connection.run(
                            `INSERT INTO budget_usage (id, budgetId, currentTokens, status, lastUpdated)
               VALUES (?, ?, ?, ?, ?)`,
                            [uuidv4(), id, 0, "ok", now.toISOString()],
                            usageErr => {
                                if (usageErr) {
                                    reject(
                                        new Error(
                                            `Failed to initialize budget usage: ${usageErr.message}`
                                        )
                                    )
                                } else {
                                    resolve({
                                        id,
                                        type: "request",
                                        name,
                                        maxTokens,
                                        yellowThreshold,
                                        redThreshold,
                                        enabled: true,
                                        createdAt: now,
                                        updatedAt: now,
                                    })
                                }
                            }
                        )
                    }
                }
            )
        })
    }

    /**
     * Retrieve a budget configuration by ID
     * Requirement 2.2: Budget retrieval
     */
    async getBudget(budgetId: string): Promise<BudgetConfig | null> {
        return new Promise((resolve, reject) => {
            const connection = this.pool.getConnection()

            connection.get(
                `SELECT id, type, name, maxTokens, yellowThreshold, redThreshold, enabled, createdAt, updatedAt
         FROM budget_configs WHERE id = ?`,
                [budgetId],
                (err, row: any) => {
                    if (err) {
                        reject(
                            new Error(
                                `Failed to retrieve budget: ${err.message}`
                            )
                        )
                    } else if (row) {
                        resolve({
                            id: row.id,
                            type: row.type,
                            name: row.name,
                            maxTokens: row.maxTokens,
                            yellowThreshold: row.yellowThreshold,
                            redThreshold: row.redThreshold,
                            enabled: Boolean(row.enabled),
                            createdAt: new Date(row.createdAt),
                            updatedAt: new Date(row.updatedAt),
                        })
                    } else {
                        resolve(null)
                    }
                }
            )
        })
    }

    /**
     * Retrieve a budget configuration by name
     */
    async getBudgetByName(name: string): Promise<BudgetConfig | null> {
        return new Promise((resolve, reject) => {
            const connection = this.pool.getConnection()

            connection.get(
                `SELECT id, type, name, maxTokens, yellowThreshold, redThreshold, enabled, createdAt, updatedAt
         FROM budget_configs WHERE name = ? AND type = 'request'`,
                [name],
                (err, row: any) => {
                    if (err) {
                        reject(
                            new Error(
                                `Failed to retrieve budget: ${err.message}`
                            )
                        )
                    } else if (row) {
                        resolve({
                            id: row.id,
                            type: row.type,
                            name: row.name,
                            maxTokens: row.maxTokens,
                            yellowThreshold: row.yellowThreshold,
                            redThreshold: row.redThreshold,
                            enabled: Boolean(row.enabled),
                            createdAt: new Date(row.createdAt),
                            updatedAt: new Date(row.updatedAt),
                        })
                    } else {
                        resolve(null)
                    }
                }
            )
        })
    }

    /**
     * Get current budget usage
     */
    async getBudgetUsage(budgetId: string): Promise<BudgetUsage | null> {
        return new Promise((resolve, reject) => {
            const connection = this.pool.getConnection()

            connection.get(
                `SELECT bu.id, bu.budgetId, bu.currentTokens, bu.status, bu.lastUpdated, bc.maxTokens
         FROM budget_usage bu
         JOIN budget_configs bc ON bu.budgetId = bc.id
         WHERE bu.budgetId = ?`,
                [budgetId],
                (err, row: any) => {
                    if (err) {
                        reject(
                            new Error(
                                `Failed to retrieve budget usage: ${err.message}`
                            )
                        )
                    } else if (row) {
                        const percentageUsed =
                            (row.currentTokens / row.maxTokens) * 100
                        resolve({
                            budgetId: row.budgetId,
                            currentTokens: row.currentTokens,
                            maxTokens: row.maxTokens,
                            percentageUsed,
                            status: row.status,
                            lastUpdated: new Date(row.lastUpdated),
                        })
                    } else {
                        resolve(null)
                    }
                }
            )
        })
    }

    /**
     * Consume tokens from a budget and emit warnings if needed
     * Requirement 2.3, 2.4, 2.5: Consumption tracking and warning emission
     */
    async consumeTokens(
        budgetId: string,
        tokens: number
    ): Promise<BudgetUsage> {
        if (tokens < 0) {
            throw new Error("tokens must be non-negative")
        }

        const budget = await this.getBudget(budgetId)
        if (!budget) {
            throw new Error(`Budget not found: ${budgetId}`)
        }

        if (!budget.enabled) {
            throw new Error(`Budget is disabled: ${budgetId}`)
        }

        return new Promise((resolve, reject) => {
            const connection = this.pool.getConnection()

            // Get current usage
            connection.get(
                `SELECT currentTokens FROM budget_usage WHERE budgetId = ?`,
                [budgetId],
                (err, row: any) => {
                    if (err) {
                        reject(
                            new Error(
                                `Failed to get current usage: ${err.message}`
                            )
                        )
                        return
                    }

                    const currentTokens = (row?.currentTokens || 0) + tokens
                    const percentageUsed =
                        (currentTokens / budget.maxTokens) * 100
                    let status:
                        | "ok"
                        | "warning_yellow"
                        | "warning_red"
                        | "exceeded" = "ok"
                    let warningLevel: "yellow" | "red" | "critical" | null =
                        null

                    // Determine status and warning level
                    if (percentageUsed >= 100) {
                        status = "exceeded"
                        warningLevel = "critical"
                    } else if (percentageUsed >= budget.redThreshold) {
                        status = "warning_red"
                        warningLevel = "red"
                    } else if (percentageUsed >= budget.yellowThreshold) {
                        status = "warning_yellow"
                        warningLevel = "yellow"
                    }

                    const now = new Date()

                    // Update budget usage
                    connection.run(
                        `UPDATE budget_usage SET currentTokens = ?, status = ?, lastUpdated = ? WHERE budgetId = ?`,
                        [currentTokens, status, now.toISOString(), budgetId],
                        updateErr => {
                            if (updateErr) {
                                reject(
                                    new Error(
                                        `Failed to update budget usage: ${updateErr.message}`
                                    )
                                )
                                return
                            }

                            // Emit warning if needed
                            if (warningLevel) {
                                const warningMessage =
                                    this.generateWarningMessage(
                                        warningLevel,
                                        currentTokens,
                                        budget.maxTokens,
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
                                        budget.maxTokens,
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

                                        // Emit warning callback if registered
                                        const callback =
                                            this.warningCallbacks.get(budgetId)
                                        if (callback) {
                                            callback({
                                                id: uuidv4(),
                                                budgetId,
                                                level: warningLevel,
                                                currentTokens,
                                                maxTokens: budget.maxTokens,
                                                percentageUsed,
                                                message: warningMessage,
                                                timestamp: now,
                                            })
                                        }

                                        resolve({
                                            budgetId,
                                            currentTokens,
                                            maxTokens: budget.maxTokens,
                                            percentageUsed,
                                            status,
                                            lastUpdated: now,
                                        })
                                    }
                                )
                            } else {
                                resolve({
                                    budgetId,
                                    currentTokens,
                                    maxTokens: budget.maxTokens,
                                    percentageUsed,
                                    status,
                                    lastUpdated: now,
                                })
                            }
                        }
                    )
                }
            )
        })
    }

    /**
     * Override a budget for administrators
     * Requirement 2.8: Budget override functionality
     */
    async overrideBudget(
        budgetId: string,
        newMaxTokens: number,
        adminId: string
    ): Promise<BudgetConfig> {
        if (newMaxTokens <= 0) {
            throw new Error("newMaxTokens must be greater than 0")
        }

        const budget = await this.getBudget(budgetId)
        if (!budget) {
            throw new Error(`Budget not found: ${budgetId}`)
        }

        return new Promise((resolve, reject) => {
            const connection = this.pool.getConnection()
            const now = new Date()

            connection.run(
                `UPDATE budget_configs SET maxTokens = ?, updatedAt = ? WHERE id = ?`,
                [newMaxTokens, now.toISOString(), budgetId],
                err => {
                    if (err) {
                        reject(
                            new Error(
                                `Failed to override budget: ${err.message}`
                            )
                        )
                    } else {
                        // Log the override
                        connection.run(
                            `INSERT INTO budget_warnings (id, budgetId, level, currentTokens, maxTokens, percentageUsed, message, timestamp)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                uuidv4(),
                                budgetId,
                                "critical",
                                0,
                                newMaxTokens,
                                0,
                                `Budget override by admin ${adminId}: ${budget.maxTokens} → ${newMaxTokens} tokens`,
                                now.toISOString(),
                            ],
                            logErr => {
                                if (logErr) {
                                    reject(
                                        new Error(
                                            `Failed to log override: ${logErr.message}`
                                        )
                                    )
                                } else {
                                    resolve({
                                        ...budget,
                                        maxTokens: newMaxTokens,
                                        updatedAt: now,
                                    })
                                }
                            }
                        )
                    }
                }
            )
        })
    }

    /**
     * Reset budget consumption to zero
     */
    async resetBudget(budgetId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const connection = this.pool.getConnection()
            const now = new Date()

            connection.run(
                `UPDATE budget_usage SET currentTokens = 0, status = 'ok', lastUpdated = ? WHERE budgetId = ?`,
                [now.toISOString(), budgetId],
                err => {
                    if (err) {
                        reject(
                            new Error(`Failed to reset budget: ${err.message}`)
                        )
                    } else {
                        resolve()
                    }
                }
            )
        })
    }

    /**
     * Register a callback for budget warnings
     */
    onWarning(
        budgetId: string,
        callback: (warning: BudgetWarning) => void
    ): void {
        this.warningCallbacks.set(budgetId, callback)
    }

    /**
     * Unregister a warning callback
     */
    offWarning(budgetId: string): void {
        this.warningCallbacks.delete(budgetId)
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
        const projectedTotal = currentTokens

        switch (level) {
            case "yellow":
                return `⚠️ YELLOW: Budget at ${percentageUsed.toFixed(1)}% (${currentTokens}/${maxTokens} tokens). Remaining: ${remaining} tokens.`
            case "red":
                return `🔴 RED: Budget at ${percentageUsed.toFixed(1)}% (${currentTokens}/${maxTokens} tokens). Urgent: Only ${remaining} tokens remaining.`
            case "critical":
                return `🚨 CRITICAL: Budget exceeded at ${percentageUsed.toFixed(1)}% (${currentTokens}/${maxTokens} tokens). Over by ${currentTokens - maxTokens} tokens.`
        }
    }

    /**
     * Get all budgets of type 'request'
     */
    async getAllBudgets(): Promise<BudgetConfig[]> {
        return new Promise((resolve, reject) => {
            const connection = this.pool.getConnection()

            connection.all(
                `SELECT id, type, name, maxTokens, yellowThreshold, redThreshold, enabled, createdAt, updatedAt
         FROM budget_configs WHERE type = 'request' ORDER BY createdAt DESC`,
                (err, rows: any[]) => {
                    if (err) {
                        reject(
                            new Error(
                                `Failed to retrieve budgets: ${err.message}`
                            )
                        )
                    } else {
                        resolve(
                            (rows || []).map(row => ({
                                id: row.id,
                                type: row.type,
                                name: row.name,
                                maxTokens: row.maxTokens,
                                yellowThreshold: row.yellowThreshold,
                                redThreshold: row.redThreshold,
                                enabled: Boolean(row.enabled),
                                createdAt: new Date(row.createdAt),
                                updatedAt: new Date(row.updatedAt),
                            }))
                        )
                    }
                }
            )
        })
    }

    /**
     * Enable or disable a budget
     */
    async setBudgetEnabled(budgetId: string, enabled: boolean): Promise<void> {
        return new Promise((resolve, reject) => {
            const connection = this.pool.getConnection()
            const now = new Date()

            connection.run(
                `UPDATE budget_configs SET enabled = ?, updatedAt = ? WHERE id = ?`,
                [enabled ? 1 : 0, now.toISOString(), budgetId],
                err => {
                    if (err) {
                        reject(
                            new Error(`Failed to update budget: ${err.message}`)
                        )
                    } else {
                        resolve()
                    }
                }
            )
        })
    }
}

export default RequestBudgetManager
