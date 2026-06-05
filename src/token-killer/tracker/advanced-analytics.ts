/**
 * Advanced Analytics Service for Token Killer
 * Extends the analytics engine with caching, performance optimization, and visualization-ready data structures
 * Implements Requirements 14.1-14.5: Token consumption analytics with advanced features
 */

import { AnalyticsEngine, StatisticalSummary, PatternDetectionResult, AnomalyDetectionResult, ForecastResult } from './analytics'
import { getDatabasePool } from '../storage/database'

/**
 * Cached analytics result with metadata
 */
export interface CachedAnalyticsResult<T> {
  data: T
  cachedAt: Date
  expiresAt: Date
  isExpired: boolean
}

/**
 * Visualization-ready analytics data
 */
export interface VisualizationReadyAnalytics {
  statistics: StatisticalSummary
  patterns: PatternDetectionResult
  anomalies: AnomalyDetectionResult
  forecast?: ForecastResult
  timeSeriesData: Array<{
    timestamp: Date
    tokens: number
    cost: number
    anomaly: boolean
  }>
  summary: {
    totalTokens: number
    averageTokensPerDay: number
    peakTokensPerDay: number
    lowestTokensPerDay: number
    anomalyPercentage: number
    forecastedTokensNextWeek?: number
  }
}

/**
 * Performance metrics for analytics operations
 */
export interface AnalyticsPerformanceMetrics {
  operationName: string
  startTime: Date
  endTime: Date
  durationMs: number
  dataPointsProcessed: number
  cacheHit: boolean
}

/**
 * Advanced Analytics Service class
 */
export class AdvancedAnalyticsService {
  private analyticsEngine: AnalyticsEngine
  private pool = getDatabasePool()
  private cache: Map<string, CachedAnalyticsResult<any>> = new Map()
  private cacheExpirationMs: number = 5 * 60 * 1000 // 5 minutes default
  private performanceMetrics: AnalyticsPerformanceMetrics[] = []
  private readonly MAX_METRICS_HISTORY = 100

  constructor(cacheExpirationMs?: number) {
    this.analyticsEngine = new AnalyticsEngine()
    if (cacheExpirationMs) {
      this.cacheExpirationMs = cacheExpirationMs
    }
  }

  /**
   * Generate visualization-ready analytics data with caching
   */
  async generateVisualizationAnalytics(
    startDate: Date,
    endDate: Date,
    useCache: boolean = true
  ): Promise<VisualizationReadyAnalytics> {
    const cacheKey = `viz-analytics-${startDate.toISOString()}-${endDate.toISOString()}`
    const startTime = new Date()

    // Check cache
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!
      if (!cached.isExpired) {
        this.recordMetric({
          operationName: 'generateVisualizationAnalytics',
          startTime,
          endTime: new Date(),
          durationMs: new Date().getTime() - startTime.getTime(),
          dataPointsProcessed: 0,
          cacheHit: true,
        })
        return cached.data
      } else {
        this.cache.delete(cacheKey)
      }
    }

