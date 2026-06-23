/**
 * Context Pruning Strategy
 *
 * Intelligently removes non-essential context from requests to reduce token consumption
 * while preserving critical information.
 *
 * Pruning Priority (lowest to highest priority for removal):
 * 1. Old conversations (>8-10 turns)
 * 2. Duplicate messages
 * 3. Unnecessary metadata
 * 4. Old few-shot examples
 * 5. Conversation summaries
 *
 * Preserve List (never prune):
 * - System prompts
 * - Current user query
 * - Critical instructions (marked with <critical> tags)
 * - Active task context
 */

/**
 * Represents a segment of context that can be pruned
 */
interface ContextSegment {
    id: string
    type:
        | "system_prompt"
        | "user_query"
        | "critical_instruction"
        | "task_context"
        | "old_conversation"
        | "duplicate"
        | "metadata"
        | "example"
        | "summary"
    content: string
    tokenCount: number
    priority: number // 0 = highest priority for removal, 5 = never remove
    metadata?: Record<string, any>
}

/**
 * Result of context pruning operation
 */
export interface PruningResult {
    originalTokens: number
    prunedTokens: number
    tokensSaved: number
    savingsPercentage: number
    removedSegments: Array<{
        id: string
        type: string
        tokenCount: number
        reason: string
    }>
    preservedSegments: Array<{
        id: string
        type: string
        tokenCount: number
    }>
    semanticCoherence: number // 0-1 score
    dryRun: boolean
}

/**
 * Context Pruner - Analyzes and removes non-essential context
 */
export class ContextPruner {
    private minSavingsPercentage = 0.15 // 15% minimum savings
    private oldConversationThreshold = 8 // turns

