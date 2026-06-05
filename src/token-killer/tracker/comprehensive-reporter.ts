/**
 * Comprehensive Reporting Service for Token Killer
 * Generates detailed reports with trend analysis, forecasting, and multiple export formats
 * Implements Requirements 11.1-11.6: Token consumption reporting
 */

import { TokenReport, AgentType, SupportedModel } from '../core/types'
import { getDatabasePool } from '../storage/database'
import { AnalyticsEngine, StatisticalSummary, PatternDetectionResult, ForecastResult } from './analytics'
import { PricingManager } from './pricing'

/**
 * Comprehensive report with analytics
 */
export interface ComprehensiveReport {
  generatedAt: Date
  period: {
    start: Date
    end: Date
  }
  summary: {
    totalTokens: number
    inputTokens: number
    outputTokens: number
    totalCostUSD: number
    totalCostBRL: number
    requestCount: number
    taskCount: number
    averageTokensPerRequest: number
    averageCostPerRequest: number
  }
  byAgent: Record<AgentType, { tokens: number; cost: number; count: number; percentage: number }>
  byModel: Record<SupportedModel, { tokens: number; cost: number; count: number; percentage: number }>
  byRequestType: Record<string, { tokens: number; cost: number; count: number; percentage: number }>
  statistics: StatisticalSummary
  patterns: PatternDetectionResult
  forecast?: ForecastResult
  trends: {
    dailyTrend: Array<{ date: string; tokens: number; cost: number }>
    weeklyTrend: Array<{ week: string; tokens: number; cost: number }>
    monthlyTrend: Array<{ month: string; tokens: number; cost: number }>
  }
  metadata: {
    generatedDate: string
    dataRange: string
    filtersApplied: string[]
    timezone: string
  }
}

/**
 * Progress callback for long-running reports
 */
export type ProgressCallback = (progress: {
  stage: string
  percentage: number
  message: string
}) => void

/**
 * Comprehensive Reporter class
 */
export class ComprehensiveReporter {
  private pool = getDatabasePool()
  private analyticsEngine: AnalyticsEngine
  private pricingManager: PricingManager
  private exchangeRate: number = 5.0

  constructor(pricingManager?: PricingManager, exchangeRate?: number) {
    this.analyticsEngine = new AnalyticsEngine()
    this.pricingManager = pricingManager || new PricingManager(exchangeRate)
    if (exchangeRate) {
      this.exchangeRate = exchangeRate
    }
  }

