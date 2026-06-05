/**
 * Budget Audit Logging
 * Comprehensive audit trail for budget events and overrides
 * Requirements: 2.6, 3.6
 */

import { v4 as uuidv4 } from 'uuid'
import { DatabasePool } from '../storage/database'

/**
 * Audit log entry for budget events
 */
export interface AuditLogEntry {
  id: string
  budgetId: string
  eventType: 'threshold_crossing' | 'override' | 'creation' | 'modification' | 'reset'
  level?: 'yellow' | 'red' | 'critical'
  currentTokens: number
  maxTokens: number
  percentageUsed: number
  message: string
  adminId?: string
  metadata?: Record<string, any>
  timestamp: Date
}

/**
 * Audit report for budget events
 */
export interface AuditReport {
  budgetId: string
  startDate: Date
  endDate: Date
  totalEvents: number
  eventsByType: Record<string, number>
  eventsByLevel: Record<string, number>
  thresholdCrossings: AuditLogEntry[]
  overrides: AuditLogEntry[]
  generatedAt: Date
}

/**
 * Budget audit logger
 */
export class BudgetAuditLogger {
  private pool: DatabasePool

  constructor(pool: DatabasePool) {
    this.pool = pool
  }

  /**
   * Log a budget threshold crossing
   * Requirement 2.6: Log all budget threshold crossings with context
   */
  async logThresholdCrossing(
    budgetId: string,
    level: 'yellow' | 'red' | 'critical',
    currentTokens: number,
    maxTokens: number,
    percentageUsed: number
  ): Promise<AuditLogEntry> {
    const id = uuidv4()
    const now = new Date()

    const message = this.generateThresholdMessage(level, currentTokens, maxTokens, percentageUsed)

    return new Promise((resolve, reject) => {
      const connection = this.pool.getConnection()

      connection.run(
        `INSERT INTO budget_warnings (id, budgetId, level, currentTokens, maxTokens, percentageUsed, message, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, budgetId, level, currentTokens, maxTokens, percentageUsed, message, now.toISOString()],
        (err) => {
          if (err) {
            reject(new Error(`Failed to log threshold crossing: ${err.message}`))
          } else {
            resolve({
              id,
              budgetId,
              eventType: 'threshold_crossing',
              level,
              currentTokens,
              maxTokens,
              percentageUsed,
              message,
              timestamp: now,
            })
          }
        }
      )
    })
  }

  /**
   * Log a budget override
   * Requirement 2.6: Log budget overrides with administrator information
   */
  async logBudgetOverride(
    budgetId: string,
    adminId: string,
    oldMaxTokens: number,
    newMaxTokens: number,
    reason?: string
  ): Promise<AuditLogEntry> {
    const id = uuidv4()
    const now = new Date()

    const message = `Budget override by admin ${adminId}: ${oldMaxTokens} → ${newMaxTokens} tokens${reason ? ` (${reason})` : ''}`

    return new Promise((resolve, reject) => {
      const connection = this.pool.getConnection()

      connection.run(
        `INSERT INTO budget_warnings (id, budgetId, level, currentTokens, maxTokens, percentageUsed, message, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, budgetId, 'critical', 0, newMaxTokens, 0, message, now.toISOString()],
        (err) => {
          if (err) {
            reject(new Error(`Failed to log budget override: ${err.message}`))
          } else {
            resolve({
              id,
              budgetId,
              eventType: 'override',
              currentTokens: 0,
              maxTokens: newMaxTokens,
              percentageUsed: 0,
              message,
              adminId,
              metadata: {
                oldMaxTokens,
                newMaxTokens,
                reason,
              },
              timestamp: now,
            })
          }
        }
      )
    })
  }

