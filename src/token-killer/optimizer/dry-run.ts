/**
 * Dry-Run Mode
 *
 * Executes optimization strategies without applying changes,
 * calculates estimated savings, and validates accuracy.
 */

import ContextPruner from "./context-pruner"
import ResponseCompressor from "./response-compressor"
import StrategyManager from "./strategy-manager"

/**
 * Dry-run execution result
 */
export interface DryRunExecutionResult {
    originalTokens: number
    estimatedTokensAfter: number
    estimatedTokensSaved: number
    estimatedSavingsPercentage: number
    strategies: Array<{
        name: string
        type: string
        enabled: boolean
        estimatedTokensSaved: number
        estimatedSavingsPercentage: number
        originalTokens: number
        resultingTokens: number
    }>
    accuracy: number // percentage (how close estimate is to actual)
    executionTime: number // milliseconds
    timestamp: Date
}

/**
 * Dry-run validation result
 */
export interface DryRunValidationResult {
    isAccurate: boolean
    accuracyPercentage: number
    withinThreshold: boolean
    threshold: number // 5% default
    estimatedTokens: number
    actualTokens: number
    difference: number
    differencePercentage: number
    recommendations: string[]
}

/**
 * Dry-Run Engine
 */
export class DryRunEngine {
    private contextPruner: ContextPruner
    private responseCompressor: ResponseCompressor
    private strategyManager: StrategyManager
    private accuracyThreshold = 0.05 // 5% threshold

    constructor(
        contextPruner?: ContextPruner,
        responseCompressor?: ResponseCompressor,
        strategyManager?: StrategyManager
    ) {
        this.contextPruner = contextPruner || new ContextPruner()
        this.responseCompressor = responseCompressor || new ResponseCompressor()
        this.strategyManager = strategyManager || new StrategyManager()
    }

    /**
     * Execute dry-run for context pruning
     */
    private dryRunContextPruning(context: string): {
        estimatedTokensSaved: number
        estimatedSavingsPercentage: number
        originalTokens: number
        resultingTokens: number
    } {
        const result = this.contextPruner.getRecommendations(context)

        return {
            estimatedTokensSaved: result.tokensSaved,
            estimatedSavingsPercentage: result.savingsPercentage,
            originalTokens: result.originalTokens,
            resultingTokens: result.prunedTokens,
        }
    }

    /**
     * Execute dry-run for response compression
     */
    private dryRunResponseCompression(response: string): {
        estimatedTokensSaved: number
        estimatedSavingsPercentage: number
        originalTokens: number
        resultingTokens: number
    } {
        const result = this.responseCompressor.getRecommendations(response)

        return {
            estimatedTokensSaved: result.tokensSaved,
            estimatedSavingsPercentage: result.savingsPercentage,
            originalTokens: result.originalTokens,
            resultingTokens: result.compressedTokens,
        }
    }

    /**
     * Execute dry-run for all enabled strategies
     */
    public executeDryRun(
        originalTokens: number,
        context?: string,
        response?: string
    ): DryRunExecutionResult {
        const startTime = Date.now()
        const enabledStrategies = this.strategyManager.getEnabledStrategies()
        const strategyResults = []

        let currentTokens = originalTokens

        for (const strategy of enabledStrategies) {
            let strategyResult = {
                name: strategy.name,
                type: strategy.type,
                enabled: true,
                estimatedTokensSaved: 0,
                estimatedSavingsPercentage: 0,
                originalTokens: currentTokens,
                resultingTokens: currentTokens,
            }

            // Execute strategy-specific dry-run
            if (strategy.type === "pruning" && context) {
                const result = this.dryRunContextPruning(context)
                strategyResult.estimatedTokensSaved =
                    result.estimatedTokensSaved
                strategyResult.estimatedSavingsPercentage =
                    result.estimatedSavingsPercentage
                strategyResult.resultingTokens = result.resultingTokens
                currentTokens = result.resultingTokens
            } else if (strategy.type === "compression" && response) {
                const result = this.dryRunResponseCompression(response)
                strategyResult.estimatedTokensSaved =
                    result.estimatedTokensSaved
                strategyResult.estimatedSavingsPercentage =
                    result.estimatedSavingsPercentage
                strategyResult.resultingTokens = result.resultingTokens
                currentTokens = result.resultingTokens
            } else {
                // For other strategies, use estimated savings
                const estimatedSavings =
                    currentTokens * strategy.estimatedSavings
                strategyResult.estimatedTokensSaved = estimatedSavings
                strategyResult.estimatedSavingsPercentage =
                    strategy.estimatedSavings
                strategyResult.resultingTokens =
                    currentTokens - estimatedSavings
                currentTokens = strategyResult.resultingTokens
            }

            strategyResults.push(strategyResult)
        }

        const estimatedTokensSaved = originalTokens - currentTokens
        const estimatedSavingsPercentage =
            originalTokens > 0 ? estimatedTokensSaved / originalTokens : 0

        const executionTime = Date.now() - startTime

        return {
            originalTokens,
            estimatedTokensAfter: currentTokens,
            estimatedTokensSaved,
            estimatedSavingsPercentage,
            strategies: strategyResults,
            accuracy: 0.85, // 85% estimated accuracy for dry-run
            executionTime,
            timestamp: new Date(),
        }
    }

