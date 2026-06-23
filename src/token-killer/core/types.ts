/**
 * Core types and interfaces for Token Killer
 */

/**
 * Supported LLM models for token tracking
 */
export type SupportedModel =
    | "claude-haiku-4.5"
    | "gemini-flash-3.1"
    | "cursor-composer-2.0"
    | "gpt-4"
    | "gpt-3.5-turbo"
    | "unknown"

/**
 * Agent types that integrate with Token Killer
 */
export type AgentType = "kiro" | "antigravity" | "cursor" | "gabrieltoth"

/**
 * Token record stored in database
 */
export interface TokenRecord {
    id: string
    requestId: string
    taskId?: string
    agentType: AgentType
    model: SupportedModel
    inputTokens: number
    outputTokens: number
    totalTokens: number
    inputCost: number // USD
    outputCost: number // USD
    totalCost: number // USD
    timestamp: Date
    metadata?: Record<string, any>
    createdAt: Date
}

/**
 * Budget configuration
 */
export interface BudgetConfig {
    id: string
    type: "request" | "task" | "agent"
    name: string
    maxTokens: number
    warningThresholds: {
        yellow: number // percentage
        red: number // percentage
    }
    enabled: boolean
    createdAt: Date
    updatedAt: Date
}

/**
 * Budget usage tracking
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
    budgetId: string
    level: "yellow" | "red" | "critical"
    currentTokens: number
    maxTokens: number
    percentageUsed: number
    timestamp: Date
    message: string
}

/**
 * Optimization strategy
 */
export interface Strategy {
    id: string
    name: string
    type: "pruning" | "compression" | "optimization" | "caching" | "routing"
    enabled: boolean
    priority: number
    parameters: Record<string, any>
    estimatedSavings: number // percentage
    actualSavings: number // percentage (tracked)
    qualityImpact: "none" | "low" | "medium" | "high"
    createdAt: Date
    updatedAt: Date
}

/**
 * Pricing information for a model
 */
export interface PricingInfo {
    model: SupportedModel
    inputPrice: number // USD per 1M tokens
    outputPrice: number // USD per 1M tokens
    currency: "USD" | "BRL"
    lastUpdated: Date
}

/**
 * Token report
 */
export interface TokenReport {
    totalTokens: number
    inputTokens: number
    outputTokens: number
    totalCostUSD: number
    totalCostBRL: number
    byAgent: Record<AgentType, number>
    byModel: Record<SupportedModel, number>
    byRequestType?: Record<string, number>
    timestamp: Date
    period: {
        start: Date
        end: Date
    }
}

/**
 * Dry-run result for optimization strategies
 */
export interface DryRunResult {
    originalTokens: number
    estimatedTokensAfter: number
    estimatedSavings: number
    estimatedSavingsPercentage: number
    strategies: Array<{
        name: string
        estimatedSavings: number
        estimatedSavingsPercentage: number
    }>
    accuracy: number // percentage (how close estimate is to actual)
}

/**
 * Storage statistics
 */
export interface StorageStats {
    totalSize: number // bytes
    recordCount: number
    archivedSize: number // bytes
    archivedRecordCount: number
    lastArchivalDate?: Date
}

/**
 * Archival metadata
 */
export interface ArchiveMetadata {
    id: string
    dataType: string
    originalSize: number
    compressedSize: number
    compressionMethod: "gzip" | "brotli"
    archivedAt: Date
    recordCount: number
}
