/**
 * Strategy Manager
 *
 * Manages token optimization strategies with enable/disable, configuration,
 * priority ordering, and effectiveness tracking.
 *
 * Strategy Priority Order (applied sequentially):
 * 1. Context Pruning (15-30% savings)
 * 2. Response Compression (20-40% savings)
 * 3. Prompt Optimization (10-20% savings)
 * 4. Caching (50-90% savings for repeated queries)
 * 5. Model Routing (5-15% savings by selecting optimal model)
 */

import { Strategy } from "../core/types"

/**
 * Strategy execution result
 */
export interface StrategyExecutionResult {
    strategyId: string
    strategyName: string
    enabled: boolean
    executed: boolean
    originalTokens: number
    resultingTokens: number
    tokensSaved: number
    savingsPercentage: number
    qualityImpact: "none" | "low" | "medium" | "high"
    error?: string
}

/**
 * Cumulative optimization result
 */
export interface CumulativeOptimizationResult {
    originalTokens: number
    finalTokens: number
    totalTokensSaved: number
    totalSavingsPercentage: number
    strategies: StrategyExecutionResult[]
    dryRun: boolean
    estimatedAccuracy: number // percentage (how close estimate is to actual)
}

/**
 * Strategy Manager - Manages and applies optimization strategies
 */
export class StrategyManager {
    private strategies: Map<string, Strategy> = new Map()
    private executionOrder: string[] = [
        "context-pruning",
        "response-compression",
        "prompt-optimization",
        "caching",
        "model-routing",
    ]

    /**
     * Initialize with default strategies
     */
    constructor() {
        this.initializeDefaultStrategies()
    }

