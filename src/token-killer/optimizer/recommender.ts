/**
 * Optimization Recommender
 * 
 * Identifies optimization opportunities, compares against baseline,
 * prioritizes by potential savings, and suggests strategy combinations.
 */

import { TokenRecord } from '../core/types'

/**
 * Optimization opportunity
 */
export interface OptimizationOpportunity {
  id: string
  type: 'context-pruning' | 'response-compression' | 'prompt-optimization' | 'caching' | 'model-routing'
  description: string
  potentialSavings: number // tokens
  potentialSavingsPercentage: number
  confidence: number // 0-1 score
  impact: 'low' | 'medium' | 'high'
  affectedRequests: number
  estimatedImplementationTime: string // e.g., "5 minutes"
}

/**
 * Recommendation result
 */
export interface RecommendationResult {
  opportunities: OptimizationOpportunity[]
  suggestedCombinations: Array<{
    strategies: string[]
    combinedSavings: number
    combinedSavingsPercentage: number
    estimatedImplementationTime: string
  }>
  baselineTokens: number
  projectedTokens: number
  projectedSavings: number
  projectedSavingsPercentage: number
  impactSummary: {
    highImpact: number
    mediumImpact: number
    lowImpact: number
  }
}

/**
 * Consumption pattern
 */
interface ConsumptionPattern {
  avgTokensPerRequest: number
  maxTokensPerRequest: number
  minTokensPerRequest: number
  stdDeviation: number
  outliers: number[]
  trend: 'increasing' | 'decreasing' | 'stable'
}

/**
 * Optimization Recommender
 */
export class OptimizationRecommender {
  /**
   * Analyze token consumption patterns
   */
  private analyzeConsumptionPatterns(records: TokenRecord[]): ConsumptionPattern {
    if (records.length === 0) {
      return {
        avgTokensPerRequest: 0,
        maxTokensPerRequest: 0,
        minTokensPerRequest: 0,
        stdDeviation: 0,
        outliers: [],
        trend: 'stable',
      }
    }

    const tokens = records.map(r => r.totalTokens)
    const sum = tokens.reduce((a, b) => a + b, 0)
    const avg = sum / tokens.length
    const max = Math.max(...tokens)
    const min = Math.min(...tokens)

    // Calculate standard deviation
    const squaredDiffs = tokens.map(t => Math.pow(t - avg, 2))
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / tokens.length
    const stdDev = Math.sqrt(variance)

    // Detect outliers (>2 standard deviations from mean)
    const outliers = tokens
      .map((t, i) => ({ token: t, index: i }))
      .filter(({ token }) => Math.abs(token - avg) > 2 * stdDev)
      .map(({ token }) => token)

    // Detect trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
    if (records.length >= 3) {
      const firstThird = tokens.slice(0, Math.floor(tokens.length / 3))
      const lastThird = tokens.slice(Math.floor((tokens.length * 2) / 3))
      const firstAvg = firstThird.reduce((a, b) => a + b, 0) / firstThird.length
      const lastAvg = lastThird.reduce((a, b) => a + b, 0) / lastThird.length

      if (lastAvg > firstAvg * 1.1) {
        trend = 'increasing'
      } else if (lastAvg < firstAvg * 0.9) {
        trend = 'decreasing'
      }
    }

    return {
      avgTokensPerRequest: avg,
      maxTokensPerRequest: max,
      minTokensPerRequest: min,
      stdDeviation: stdDev,
      outliers,
      trend,
    }
  }

  /**
   * Identify context pruning opportunities
   */
  private identifyContextPruningOpportunities(
    records: TokenRecord[],
    pattern: ConsumptionPattern
  ): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = []

    // If average request has high input tokens, context pruning is beneficial
    const avgInputTokens = records.reduce((sum, r) => sum + r.inputTokens, 0) / records.length
    const inputPercentage = avgInputTokens / pattern.avgTokensPerRequest

    if (inputPercentage > 0.4) {
      // More than 40% of tokens are input
      const potentialSavings = Math.ceil(pattern.avgTokensPerRequest * 0.15) // 15% savings
      const totalSavings = potentialSavings * records.length

      opportunities.push({
        id: 'context-pruning-1',
        type: 'context-pruning',
        description: 'Remove old conversations and unnecessary context from requests',
        potentialSavings: totalSavings,
        potentialSavingsPercentage: 0.15,
        confidence: 0.85,
        impact: 'high',
        affectedRequests: records.length,
        estimatedImplementationTime: '2 hours',
      })
    }