    try {
      // Fetch all analytics data in parallel
      const [statistics, patterns, anomalies, timeSeriesData] = await Promise.all([
        this.analyticsEngine.computeStatistics(startDate, endDate),
        this.analyticsEngine.detectPatterns(startDate, endDate),
        this.analyticsEngine.detectAnomalies(startDate, endDate),
        this.fetchTimeSeriesData(startDate, endDate),
      ])

      // Attempt to forecast (may fail if insufficient data)
      let forecast: ForecastResult | undefined
      try {
        forecast = await this.analyticsEngine.forecastConsumption(startDate, endDate, 7)
      } catch {
        // Forecasting failed, continue without it
      }

      // Calculate summary metrics
      const totalTokens = timeSeriesData.reduce((sum, d) => sum + d.tokens, 0)
      const anomalyCount = anomalies.anomalies.length
      const anomalyPercentage = timeSeriesData.length > 0 ? (anomalyCount / timeSeriesData.length) * 100 : 0

      const tokenValues = timeSeriesData.map((d) => d.tokens)
      const peakTokensPerDay = tokenValues.length > 0 ? Math.max(...tokenValues) : 0
      const lowestTokensPerDay = tokenValues.length > 0 ? Math.min(...tokenValues) : 0
      const averageTokensPerDay = tokenValues.length > 0 ? totalTokens / tokenValues.length : 0

      const result: VisualizationReadyAnalytics = {
        statistics,
        patterns,
        anomalies,
        forecast,
        timeSeriesData,
        summary: {
          totalTokens,
          averageTokensPerDay,
          peakTokensPerDay,
          lowestTokensPerDay,
          anomalyPercentage,
          forecastedTokensNextWeek: forecast?.forecastedTokens,
        },
      }

      // Cache the result
      if (useCache) {
        const now = new Date()
        this.cache.set(cacheKey, {
          data: result,
          cachedAt: now,
          expiresAt: new Date(now.getTime() + this.cacheExpirationMs),
          isExpired: false,
        })
      }

      this.recordMetric({
        operationName: 'generateVisualizationAnalytics',
        startTime,
        endTime: new Date(),
        durationMs: new Date().getTime() - startTime.getTime(),
        dataPointsProcessed: timeSeriesData.length,
        cacheHit: false,
      })

      return result
    } catch (error) {
      throw new Error(
        `Failed to generate visualization analytics: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Get cached statistics with automatic refresh
   */
  async getCachedStatistics(
    startDate: Date,
    endDate: Date,
    forceRefresh: boolean = false
  ): Promise<CachedAnalyticsResult<StatisticalSummary>> {
    const cacheKey = `stats-${startDate.toISOString()}-${endDate.toISOString()}`

    if (!forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!
      if (!cached.isExpired) {
        return cached
      }
      this.cache.delete(cacheKey)
    }

    const startTime = new Date()
    const data = await this.analyticsEngine.computeStatistics(startDate, endDate)
    const now = new Date()

    const result: CachedAnalyticsResult<StatisticalSummary> = {
      data,
      cachedAt: now,
      expiresAt: new Date(now.getTime() + this.cacheExpirationMs),
      isExpired: false,
    }

    this.cache.set(cacheKey, result)

    this.recordMetric({
      operationName: 'getCachedStatistics',
      startTime,
      endTime: new Date(),
      durationMs: new Date().getTime() - startTime.getTime(),
      dataPointsProcessed: 0,
      cacheHit: false,
    })

    return result
  }

  /**
   * Get cached patterns with automatic refresh
   */
  async getCachedPatterns(
    startDate: Date,
    endDate: Date,
    forceRefresh: boolean = false
  ): Promise<CachedAnalyticsResult<PatternDetectionResult>> {
    const cacheKey = `patterns-${startDate.toISOString()}-${endDate.toISOString()}`

    if (!forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!
      if (!cached.isExpired) {
        return cached
      }
      this.cache.delete(cacheKey)
    }

    const startTime = new Date()
    const data = await this.analyticsEngine.detectPatterns(startDate, endDate)
    const now = new Date()

    const result: CachedAnalyticsResult<PatternDetectionResult> = {
      data,
      cachedAt: now,
      expiresAt: new Date(now.getTime() + this.cacheExpirationMs),
      isExpired: false,
    }

    this.cache.set(cacheKey, result)

    this.recordMetric({
      operationName: 'getCachedPatterns',
      startTime,
      endTime: new Date(),
      durationMs: new Date().getTime() - startTime.getTime(),
      dataPointsProcessed: 0,
      cacheHit: false,
    })

    return result
  }

  /**
   * Get cached anomalies with automatic refresh
   */
  async getCachedAnomalies(
    startDate: Date,
    endDate: Date,
    threshold: number = 2,
    forceRefresh: boolean = false
  ): Promise<CachedAnalyticsResult<AnomalyDetectionResult>> {
    const cacheKey = `anomalies-${startDate.toISOString()}-${endDate.toISOString()}-${threshold}`

    if (!forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!
      if (!cached.isExpired) {
        return cached
      }
      this.cache.delete(cacheKey)
    }

    const startTime = new Date()
    const data = await this.analyticsEngine.detectAnomalies(startDate, endDate, threshold)
    const now = new Date()

    const result: CachedAnalyticsResult<AnomalyDetectionResult> = {
      data,
      cachedAt: now,
      expiresAt: new Date(now.getTime() + this.cacheExpirationMs),
      isExpired: false,
    }

    this.cache.set(cacheKey, result)

    this.recordMetric({
      operationName: 'getCachedAnomalies',
      startTime,
      endTime: new Date(),
      durationMs: new Date().getTime() - startTime.getTime(),
      dataPointsProcessed: data.anomalies.length,
      cacheHit: false,
    })

    return result
  }

  /**
   * Get cached forecast with automatic refresh
   */
  async getCachedForecast(
    startDate: Date,
    endDate: Date,
    forecastDays: number = 7,
    forceRefresh: boolean = false
  ): Promise<CachedAnalyticsResult<ForecastResult>> {
    const cacheKey = `forecast-${startDate.toISOString()}-${endDate.toISOString()}-${forecastDays}`

    if (!forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!
      if (!cached.isExpired) {
        return cached
      }
      this.cache.delete(cacheKey)
    }

    const startTime = new Date()
    const data = await this.analyticsEngine.forecastConsumption(startDate, endDate, forecastDays)
    const now = new Date()

    const result: CachedAnalyticsResult<ForecastResult> = {
      data,
      cachedAt: now,
      expiresAt: new Date(now.getTime() + this.cacheExpirationMs),
      isExpired: false,
    }

    this.cache.set(cacheKey, result)

    this.recordMetric({
      operationName: 'getCachedForecast',
      startTime,
      endTime: new Date(),
      durationMs: new Date().getTime() - startTime.getTime(),
      dataPointsProcessed: data.dataPointsUsed,
      cacheHit: false,
    })

    return result
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Clear specific cache entry
   */
  clearCacheEntry(cacheKey: string): void {
    this.cache.delete(cacheKey)
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalEntries: number
    expiredEntries: number
    validEntries: number
  } {
    let expiredCount = 0
    let validCount = 0

    for (const [, cached] of this.cache) {
      if (cached.isExpired) {
        expiredCount++
      } else {
        validCount++
      }
    }

    return {
      totalEntries: this.cache.size,
      expiredEntries: expiredCount,
      validEntries: validCount,
    }
  }

  /**
   * Set cache expiration time
   */
  setCacheExpiration(expirationMs: number): void {
    if (expirationMs <= 0) {
      throw new Error('Cache expiration must be positive')
    }
    this.cacheExpirationMs = expirationMs
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): AnalyticsPerformanceMetrics[] {
    return [...this.performanceMetrics]
  }

  /**
   * Get average performance metrics by operation
   */
  getAveragePerformanceByOperation(): Record<string, { avgDurationMs: number; count: number; cacheHitRate: number }> {
    const stats: Record<string, { totalDuration: number; count: number; cacheHits: number }> = {}

    for (const metric of this.performanceMetrics) {
      if (!stats[metric.operationName]) {
        stats[metric.operationName] = { totalDuration: 0, count: 0, cacheHits: 0 }
      }
      stats[metric.operationName].totalDuration += metric.durationMs
      stats[metric.operationName].count += 1
      if (metric.cacheHit) {
        stats[metric.operationName].cacheHits += 1
      }
    }

    const result: Record<string, { avgDurationMs: number; count: number; cacheHitRate: number }> = {}
    for (const [op, stat] of Object.entries(stats)) {
      result[op] = {
        avgDurationMs: stat.totalDuration / stat.count,
        count: stat.count,
        cacheHitRate: (stat.cacheHits / stat.count) * 100,
      }
    }

    return result
  }

  /**
   * Clear performance metrics
   */
  clearPerformanceMetrics(): void {
    this.performanceMetrics = []
  }

  /**
   * Fetch time series data for visualization
   */
  private async fetchTimeSeriesData(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ timestamp: Date; tokens: number; cost: number; anomaly: boolean }>> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          timestamp,
          totalTokens,
          totalCost
        FROM token_records
        WHERE timestamp >= ? AND timestamp <= ?
        ORDER BY timestamp ASC
      `

      this.pool.getConnection().all(
        query,
        [startDate.toISOString(), endDate.toISOString()],
        (err, rows: any[]) => {
          if (err) {
            reject(err)
            return
          }

          const data = (rows || []).map((row) => ({
            timestamp: new Date(row.timestamp),
            tokens: row.totalTokens || 0,
            cost: row.totalCost || 0,
            anomaly: false, // Will be marked by anomaly detection
          }))

          resolve(data)
        }
      )
    })
  }

  /**
   * Record performance metric
   */
  private recordMetric(metric: AnalyticsPerformanceMetrics): void {
    this.performanceMetrics.push(metric)

    // Keep only recent metrics to avoid memory bloat
    if (this.performanceMetrics.length > this.MAX_METRICS_HISTORY) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.MAX_METRICS_HISTORY)
    }
  }
}

export default AdvancedAnalyticsService