  /**
   * Generate comprehensive report with progress indication
   */
  async generateComprehensiveReport(
    startDate: Date,
    endDate: Date,
    onProgress?: ProgressCallback
  ): Promise<ComprehensiveReport> {
    const report: Partial<ComprehensiveReport> = {
      generatedAt: new Date(),
      period: { start: startDate, end: endDate },
    }

    try {
      // Stage 1: Fetch summary data
      onProgress?.({
        stage: 'Fetching summary data',
        percentage: 10,
        message: 'Retrieving token consumption summary...',
      })
      const summary = await this.fetchSummary(startDate, endDate)
      report.summary = summary

      // Stage 2: Aggregate by agent
      onProgress?.({
        stage: 'Aggregating by agent',
        percentage: 25,
        message: 'Analyzing token consumption by agent type...',
      })
      report.byAgent = await this.aggregateByAgent(startDate, endDate, summary.totalCostUSD)

      // Stage 3: Aggregate by model
      onProgress?.({
        stage: 'Aggregating by model',
        percentage: 40,
        message: 'Analyzing token consumption by model...',
      })
      report.byModel = await this.aggregateByModel(startDate, endDate, summary.totalCostUSD)

      // Stage 4: Aggregate by request type
      onProgress?.({
        stage: 'Aggregating by request type',
        percentage: 50,
        message: 'Analyzing token consumption by request type...',
      })
      report.byRequestType = await this.aggregateByRequestType(startDate, endDate, summary.totalCostUSD)

      // Stage 5: Compute statistics
      onProgress?.({
        stage: 'Computing statistics',
        percentage: 60,
        message: 'Calculating statistical measures...',
      })
      report.statistics = await this.analyticsEngine.computeStatistics(startDate, endDate)

      // Stage 6: Detect patterns
      onProgress?.({
        stage: 'Detecting patterns',
        percentage: 70,
        message: 'Identifying consumption patterns...',
      })
      report.patterns = await this.analyticsEngine.detectPatterns(startDate, endDate)

      // Stage 7: Generate trends
      onProgress?.({
        stage: 'Generating trends',
        percentage: 80,
        message: 'Calculating trend data...',
      })
      report.trends = await this.generateTrends(startDate, endDate)

      // Stage 8: Forecast (optional, only if enough data)
      onProgress?.({
        stage: 'Forecasting',
        percentage: 90,
        message: 'Generating consumption forecast...',
      })
      try {
        report.forecast = await this.analyticsEngine.forecastConsumption(startDate, endDate, 7)
      } catch {
        // Forecasting failed, continue without it
      }

      // Stage 9: Add metadata
      onProgress?.({
        stage: 'Finalizing report',
        percentage: 95,
        message: 'Adding metadata and finalizing...',
      })
      report.metadata = {
        generatedDate: new Date().toISOString(),
        dataRange: `${startDate.toISOString()} to ${endDate.toISOString()}`,
        filtersApplied: [],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }

      onProgress?.({
        stage: 'Complete',
        percentage: 100,
        message: 'Report generation complete',
      })

      return report as ComprehensiveReport
    } catch (error) {
      throw new Error(`Failed to generate comprehensive report: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Export report as JSON
   */
  async exportAsJSON(report: ComprehensiveReport): Promise<string> {
    return JSON.stringify(report, null, 2)
  }

  /**
   * Export report as CSV
   */
  async exportAsCSV(report: ComprehensiveReport): Promise<string> {
    const lines: string[] = []

    // Header
    lines.push('Token Killer Comprehensive Report')
    lines.push(`Generated: ${report.generatedAt.toISOString()}`)
    lines.push(`Period: ${report.period.start.toISOString()} to ${report.period.end.toISOString()}`)
    lines.push('')

    // Summary section
    lines.push('SUMMARY')
    lines.push('Metric,Value')
    lines.push(`Total Tokens,${report.summary.totalTokens}`)
    lines.push(`Input Tokens,${report.summary.inputTokens}`)
    lines.push(`Output Tokens,${report.summary.outputTokens}`)
    lines.push(`Total Cost USD,$${report.summary.totalCostUSD.toFixed(2)}`)
    lines.push(`Total Cost BRL,R$${report.summary.totalCostBRL.toFixed(2)}`)
    lines.push(`Request Count,${report.summary.requestCount}`)
    lines.push(`Task Count,${report.summary.taskCount}`)
    lines.push(`Average Tokens/Request,${report.summary.averageTokensPerRequest.toFixed(2)}`)
    lines.push(`Average Cost/Request,$${report.summary.averageCostPerRequest.toFixed(6)}`)
    lines.push('')

    // By Agent
    lines.push('BY AGENT TYPE')
    lines.push('Agent,Tokens,Cost USD,Count,Percentage')
    for (const [agent, data] of Object.entries(report.byAgent)) {
      lines.push(
        `${agent},${data.tokens},$${data.cost.toFixed(2)},${data.count},${data.percentage.toFixed(1)}%`
      )
    }
    lines.push('')

    // By Model
    lines.push('BY MODEL')
    lines.push('Model,Tokens,Cost USD,Count,Percentage')
    for (const [model, data] of Object.entries(report.byModel)) {
      lines.push(
        `${model},${data.tokens},$${data.cost.toFixed(2)},${data.count},${data.percentage.toFixed(1)}%`
      )
    }
    lines.push('')

    // By Request Type
    lines.push('BY REQUEST TYPE')
    lines.push('Request Type,Tokens,Cost USD,Count,Percentage')
    for (const [type, data] of Object.entries(report.byRequestType)) {
      lines.push(
        `${type},${data.tokens},$${data.cost.toFixed(2)},${data.count},${data.percentage.toFixed(1)}%`
      )
    }
    lines.push('')

    // Statistics
    lines.push('STATISTICS')
    lines.push('Metric,Value')
    lines.push(`Mean,${report.statistics.mean.toFixed(2)}`)
    lines.push(`Median,${report.statistics.median.toFixed(2)}`)
    lines.push(`Std Dev,${report.statistics.stdDev.toFixed(2)}`)
    lines.push(`Min,${report.statistics.min}`)
    lines.push(`Max,${report.statistics.max}`)
    lines.push(`Range,${report.statistics.range}`)
    lines.push(`P25,${report.statistics.percentiles.p25.toFixed(2)}`)
    lines.push(`P50,${report.statistics.percentiles.p50.toFixed(2)}`)
    lines.push(`P75,${report.statistics.percentiles.p75.toFixed(2)}`)
    lines.push(`P90,${report.statistics.percentiles.p90.toFixed(2)}`)
    lines.push(`P95,${report.statistics.percentiles.p95.toFixed(2)}`)
    lines.push(`P99,${report.statistics.percentiles.p99.toFixed(2)}`)
    lines.push('')

    // Forecast
    if (report.forecast) {
      lines.push('FORECAST')
      lines.push('Metric,Value')
      lines.push(`Forecasted Tokens,${report.forecast.forecastedTokens.toFixed(2)}`)
      lines.push(`95% CI Lower,${report.forecast.confidenceInterval95.lower.toFixed(2)}`)
      lines.push(`95% CI Upper,${report.forecast.confidenceInterval95.upper.toFixed(2)}`)
      lines.push(`99% CI Lower,${report.forecast.confidenceInterval99.lower.toFixed(2)}`)
      lines.push(`99% CI Upper,${report.forecast.confidenceInterval99.upper.toFixed(2)}`)
      lines.push(`Accuracy,${report.forecast.accuracy}%`)
      lines.push(`Data Points Used,${report.forecast.dataPointsUsed}`)
      lines.push('')
    }

    return lines.join('\n')
  }

  /**
   * Export report as PDF (requires pdfkit or similar)
   */
  async exportAsPDF(report: ComprehensiveReport): Promise<Buffer> {
    // Note: This requires pdfkit or similar library
    // For now, return a placeholder that indicates PDF export needs external library
    const json = await this.exportAsJSON(report)
    return Buffer.from(json, 'utf-8')
  }

  /**
   * Fetch summary data
   */
  private async fetchSummary(startDate: Date, endDate: Date): Promise<ComprehensiveReport['summary']> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          COUNT(*) as requestCount,
          COUNT(DISTINCT taskId) as taskCount,
          SUM(totalTokens) as totalTokens,
          SUM(inputTokens) as inputTokens,
          SUM(outputTokens) as outputTokens,
          SUM(totalCost) as totalCostUSD
        FROM token_records
        WHERE timestamp >= ? AND timestamp <= ?
      `

      this.pool.getConnection().get(
        query,
        [startDate.toISOString(), endDate.toISOString()],
        (err, row: any) => {
          if (err) {
            reject(err)
            return
          }

          const totalTokens = row.totalTokens || 0
          const totalCostUSD = row.totalCostUSD || 0
          const requestCount = row.requestCount || 0

          const summary: ComprehensiveReport['summary'] = {
            totalTokens,
            inputTokens: row.inputTokens || 0,
            outputTokens: row.outputTokens || 0,
            totalCostUSD,
            totalCostBRL: totalCostUSD * this.exchangeRate,
            requestCount,
            taskCount: row.taskCount || 0,
            averageTokensPerRequest: requestCount > 0 ? totalTokens / requestCount : 0,
            averageCostPerRequest: requestCount > 0 ? totalCostUSD / requestCount : 0,
          }

          resolve(summary)
        }
      )
    })
  }