    return opportunities
  }

  /**
   * Identify response compression opportunities
   */
  private identifyResponseCompressionOpportunities(
    records: TokenRecord[],
    pattern: ConsumptionPattern
  ): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = []

    // If average request has high output tokens, compression is beneficial
    const avgOutputTokens = records.reduce((sum, r) => sum + r.outputTokens, 0) / records.length
    const outputPercentage = avgOutputTokens / pattern.avgTokensPerRequest

    if (outputPercentage > 0.4) {
      // More than 40% of tokens are output
      const potentialSavings = Math.ceil(pattern.avgTokensPerRequest * 0.20) // 20% savings
      const totalSavings = potentialSavings * records.length

      opportunities.push({
        id: 'response-compression-1',
        type: 'response-compression',
        description: 'Compress responses using abbreviations and structured formatting',
        potentialSavings: totalSavings,
        potentialSavingsPercentage: 0.20,
        confidence: 0.80,
        impact: 'high',
        affectedRequests: records.length,
        estimatedImplementationTime: '3 hours',
      })
    }

    return opportunities
  }

  /**
   * Identify caching opportunities
   */
  private identifyCachingOpportunities(records: TokenRecord[]): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = []

    // Detect repeated requests (same model, similar token counts)
    const requestGroups = new Map<string, TokenRecord[]>()

    for (const record of records) {
      const key = `${record.model}-${Math.floor(record.inputTokens / 100)}`
      if (!requestGroups.has(key)) {
        requestGroups.set(key, [])
      }
      requestGroups.get(key)!.push(record)
    }

    // If there are repeated request patterns
    for (const [key, group] of requestGroups.entries()) {
      if (group.length >= 3) {
        // At least 3 similar requests
        const avgTokens = group.reduce((sum, r) => sum + r.totalTokens, 0) / group.length
        const potentialSavings = Math.ceil(avgTokens * 0.70) // 70% savings for cache hits
        const totalSavings = potentialSavings * (group.length - 1) // First request not cached

        opportunities.push({
          id: `caching-${key}`,
          type: 'caching',
          description: `Cache responses for ${group.length} similar requests (${key})`,
          potentialSavings: totalSavings,
          potentialSavingsPercentage: 0.70,
          confidence: 0.75,
          impact: 'high',
          affectedRequests: group.length,
          estimatedImplementationTime: '4 hours',
        })
      }
    }

    return opportunities
  }

  /**
   * Identify model routing opportunities
   */
  private identifyModelRoutingOpportunities(records: TokenRecord[]): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = []

    // Group by model
    const modelGroups = new Map<string, TokenRecord[]>()

    for (const record of records) {
      if (!modelGroups.has(record.model)) {
        modelGroups.set(record.model, [])
      }
      modelGroups.get(record.model)!.push(record)
    }

    // Check if using expensive models when cheaper alternatives exist
    const expensiveModels = ['gpt-4', 'claude-opus']
    const cheaperModels = ['claude-haiku-4.5', 'gemini-flash-3.1']

    for (const model of expensiveModels) {
      const group = modelGroups.get(model)
      if (group && group.length > 0) {
        const avgCost = group.reduce((sum, r) => sum + r.totalCost, 0) / group.length
        const potentialSavings = Math.ceil(avgCost * 0.10) // 10% savings by routing to cheaper model
        const totalSavings = potentialSavings * group.length

        opportunities.push({
          id: `model-routing-${model}`,
          type: 'model-routing',
          description: `Route ${group.length} requests from ${model} to cheaper alternatives`,
          potentialSavings: totalSavings,
          potentialSavingsPercentage: 0.10,
          confidence: 0.70,
          impact: 'medium',
          affectedRequests: group.length,
          estimatedImplementationTime: '1 hour',
        })
      }
    }

    return opportunities
  }

  /**
   * Identify prompt optimization opportunities
   */
  private identifyPromptOptimizationOpportunities(
    records: TokenRecord[]
  ): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = []

    // If there are requests with very high input tokens, prompt optimization might help
    const highInputRequests = records.filter(r => r.inputTokens > r.outputTokens * 2)

    if (highInputRequests.length > 0) {
      const avgInputTokens = highInputRequests.reduce((sum, r) => sum + r.inputTokens, 0) / 
                             highInputRequests.length
      const potentialSavings = Math.ceil(avgInputTokens * 0.10) // 10% savings
      const totalSavings = potentialSavings * highInputRequests.length

      opportunities.push({
        id: 'prompt-optimization-1',
        type: 'prompt-optimization',
        description: `Optimize ${highInputRequests.length} prompts with high input token counts`,
        potentialSavings: totalSavings,
        potentialSavingsPercentage: 0.10,
        confidence: 0.65,
        impact: 'medium',
        affectedRequests: highInputRequests.length,
        estimatedImplementationTime: '3 hours',
      })
    }

    return opportunities
  }

  /**
   * Suggest strategy combinations
   */
  private suggestCombinations(opportunities: OptimizationOpportunity[]): Array<{
    strategies: string[]
    combinedSavings: number
    combinedSavingsPercentage: number
    estimatedImplementationTime: string
  }> {
    const combinations = []

    // Sort by impact and confidence
    const sorted = [...opportunities].sort((a, b) => {
      const scoreA = (a.impact === 'high' ? 3 : a.impact === 'medium' ? 2 : 1) * a.confidence
      const scoreB = (b.impact === 'high' ? 3 : b.impact === 'medium' ? 2 : 1) * b.confidence
      return scoreB - scoreA
    })

    // Suggest top combinations
    if (sorted.length >= 2) {
      const top2 = sorted.slice(0, 2)
      const combined2 = top2.reduce((sum, opp) => sum + opp.potentialSavings, 0)
      const combined2Pct = top2.reduce((sum, opp) => sum + opp.potentialSavingsPercentage, 0) / 2

      combinations.push({
        strategies: top2.map(opp => opp.type),
        combinedSavings: combined2,
        combinedSavingsPercentage: Math.min(0.95, combined2Pct), // Cap at 95%
        estimatedImplementationTime: '5 hours',
      })
    }

    if (sorted.length >= 3) {
      const top3 = sorted.slice(0, 3)
      const combined3 = top3.reduce((sum, opp) => sum + opp.potentialSavings, 0)
      const combined3Pct = top3.reduce((sum, opp) => sum + opp.potentialSavingsPercentage, 0) / 3

      combinations.push({
        strategies: top3.map(opp => opp.type),
        combinedSavings: combined3,
        combinedSavingsPercentage: Math.min(0.95, combined3Pct),
        estimatedImplementationTime: '8 hours',
      })
    }

    return combinations
  }

  /**
   * Generate recommendations based on token records
   */
  public generateRecommendations(records: TokenRecord[]): RecommendationResult {
    if (records.length === 0) {
      return {
        opportunities: [],
        suggestedCombinations: [],
        baselineTokens: 0,
        projectedTokens: 0,
        projectedSavings: 0,
        projectedSavingsPercentage: 0,
        impactSummary: {
          highImpact: 0,
          mediumImpact: 0,
          lowImpact: 0,
        },
      }
    }

    // Analyze consumption patterns
    const pattern = this.analyzeConsumptionPatterns(records)

    // Identify opportunities
    const opportunities: OptimizationOpportunity[] = [
      ...this.identifyContextPruningOpportunities(records, pattern),
      ...this.identifyResponseCompressionOpportunities(records, pattern),
      ...this.identifyCachingOpportunities(records),
      ...this.identifyModelRoutingOpportunities(records),
      ...this.identifyPromptOptimizationOpportunities(records),
    ]

    // Sort by potential savings
    opportunities.sort((a, b) => b.potentialSavings - a.potentialSavings)

    // Suggest combinations
    const suggestedCombinations = this.suggestCombinations(opportunities)

    // Calculate baseline and projected tokens
    const baselineTokens = records.reduce((sum, r) => sum + r.totalTokens, 0)
    const topOpportunity = opportunities[0]
    const projectedSavings = topOpportunity ? topOpportunity.potentialSavings : 0
    const projectedTokens = baselineTokens - projectedSavings
    const projectedSavingsPercentage = baselineTokens > 0 ? projectedSavings / baselineTokens : 0

    // Impact summary
    const impactSummary = {
      highImpact: opportunities.filter(o => o.impact === 'high').length,
      mediumImpact: opportunities.filter(o => o.impact === 'medium').length,
      lowImpact: opportunities.filter(o => o.impact === 'low').length,
    }

    return {
      opportunities,
      suggestedCombinations,
      baselineTokens,
      projectedTokens,
      projectedSavings,
      projectedSavingsPercentage,
      impactSummary,
    }
  }

  /**
   * Track impact of implemented recommendations
   */
  public trackImpact(
    opportunityId: string,
    beforeTokens: number,
    afterTokens: number
  ): {
    actualSavings: number
    actualSavingsPercentage: number
    effectiveness: number // 0-1 score
  } {
    const actualSavings = beforeTokens - afterTokens
    const actualSavingsPercentage = beforeTokens > 0 ? actualSavings / beforeTokens : 0

    // Effectiveness is how close actual savings are to expected
    // This would be compared against the opportunity's potentialSavingsPercentage
    const effectiveness = Math.min(1, actualSavingsPercentage / 0.25) // Assuming 25% average expected

    return {
      actualSavings,
      actualSavingsPercentage,
      effectiveness,
    }
  }
}

export default OptimizationRecommender