    /**
     * Initialize default strategies
     */
    private initializeDefaultStrategies(): void {
        const defaultStrategies: Strategy[] = [
            {
                id: "context-pruning",
                name: "Context Pruning",
                type: "pruning",
                enabled: true,
                priority: 1,
                parameters: {
                    minSavingsPercentage: 0.15,
                    oldConversationThreshold: 8,
                },
                estimatedSavings: 0.22, // 22% average
                actualSavings: 0,
                qualityImpact: "low",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "response-compression",
                name: "Response Compression",
                type: "compression",
                enabled: true,
                priority: 2,
                parameters: {
                    minSavingsPercentage: 0.2,
                    protectedContentTypes: [
                        "code",
                        "json",
                        "yaml",
                        "table",
                        "reasoning",
                    ],
                },
                estimatedSavings: 0.3, // 30% average
                actualSavings: 0,
                qualityImpact: "low",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "prompt-optimization",
                name: "Prompt Optimization",
                type: "optimization",
                enabled: false,
                priority: 3,
                parameters: {
                    minSavingsPercentage: 0.1,
                    techniques: ["clarity", "redundancy-removal"],
                },
                estimatedSavings: 0.15, // 15% average
                actualSavings: 0,
                qualityImpact: "low",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "caching",
                name: "Response Caching",
                type: "caching",
                enabled: false,
                priority: 4,
                parameters: {
                    ttl: 3600, // 1 hour
                    maxCacheSize: 1000,
                },
                estimatedSavings: 0.7, // 70% average (for cache hits)
                actualSavings: 0,
                qualityImpact: "none",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "model-routing",
                name: "Model Routing",
                type: "routing",
                enabled: false,
                priority: 5,
                parameters: {
                    preferredModels: ["claude-haiku-4.5", "gemini-flash-3.1"],
                    costThreshold: 0.1,
                },
                estimatedSavings: 0.1, // 10% average
                actualSavings: 0,
                qualityImpact: "low",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]

        for (const strategy of defaultStrategies) {
            this.strategies.set(strategy.id, strategy)
        }
    }

    /**
     * Get all strategies
     */
    public getAllStrategies(): Strategy[] {
        return Array.from(this.strategies.values())
    }

    /**
     * Get enabled strategies in execution order
     */
    public getEnabledStrategies(): Strategy[] {
        return this.executionOrder
            .map(id => this.strategies.get(id))
            .filter((s): s is Strategy => s !== undefined && s.enabled)
    }

    /**
     * Get strategy by ID
     */
    public getStrategy(id: string): Strategy | undefined {
        return this.strategies.get(id)
    }

    /**
     * Enable a strategy
     */
    public enableStrategy(id: string): boolean {
        const strategy = this.strategies.get(id)
        if (!strategy) return false

        strategy.enabled = true
        strategy.updatedAt = new Date()
        return true
    }

    /**
     * Disable a strategy
     */
    public disableStrategy(id: string): boolean {
        const strategy = this.strategies.get(id)
        if (!strategy) return false

        strategy.enabled = false
        strategy.updatedAt = new Date()
        return true
    }

    /**
     * Configure strategy parameters
     */
    public configureStrategy(
        id: string,
        parameters: Record<string, any>
    ): boolean {
        const strategy = this.strategies.get(id)
        if (!strategy) return false

        // Validate parameters
        if (!this.validateParameters(id, parameters)) {
            return false
        }

        strategy.parameters = { ...strategy.parameters, ...parameters }
        strategy.updatedAt = new Date()
        return true
    }

    /**
     * Validate strategy parameters
     */
    private validateParameters(
        id: string,
        parameters: Record<string, any>
    ): boolean {
        // Basic validation - can be extended per strategy
        for (const [key, value] of Object.entries(parameters)) {
            if (typeof value === "number" && value < 0) {
                return false
            }
            if (typeof value === "string" && value.length === 0) {
                return false
            }
        }
        return true
    }

    /**
     * Set strategy priority
     */
    public setStrategyPriority(id: string, priority: number): boolean {
        const strategy = this.strategies.get(id)
        if (!strategy) return false

        if (priority < 1 || priority > this.strategies.size) {
            return false
        }

        strategy.priority = priority
        strategy.updatedAt = new Date()

        // Reorder execution order
        this.reorderExecutionOrder()
        return true
    }

    /**
     * Reorder execution order based on priorities
     */
    private reorderExecutionOrder(): void {
        const sorted = Array.from(this.strategies.values())
            .sort((a, b) => a.priority - b.priority)
            .map(s => s.id)

        this.executionOrder = sorted
    }

    /**
     * Track strategy effectiveness
     */
    public trackEffectiveness(
        id: string,
        originalTokens: number,
        resultingTokens: number
    ): void {
        const strategy = this.strategies.get(id)
        if (!strategy) return

        const tokensSaved = originalTokens - resultingTokens
        const savingsPercentage =
            originalTokens > 0 ? tokensSaved / originalTokens : 0

        // Update actual savings (running average)
        if (strategy.actualSavings === 0) {
            strategy.actualSavings = savingsPercentage
        } else {
            // Exponential moving average (weight new data 30%, old data 70%)
            strategy.actualSavings =
                strategy.actualSavings * 0.7 + savingsPercentage * 0.3
        }

        strategy.updatedAt = new Date()
    }

    /**
     * Calculate cumulative savings estimate
     */
    public calculateCumulativeSavings(): number {
        const enabledStrategies = this.getEnabledStrategies()

        if (enabledStrategies.length === 0) {
            return 0
        }

        // Combine savings estimates (not simply additive due to diminishing returns)
        // Formula: 1 - (1 - s1) * (1 - s2) * (1 - s3) ...
        let combinedSavings = 1
        for (const strategy of enabledStrategies) {
            combinedSavings *= 1 - strategy.estimatedSavings
        }

        return 1 - combinedSavings
    }

    /**
     * Get strategy execution plan (dry-run)
     */
    public getDryRunPlan(originalTokens: number): CumulativeOptimizationResult {
        const enabledStrategies = this.getEnabledStrategies()
        const results: StrategyExecutionResult[] = []

        let currentTokens = originalTokens

        for (const strategy of enabledStrategies) {
            const estimatedSavings = currentTokens * strategy.estimatedSavings
            const resultingTokens = currentTokens - estimatedSavings

            results.push({
                strategyId: strategy.id,
                strategyName: strategy.name,
                enabled: true,
                executed: false,
                originalTokens: currentTokens,
                resultingTokens,
                tokensSaved: estimatedSavings,
                savingsPercentage: strategy.estimatedSavings,
                qualityImpact: strategy.qualityImpact,
            })

            currentTokens = resultingTokens
        }

        const totalTokensSaved = originalTokens - currentTokens
        const totalSavingsPercentage =
            originalTokens > 0 ? totalTokensSaved / originalTokens : 0

        return {
            originalTokens,
            finalTokens: currentTokens,
            totalTokensSaved,
            totalSavingsPercentage,
            strategies: results,
            dryRun: true,
            estimatedAccuracy: 0.85, // 85% accuracy estimate
        }
    }

    /**
     * Execute strategies in order (simulated)
     */
    public executeStrategies(
        originalTokens: number
    ): CumulativeOptimizationResult {
        const enabledStrategies = this.getEnabledStrategies()
        const results: StrategyExecutionResult[] = []

        let currentTokens = originalTokens

        for (const strategy of enabledStrategies) {
            // Simulate strategy execution
            const actualSavings =
                currentTokens *
                (strategy.actualSavings || strategy.estimatedSavings)
            const resultingTokens = Math.max(0, currentTokens - actualSavings)

            results.push({
                strategyId: strategy.id,
                strategyName: strategy.name,
                enabled: true,
                executed: true,
                originalTokens: currentTokens,
                resultingTokens,
                tokensSaved: actualSavings,
                savingsPercentage:
                    currentTokens > 0 ? actualSavings / currentTokens : 0,
                qualityImpact: strategy.qualityImpact,
            })

            // Track effectiveness
            this.trackEffectiveness(strategy.id, currentTokens, resultingTokens)

            currentTokens = resultingTokens
        }

        const totalTokensSaved = originalTokens - currentTokens
        const totalSavingsPercentage =
            originalTokens > 0 ? totalTokensSaved / originalTokens : 0

        return {
            originalTokens,
            finalTokens: currentTokens,
            totalTokensSaved,
            totalSavingsPercentage,
            strategies: results,
            dryRun: false,
            estimatedAccuracy: 0.95, // 95% accuracy for actual execution
        }
    }

    /**
     * Get strategy recommendations based on effectiveness
     */
    public getRecommendations(): Array<{
        strategyId: string
        strategyName: string
        recommendation: "enable" | "disable" | "configure"
        reason: string
        suggestedParameters?: Record<string, any>
    }> {
        const recommendations = []

        for (const strategy of this.strategies.values()) {
            // Recommend enabling high-effectiveness strategies
            if (!strategy.enabled && strategy.actualSavings > 0.15) {
                recommendations.push({
                    strategyId: strategy.id,
                    strategyName: strategy.name,
                    recommendation: "enable",
                    reason: `Strategy has shown ${(strategy.actualSavings * 100).toFixed(1)}% actual savings`,
                })
            }

            // Recommend disabling low-effectiveness strategies
            if (
                strategy.enabled &&
                strategy.actualSavings > 0 &&
                strategy.actualSavings < 0.05
            ) {
                recommendations.push({
                    strategyId: strategy.id,
                    strategyName: strategy.name,
                    recommendation: "disable",
                    reason: `Strategy has shown only ${(strategy.actualSavings * 100).toFixed(1)}% actual savings`,
                })
            }

            // Recommend configuration adjustments
            if (strategy.enabled && strategy.qualityImpact === "high") {
                recommendations.push({
                    strategyId: strategy.id,
                    strategyName: strategy.name,
                    recommendation: "configure",
                    reason: "Strategy has high quality impact - consider adjusting parameters",
                    suggestedParameters: {
                        minSavingsPercentage:
                            (strategy.parameters.minSavingsPercentage || 0.15) +
                            0.05,
                    },
                })
            }
        }

        return recommendations
    }

    /**
     * Reset all strategies to defaults
     */
    public resetToDefaults(): void {
        this.strategies.clear()
        this.initializeDefaultStrategies()
    }

    /**
     * Export strategies configuration
     */
    public exportConfiguration(): Record<string, any> {
        return {
            strategies: Array.from(this.strategies.values()),
            executionOrder: this.executionOrder,
            exportedAt: new Date(),
        }
    }

    /**
     * Import strategies configuration
     */
    public importConfiguration(config: Record<string, any>): boolean {
        if (!config.strategies || !Array.isArray(config.strategies)) {
            return false
        }

        this.strategies.clear()
        for (const strategy of config.strategies) {
            this.strategies.set(strategy.id, strategy)
        }

        if (config.executionOrder && Array.isArray(config.executionOrder)) {
            this.executionOrder = config.executionOrder
        }

        return true
    }
}

export default StrategyManager