    /**
     * Analyze context and identify segments for potential removal
     */
    private analyzeContext(context: string): ContextSegment[] {
        const segments: ContextSegment[] = []
        let segmentId = 0

        // Split context into logical segments
        const lines = context.split("\n")
        let currentSegment = ""
        let currentType: ContextSegment["type"] = "user_query"

        for (const line of lines) {
            // Detect system prompts
            if (line.includes("system:") || line.includes("System:")) {
                if (currentSegment) {
                    segments.push(
                        this.createSegment(
                            segmentId++,
                            currentType,
                            currentSegment
                        )
                    )
                }
                currentType = "system_prompt"
                currentSegment = line
                continue
            }

            // Detect critical instructions
            if (line.includes("<critical>") || line.includes("[CRITICAL]")) {
                if (currentSegment) {
                    segments.push(
                        this.createSegment(
                            segmentId++,
                            currentType,
                            currentSegment
                        )
                    )
                }
                currentType = "critical_instruction"
                currentSegment = line
                continue
            }

            // Detect task context
            if (
                line.includes("task:") ||
                line.includes("Task:") ||
                line.includes("context:")
            ) {
                if (currentSegment) {
                    segments.push(
                        this.createSegment(
                            segmentId++,
                            currentType,
                            currentSegment
                        )
                    )
                }
                currentType = "task_context"
                currentSegment = line
                continue
            }

            // Detect metadata (JSON, YAML-like structures)
            if (
                line.match(/^\s*{/) ||
                line.match(/^\s*\[/) ||
                line.match(/^\s*\w+:/)
            ) {
                if (currentSegment && currentType !== "metadata") {
                    segments.push(
                        this.createSegment(
                            segmentId++,
                            currentType,
                            currentSegment
                        )
                    )
                }
                currentType = "metadata"
                currentSegment = line
                continue
            }

            currentSegment += (currentSegment ? "\n" : "") + line
        }

        if (currentSegment) {
            segments.push(
                this.createSegment(segmentId++, currentType, currentSegment)
            )
        }

        // Detect duplicates
        this.detectDuplicates(segments)

        // Detect old conversations
        this.detectOldConversations(segments)

        // Detect examples and summaries
        this.detectExamplesAndSummaries(segments)

        return segments
    }

    /**
     * Create a context segment with priority
     */
    private createSegment(
        id: number,
        type: ContextSegment["type"],
        content: string
    ): ContextSegment {
        const tokenCount = this.estimateTokenCount(content)

        // Assign priority based on type (0 = remove first, 5 = never remove)
        const priorityMap: Record<ContextSegment["type"], number> = {
            system_prompt: 5, // Never remove
            user_query: 5, // Never remove
            critical_instruction: 5, // Never remove
            task_context: 5, // Never remove
            old_conversation: 0, // Remove first
            duplicate: 1, // Remove second
            metadata: 2, // Remove third
            example: 3, // Remove fourth
            summary: 4, // Remove fifth
        }

        return {
            id: `segment_${id}`,
            type,
            content,
            tokenCount,
            priority: priorityMap[type],
        }
    }

    /**
     * Detect duplicate messages in context
     */
    private detectDuplicates(segments: ContextSegment[]): void {
        const seen = new Set<string>()

        for (const segment of segments) {
            const normalized = segment.content.toLowerCase().trim()

            if (
                seen.has(normalized) &&
                segment.type !== "system_prompt" &&
                segment.type !== "critical_instruction" &&
                segment.type !== "task_context"
            ) {
                segment.type = "duplicate"
                segment.priority = 1
            }

            seen.add(normalized)
        }
    }

    /**
     * Detect old conversations (>8-10 turns)
     */
    private detectOldConversations(segments: ContextSegment[]): void {
        let turnCount = 0

        for (const segment of segments) {
            if (
                segment.type === "user_query" ||
                segment.content.includes("User:") ||
                segment.content.includes("Assistant:")
            ) {
                turnCount++
            }

            if (
                turnCount > this.oldConversationThreshold &&
                segment.type !== "system_prompt" &&
                segment.type !== "critical_instruction" &&
                segment.type !== "task_context"
            ) {
                segment.type = "old_conversation"
                segment.priority = 0
            }
        }
    }

    /**
     * Detect examples and summaries
     */
    private detectExamplesAndSummaries(segments: ContextSegment[]): void {
        for (const segment of segments) {
            const content = segment.content.toLowerCase()

            if (
                (content.includes("example:") ||
                    content.includes("e.g.") ||
                    content.includes("for example")) &&
                segment.priority > 3
            ) {
                segment.type = "example"
                segment.priority = 3
            }

            if (
                (content.includes("summary:") ||
                    content.includes("summarize") ||
                    content.includes("in summary")) &&
                segment.priority > 4
            ) {
                segment.type = "summary"
                segment.priority = 4
            }
        }
    }

    /**
     * Estimate token count (4 characters ≈ 1 token)
     */
    private estimateTokenCount(text: string): number {
        return Math.ceil(text.length / 4)
    }

    /**
     * Prune context to achieve target savings
     */
    private pruneSegments(
        segments: ContextSegment[],
        targetSavingsPercentage: number
    ): {
        remaining: ContextSegment[]
        removed: ContextSegment[]
    } {
        const totalTokens = segments.reduce(
            (sum, seg) => sum + seg.tokenCount,
            0
        )
        const targetTokensSaved = Math.ceil(
            totalTokens * targetSavingsPercentage
        )

        // Sort by priority (lowest priority first = remove first)
        const sortedSegments = [...segments].sort(
            (a, b) => a.priority - b.priority
        )

        const removed: ContextSegment[] = []
        let tokensSaved = 0

        for (const segment of sortedSegments) {
            // Never remove high-priority segments
            if (segment.priority >= 5) {
                continue
            }

            if (tokensSaved >= targetTokensSaved) {
                break
            }

            removed.push(segment)
            tokensSaved += segment.tokenCount
        }

        const remaining = segments.filter(seg => !removed.includes(seg))

        return { remaining, removed }
    }

    /**
     * Calculate semantic coherence score (0-1)
     * Higher score = better coherence
     */
    private calculateSemanticCoherence(remaining: ContextSegment[]): number {
        // Check if critical elements are preserved
        const hasCritical = remaining.some(seg => seg.priority >= 5)
        const hasUserQuery = remaining.some(seg => seg.type === "user_query")
        const hasSystemPrompt = remaining.some(
            seg => seg.type === "system_prompt"
        )

        let score = 0.5 // Base score

        if (hasCritical) score += 0.2
        if (hasUserQuery) score += 0.2
        if (hasSystemPrompt) score += 0.1

        // Penalize if too much was removed
        const removedPercentage = 1 - remaining.length / (remaining.length + 1)
        if (removedPercentage > 0.5) {
            score -= 0.1
        }

        return Math.max(0, Math.min(1, score))
    }

    /**
     * Reconstruct context from segments
     */
    private reconstructContext(segments: ContextSegment[]): string {
        return segments
            .sort((a, b) => {
                // Preserve order: system prompt first, then critical, then task context, then rest
                const typeOrder: Record<ContextSegment["type"], number> = {
                    system_prompt: 0,
                    critical_instruction: 1,
                    task_context: 2,
                    user_query: 3,
                    old_conversation: 4,
                    duplicate: 5,
                    metadata: 6,
                    example: 7,
                    summary: 8,
                }
                return (typeOrder[a.type] ?? 9) - (typeOrder[b.type] ?? 9)
            })
            .map(seg => seg.content)
            .join("\n\n")
    }

    /**
     * Prune context to reduce token consumption
     *
     * @param context - The context to prune
     * @param dryRun - If true, don't modify context, just return estimates
     * @returns Pruning result with savings information
     */
    public prune(context: string, dryRun = false): PruningResult {
        const originalTokens = this.estimateTokenCount(context)

        // Analyze context into segments
        const segments = this.analyzeContext(context)

        // Prune segments to achieve minimum savings
        const { remaining, removed } = this.pruneSegments(
            segments,
            this.minSavingsPercentage
        )

        const prunedTokens = remaining.reduce(
            (sum, seg) => sum + seg.tokenCount,
            0
        )
        const tokensSaved = originalTokens - prunedTokens
        const savingsPercentage =
            originalTokens > 0 ? tokensSaved / originalTokens : 0

        // Verify we achieved minimum savings
        if (
            savingsPercentage < this.minSavingsPercentage &&
            removed.length > 0
        ) {
            // If not enough savings, remove more segments
            const additionalNeeded = Math.ceil(
                originalTokens * (this.minSavingsPercentage - savingsPercentage)
            )
            let additionalRemoved = 0

            for (const segment of remaining) {
                if (
                    segment.priority < 5 &&
                    additionalRemoved < additionalNeeded
                ) {
                    removed.push(segment)
                    additionalRemoved += segment.tokenCount
                }
            }
        }

        const finalRemaining = segments.filter(seg => !removed.includes(seg))
        const finalPrunedTokens = finalRemaining.reduce(
            (sum, seg) => sum + seg.tokenCount,
            0
        )
        const finalTokensSaved = originalTokens - finalPrunedTokens
        const finalSavingsPercentage =
            originalTokens > 0 ? finalTokensSaved / originalTokens : 0

        const semanticCoherence =
            this.calculateSemanticCoherence(finalRemaining)

        return {
            originalTokens,
            prunedTokens: finalPrunedTokens,
            tokensSaved: finalTokensSaved,
            savingsPercentage: finalSavingsPercentage,
            removedSegments: removed.map(seg => ({
                id: seg.id,
                type: seg.type,
                tokenCount: seg.tokenCount,
                reason: this.getRemovalReason(seg.type),
            })),
            preservedSegments: finalRemaining.map(seg => ({
                id: seg.id,
                type: seg.type,
                tokenCount: seg.tokenCount,
            })),
            semanticCoherence,
            dryRun,
        }
    }

    /**
     * Get human-readable reason for segment removal
     */
    private getRemovalReason(type: ContextSegment["type"]): string {
        const reasons: Record<ContextSegment["type"], string> = {
            old_conversation: "Old conversation (>8-10 turns)",
            duplicate: "Duplicate message",
            metadata: "Unnecessary metadata",
            example: "Old few-shot example",
            summary: "Conversation summary",
            system_prompt: "System prompt (preserved)",
            user_query: "Current user query (preserved)",
            critical_instruction: "Critical instruction (preserved)",
            task_context: "Active task context (preserved)",
        }
        return reasons[type] || "Unknown"
    }

    /**
     * Get pruning recommendations without modifying context
     */
    public getRecommendations(context: string): PruningResult {
        return this.prune(context, true)
    }
}

export default ContextPruner