  /**
   * Log budget creation
   */
  async logBudgetCreation(
    budgetId: string,
    name: string,
    maxTokens: number,
    type: 'request' | 'task' | 'agent'
  ): Promise<AuditLogEntry> {
    const id = uuidv4()
    const now = new Date()

    const message = `Budget created: ${name} (${type}) with limit of ${maxTokens} tokens`

    return new Promise((resolve, reject) => {
      const connection = this.pool.getConnection()

      connection.run(
        `INSERT INTO budget_warnings (id, budgetId, level, currentTokens, maxTokens, percentageUsed, message, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, budgetId, 'critical', 0, maxTokens, 0, message, now.toISOString()],
        (err) => {
          if (err) {
            reject(new Error(`Failed to log budget creation: ${err.message}`))
          } else {
            resolve({
              id,
              budgetId,
              eventType: 'creation',
              currentTokens: 0,
              maxTokens,
              percentageUsed: 0,
              message,
              metadata: {
                name,
                type,
              },
              timestamp: now,
            })
          }
        }
      )
    })
  }

  /**
   * Log budget modification
   */
  async logBudgetModification(
    budgetId: string,
    changes: Record<string, any>
  ): Promise<AuditLogEntry> {
    const id = uuidv4()
    const now = new Date()

    const changesList = Object.entries(changes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ')

    const message = `Budget modified: ${changesList}`

    return new Promise((resolve, reject) => {
      const connection = this.pool.getConnection()

      connection.run(
        `INSERT INTO budget_warnings (id, budgetId, level, currentTokens, maxTokens, percentageUsed, message, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, budgetId, 'critical', 0, 0, 0, message, now.toISOString()],
        (err) => {
          if (err) {
            reject(new Error(`Failed to log budget modification: ${err.message}`))
          } else {
            resolve({
              id,
              budgetId,
              eventType: 'modification',
              currentTokens: 0,
              maxTokens: 0,
              percentageUsed: 0,
              message,
              metadata: changes,
              timestamp: now,
            })
          }
        }
      )
    })
  }

  /**
   * Log budget reset
   */
  async logBudgetReset(budgetId: string, reason?: string): Promise<AuditLogEntry> {
    const id = uuidv4()
    const now = new Date()

    const message = `Budget reset${reason ? ` (${reason})` : ''}`

    return new Promise((resolve, reject) => {
      const connection = this.pool.getConnection()

      connection.run(
        `INSERT INTO budget_warnings (id, budgetId, level, currentTokens, maxTokens, percentageUsed, message, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, budgetId, 'critical', 0, 0, 0, message, now.toISOString()],
        (err) => {
          if (err) {
            reject(new Error(`Failed to log budget reset: ${err.message}`))
          } else {
            resolve({
              id,
              budgetId,
              eventType: 'reset',
              currentTokens: 0,
              maxTokens: 0,
              percentageUsed: 0,
              message,
              metadata: { reason },
              timestamp: now,
            })
          }
        }
      )
    })
  }

  /**
   * Get audit log entries for a budget
   */
  async getAuditLog(
    budgetId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 1000
  ): Promise<AuditLogEntry[]> {
    return new Promise((resolve, reject) => {
      const connection = this.pool.getConnection()

      let query = `SELECT id, budgetId, level, currentTokens, maxTokens, percentageUsed, message, timestamp
                   FROM budget_warnings WHERE budgetId = ?`
      const params: any[] = [budgetId]

      if (startDate) {
        query += ` AND timestamp >= ?`
        params.push(startDate.toISOString())
      }

      if (endDate) {
        query += ` AND timestamp <= ?`
        params.push(endDate.toISOString())
      }

      query += ` ORDER BY timestamp DESC LIMIT ?`
      params.push(limit)

      connection.all(query, params, (err, rows: any[]) => {
        if (err) {
          reject(new Error(`Failed to retrieve audit log: ${err.message}`))
        } else {
          resolve(
            (rows || []).map((row) => ({
              id: row.id,
              budgetId: row.budgetId,
              eventType: this.inferEventType(row.message),
              level: row.level,
              currentTokens: row.currentTokens,
              maxTokens: row.maxTokens,
              percentageUsed: row.percentageUsed,
              message: row.message,
              timestamp: new Date(row.timestamp),
            }))
          )
        }
      })
    })
  }

  /**
   * Generate audit report for a budget
   * Requirement 3.6: Audit report generation
   */
  async generateAuditReport(
    budgetId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AuditReport> {
    return new Promise((resolve, reject) => {
      const connection = this.pool.getConnection()

      // Get all events in date range
      connection.all(
        `SELECT id, budgetId, level, currentTokens, maxTokens, percentageUsed, message, timestamp
         FROM budget_warnings
         WHERE budgetId = ? AND timestamp >= ? AND timestamp <= ?
         ORDER BY timestamp DESC`,
        [budgetId, startDate.toISOString(), endDate.toISOString()],
        (err, rows: any[]) => {
          if (err) {
            reject(new Error(`Failed to generate audit report: ${err.message}`))
            return
          }

          const entries = (rows || []).map((row) => ({
            id: row.id,
            budgetId: row.budgetId,
            eventType: this.inferEventType(row.message),
            level: row.level,
            currentTokens: row.currentTokens,
            maxTokens: row.maxTokens,
            percentageUsed: row.percentageUsed,
            message: row.message,
            timestamp: new Date(row.timestamp),
          }))

          // Aggregate statistics
          const eventsByType: Record<string, number> = {}
          const eventsByLevel: Record<string, number> = {}
          const thresholdCrossings: AuditLogEntry[] = []
          const overrides: AuditLogEntry[] = []

          for (const entry of entries) {
            // Count by type
            eventsByType[entry.eventType] = (eventsByType[entry.eventType] || 0) + 1

            // Count by level
            if (entry.level) {
              eventsByLevel[entry.level] = (eventsByLevel[entry.level] || 0) + 1
            }

            // Categorize
            if (entry.eventType === 'threshold_crossing') {
              thresholdCrossings.push(entry)
            } else if (entry.eventType === 'override') {
              overrides.push(entry)
            }
          }

          resolve({
            budgetId,
            startDate,
            endDate,
            totalEvents: entries.length,
            eventsByType,
            eventsByLevel,
            thresholdCrossings,
            overrides,
            generatedAt: new Date(),
          })
        }
      )
    })
  }

  /**
   * Get all audit logs across all budgets
   */
  async getAllAuditLogs(
    startDate?: Date,
    endDate?: Date,
    limit: number = 10000
  ): Promise<AuditLogEntry[]> {
    return new Promise((resolve, reject) => {
      const connection = this.pool.getConnection()

      let query = `SELECT id, budgetId, level, currentTokens, maxTokens, percentageUsed, message, timestamp
                   FROM budget_warnings`
      const params: any[] = []

      if (startDate || endDate) {
        query += ` WHERE`
        if (startDate) {
          query += ` timestamp >= ?`
          params.push(startDate.toISOString())
        }
        if (endDate) {
          if (startDate) query += ` AND`
          query += ` timestamp <= ?`
          params.push(endDate.toISOString())
        }
      }

      query += ` ORDER BY timestamp DESC LIMIT ?`
      params.push(limit)

      connection.all(query, params, (err, rows: any[]) => {
        if (err) {
          reject(new Error(`Failed to retrieve audit logs: ${err.message}`))
        } else {
          resolve(
            (rows || []).map((row) => ({
              id: row.id,
              budgetId: row.budgetId,
              eventType: this.inferEventType(row.message),
              level: row.level,
              currentTokens: row.currentTokens,
              maxTokens: row.maxTokens,
              percentageUsed: row.percentageUsed,
              message: row.message,
              timestamp: new Date(row.timestamp),
            }))
          )
        }
      })
    })
  }

  /**
   * Export audit log as JSON
   */
  async exportAuditLogAsJSON(
    budgetId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<string> {
    const entries = await this.getAuditLog(budgetId, startDate, endDate)

    return JSON.stringify(
      {
        budgetId,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        totalEntries: entries.length,
        entries,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    )
  }

  /**
   * Export audit log as CSV
   */
  async exportAuditLogAsCSV(
    budgetId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<string> {
    const entries = await this.getAuditLog(budgetId, startDate, endDate)

    const headers = ['ID', 'Budget ID', 'Event Type', 'Level', 'Current Tokens', 'Max Tokens', 'Percentage Used', 'Message', 'Timestamp']
    const rows = entries.map((entry) => [
      entry.id,
      entry.budgetId,
      entry.eventType,
      entry.level || '',
      entry.currentTokens,
      entry.maxTokens,
      entry.percentageUsed.toFixed(2),
      `"${entry.message.replace(/"/g, '""')}"`,
      entry.timestamp.toISOString(),
    ])

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