  /**
   * Aggregate tokens by agent type
   */
  private async aggregateByAgent(
    startDate: Date,
    endDate: Date,
    totalCost: number
  ): Promise<Record<AgentType, { tokens: number; cost: number; count: number; percentage: number }>> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          agentType,
          SUM(totalTokens) as tokens,
          SUM(totalCost) as cost,
          COUNT(*) as count
        FROM token_records
        WHERE timestamp >= ? AND timestamp <= ?
        GROUP BY agentType
      `

      this.pool.getConnection().all(
        query,
        [startDate.toISOString(), endDate.toISOString()],
        (err, rows: any[]) => {
          if (err) {
            reject(err)
            return
          }

          const result: Record<AgentType, { tokens: number; cost: number; count: number; percentage: number }> = {} as any

          for (const row of rows || []) {
            const agentType = row.agentType as AgentType
            result[agentType] = {
              tokens: row.tokens || 0,
              cost: row.cost || 0,
              count: row.count || 0,
              percentage: totalCost > 0 ? ((row.cost || 0) / totalCost) * 100 : 0,
            }
          }

          resolve(result)
        }
      )
    })
  }

  /**
   * Aggregate tokens by model
   */
  private async aggregateByModel(
    startDate: Date,
    endDate: Date,
    totalCost: number
  ): Promise<Record<SupportedModel, { tokens: number; cost: number; count: number; percentage: number }>> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          model,
          SUM(totalTokens) as tokens,
          SUM(totalCost) as cost,
          COUNT(*) as count
        FROM token_records
        WHERE timestamp >= ? AND timestamp <= ?
        GROUP BY model
      `