    /**
     * Validate dry-run accuracy against actual results
     */
    public validateAccuracy(
        dryRunResult: DryRunExecutionResult,
        actualTokensAfter: number
    ): DryRunValidationResult {
        const estimatedTokens = dryRunResult.estimatedTokensAfter
        const difference = Math.abs(estimatedTokens - actualTokensAfter)
        const differencePercentage =
            dryRunResult.originalTokens > 0
                ? difference / dryRunResult.originalTokens
                : 0

        const isAccurate = differencePercentage <= this.accuracyThreshold
        const accuracyPercentage = Math.max(0, 1 - differencePercentage)

        const recommendations: string[] = []

        if (!isAccurate) {
            if (differencePercentage > 0.1) {
                recommendations.push(
                    "Dry-run accuracy is significantly off. Consider recalibrating strategy parameters."
                )
            }

            if (actualTokensAfter > estimatedTokens) {
                recommendations.push(
                    "Actual tokens are higher than estimated. Strategies may be less effective than expected."
                )
            } else {
                recommendations.push(
                    "Actual tokens are lower than estimated. Strategies are more effective than expected."
                )
            }
        } else {
            recommendations.push(
                "Dry-run accuracy is within acceptable threshold."
            )
        }

        return {
            isAccurate,
            accuracyPercentage,
            withinThreshold: isAccurate,
            threshold: this.accuracyThreshold,
            estimatedTokens,
            actualTokens: actualTokensAfter,
            difference,
            differencePercentage,
            recommendations,
        }
    }

    /**
     * Generate dry-run report
     */
    public generateReport(dryRunResult: DryRunExecutionResult): string {
        const lines: string[] = []

        lines.push("=".repeat(60))
        lines.push("DRY-RUN OPTIMIZATION REPORT")
        lines.push("=".repeat(60))
        lines.push("")

        lines.push("SUMMARY")
        lines.push("-".repeat(60))
        lines.push(
            `Original Tokens:        ${dryRunResult.originalTokens.toLocaleString()}`
        )
        lines.push(
            `Estimated After:        ${dryRunResult.estimatedTokensAfter.toLocaleString()}`
        )
        lines.push(
            `Estimated Savings:      ${dryRunResult.estimatedTokensSaved.toLocaleString()} tokens`
        )
        lines.push(
            `Savings Percentage:     ${(dryRunResult.estimatedSavingsPercentage * 100).toFixed(2)}%`
        )
        lines.push(
            `Estimated Accuracy:     ${(dryRunResult.accuracy * 100).toFixed(1)}%`
        )
        lines.push(`Execution Time:         ${dryRunResult.executionTime}ms`)
        lines.push("")

        lines.push("STRATEGY BREAKDOWN")
        lines.push("-".repeat(60))
        for (const strategy of dryRunResult.strategies) {
            lines.push(`${strategy.name}:`)
            lines.push(`  Type:                 ${strategy.type}`)
            lines.push(`  Enabled:              ${strategy.enabled}`)
            lines.push(
                `  Original Tokens:      ${strategy.originalTokens.toLocaleString()}`
            )
            lines.push(
                `  Resulting Tokens:     ${strategy.resultingTokens.toLocaleString()}`
            )
            lines.push(
                `  Estimated Savings:    ${strategy.estimatedTokensSaved.toLocaleString()} tokens`
            )
            lines.push(
                `  Savings Percentage:   ${(strategy.estimatedSavingsPercentage * 100).toFixed(2)}%`
            )
            lines.push("")
        }

        lines.push("NOTES")
        lines.push("-".repeat(60))
        lines.push("• This is a dry-run estimate. Actual results may vary.")
        lines.push("• Accuracy improves with more historical data.")
        lines.push("• Strategy combinations may have diminishing returns.")
        lines.push("")

        lines.push("TIMESTAMP")
        lines.push("-".repeat(60))
        lines.push(dryRunResult.timestamp.toISOString())
        lines.push("")

        return lines.join("\n")
    }

    /**
     * Generate validation report
     */
    public generateValidationReport(
        validation: DryRunValidationResult
    ): string {
        const lines: string[] = []

        lines.push("=".repeat(60))
        lines.push("DRY-RUN VALIDATION REPORT")
        lines.push("=".repeat(60))
        lines.push("")

        lines.push("ACCURACY ASSESSMENT")
        lines.push("-".repeat(60))
        lines.push(
            `Status:                 ${validation.isAccurate ? "✓ ACCURATE" : "✗ INACCURATE"}`
        )
        lines.push(
            `Accuracy Percentage:    ${(validation.accuracyPercentage * 100).toFixed(2)}%`
        )
        lines.push(
            `Within Threshold:       ${validation.withinThreshold ? "Yes" : "No"} (${(validation.threshold * 100).toFixed(1)}%)`
        )
        lines.push("")

        lines.push("COMPARISON")
        lines.push("-".repeat(60))
        lines.push(
            `Estimated Tokens:       ${validation.estimatedTokens.toLocaleString()}`
        )
        lines.push(
            `Actual Tokens:          ${validation.actualTokens.toLocaleString()}`
        )
        lines.push(
            `Difference:             ${validation.difference.toLocaleString()} tokens`
        )
        lines.push(
            `Difference Percentage:  ${(validation.differencePercentage * 100).toFixed(2)}%`
        )
        lines.push("")

        lines.push("RECOMMENDATIONS")
        lines.push("-".repeat(60))
        for (const rec of validation.recommendations) {
            lines.push(`• ${rec}`)
        }
        lines.push("")

        return lines.join("\n")
    }

    /**
     * Set accuracy threshold
     */
    public setAccuracyThreshold(threshold: number): void {
        if (threshold < 0 || threshold > 1) {
            throw new Error("Accuracy threshold must be between 0 and 1")
        }
        this.accuracyThreshold = threshold
    }

    /**
     * Get accuracy threshold
     */
    public getAccuracyThreshold(): number {
        return this.accuracyThreshold
    }
}

export default DryRunEngine