    return csv
  }

  /**
   * Generate threshold message
   */
  private generateThresholdMessage(
    level: 'yellow' | 'red' | 'critical',
    currentTokens: number,
    maxTokens: number,
    percentageUsed: number
  ): string {
    const remaining = maxTokens - currentTokens

    switch (level) {
      case 'yellow':
        return `⚠️ YELLOW: Budget at ${percentageUsed.toFixed(1)}% (${currentTokens}/${maxTokens} tokens). Remaining: ${remaining} tokens.`
      case 'red':
        return `🔴 RED: Budget at ${percentageUsed.toFixed(1)}% (${currentTokens}/${maxTokens} tokens). Urgent: Only ${remaining} tokens remaining.`
      case 'critical':
        return `🚨 CRITICAL: Budget exceeded at ${percentageUsed.toFixed(1)}% (${currentTokens}/${maxTokens} tokens). Over by ${currentTokens - maxTokens} tokens.`
    }
  }

  /**
   * Infer event type from message
   */
  private inferEventType(message: string): 'threshold_crossing' | 'override' | 'creation' | 'modification' | 'reset' {
    if (message.includes('override')) return 'override'
    if (message.includes('created')) return 'creation'
    if (message.includes('modified')) return 'modification'
    if (message.includes('reset')) return 'reset'
    return 'threshold_crossing'
  }
}

export default BudgetAuditLogger