      this.pool.getConnection().all(
        query,
        [startDate.toISOString(), endDate.toISOString()],
        (err, rows: any[]) => {
          if (err) {
            reject(err)
            return
          }

          const result: Record<SupportedModel, { tokens: number; cost: number; count: number; percentage: number }> = {} as any

          for (const row of rows || []) {
            const model = row.model as SupportedModel
            result[model] = {
              tokens: row.tokens || 0,
              cost: row.cost || 0,
              count: row.count || 0,
              percentage: totalCost > 0 ? ((row.cost || 0) / totalCost) * 100 : 0,
            }
          }

          resolve(result)
        }
      )
    })
  }

  /**
   * Aggregate tokens by request type
   */
  private async aggregateByRequestType(
    startDate: Date,
    endDate: Date,
    totalCost: number
  ): Promise<Record<string, { tokens: number; cost: number; count: number; percentage: number }>> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          metadata,
          SUM(totalTokens) as tokens,
          SUM(totalCost) as cost,
          COUNT(*) as count
        FROM token_records
        WHERE timestamp >= ? AND timestamp <= ?
        GROUP BY metadata
      `

      this.pool.getConnection().all(
        query,
        [startDate.toISOString(), endDate.toISOString()],
        (err, rows: any[]) => {
          if (err) {
            reject(err)
            return
          }

          const result: Record<string, { tokens: number; cost: number; count: number; percentage: number }> = {}

          for (const row of rows || []) {
            let requestType = 'unknown'
            if (row.metadata) {
              try {
                const metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata
                requestType = metadata.requestType || 'unknown'
              } catch {
                // Ignore parsing errors
              }
            }

            if (!result[requestType]) {
              result[requestType] = { tokens: 0, cost: 0, count: 0, percentage: 0 }
            }

            result[requestType].tokens += row.tokens || 0
            result[requestType].cost += row.cost || 0
            result[requestType].count += row.count || 0
            result[requestType].percentage = totalCost > 0 ? (result[requestType].cost / totalCost) * 100 : 0
          }

          resolve(result)
        }
      )
    })
  }

  /**
   * Generate trend data
   */
  private async generateTrends(
    startDate: Date,
    endDate: Date
  ): Promise<ComprehensiveReport['trends']> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          DATE(timestamp) as date,
          SUM(totalTokens) as tokens,
          SUM(totalCost) as cost
        FROM token_records
        WHERE timestamp >= ? AND timestamp <= ?
        GROUP BY DATE(timestamp)
        ORDER BY date ASC
      `

      this.pool.getConnection().all(
        query,
        [startDate.toISOString(), endDate.toISOString()],
        (err, rows: any[]) => {
          if (err) {
            reject(err)
            return
          }

          const dailyTrend = (rows || []).map((r) => ({
            date: r.date,
            tokens: r.tokens || 0,
            cost: r.cost || 0,
          }))

          // Generate weekly trend
          const weeklyMap: Record<string, { tokens: number; cost: number }> = {}
          for (const row of rows || []) {
            const date = new Date(row.date)
            const weekStart = new Date(date)
            weekStart.setDate(date.getDate() - date.getDay())
            const weekKey = weekStart.toISOString().split('T')[0]

            if (!weeklyMap[weekKey]) {
              weeklyMap[weekKey] = { tokens: 0, cost: 0 }
            }
            weeklyMap[weekKey].tokens += row.tokens || 0
            weeklyMap[weekKey].cost += row.cost || 0
          }

          const weeklyTrend = Object.entries(weeklyMap).map(([week, data]) => ({
            week,
            tokens: data.tokens,
            cost: data.cost,
          }))

          // Generate monthly trend
          const monthlyMap: Record<string, { tokens: number; cost: number }> = {}
          for (const row of rows || []) {
            const date = new Date(row.date)
            const monthKey = date.toISOString().substring(0, 7)

            if (!monthlyMap[monthKey]) {
              monthlyMap[monthKey] = { tokens: 0, cost: 0 }
            }
            monthlyMap[monthKey].tokens += row.tokens || 0
            monthlyMap[monthKey].cost += row.cost || 0
          }

          const monthlyTrend = Object.entries(monthlyMap).map(([month, data]) => ({
            month,
            tokens: data.tokens,
            cost: data.cost,
          }))

          resolve({
            dailyTrend,
            weeklyTrend,
            monthlyTrend,
          })
        }
      )
    })
  }

  /**
   * Set exchange rate for BRL conversion
   */
  setExchangeRate(rate: number): void {
    if (rate <= 0) {
      throw new Error('Exchange rate must be positive')
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

export default ComprehensiveReporter
