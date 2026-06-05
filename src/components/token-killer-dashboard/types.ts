/**
 * Type definitions for Token Killer Dashboard
 */

/**
 * Time window type for data aggregation
 */
export type TimeWindow = '24h' | '7d' | '30d' | '90d' | 'all-time'

/**
 * Aggregated token data for a time window
 */
export interface AggregatedTokenData {
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
  byRequestType: Record<string, { tokens: number; cost: number; count: number }>
  byModel: Record<string, { tokens: number; cost: number; count: number }>
  byOptimizationStrategy: Record<string, { tokensSaved: number; count: number }>
}

/**
 * Anomaly detection result
 */
export interface AnomalyDetectionResult {
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
  dataPoints?: number
}

/**
 * Token breakdown by category
 */
export interface TokenBreakdown {
  category: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  totalCost: number
  count: number
  percentage: number
}

/**
 * Token breakdown response
 */
export interface TokenBreakdownResponse {
  timeWindow: TimeWindow
  breakdownType: 'agent-type' | 'request-type' | 'model' | 'strategy'
  breakdown: TokenBreakdown[]
  totalTokens: number
}

/**
 * Chart data point for uPlot
 */
export interface ChartDataPoint {
  timestamp: number
  tokens: number
  cost: number
}

/**
 * Time series data for charts
 */
export interface TimeSeriesData {
  timestamps: number[]
  tokens: number[]
  costs: number[]
}
