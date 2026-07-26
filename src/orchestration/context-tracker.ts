import type { Task, ContextBudget } from "./types"
import { createLogger } from "@/lib/logger"

const logger = createLogger("ContextTracker")

const CHARS_PER_TOKEN = 4
const SYSTEM_PROMPT_OVERHEAD = 1000

export class ContextTracker {
    private taskOutputs: Map<string, string> = new Map()
    private modelLimits: Map<string, number> = new Map()

    constructor(modelLimits: Record<string, number>) {
        for (const [model, limit] of Object.entries(modelLimits)) {
            this.modelLimits.set(model, limit)
        }
    }

    recordTaskOutput(taskId: string, output: string): void {
        this.taskOutputs.set(taskId, output)
        logger.debug(
            `Recorded output for task ${taskId}: ${this.estimateTokens(output)} tokens`
        )
    }

    estimateTokens(text: string): number {
        return Math.ceil(text.length / CHARS_PER_TOKEN)
    }

    computeContextBudget(
        task: Task,
        deps: Task[],
        modelLimit: number
    ): ContextBudget {
        const depsTotalTokens = deps.reduce((sum, dep) => {
            const output = this.taskOutputs.get(dep.id) || ""
            return sum + this.estimateTokens(output)
        }, 0)

        const estimatedInputTokens =
            SYSTEM_PROMPT_OVERHEAD +
            this.estimateTokens(task.prompt) +
            depsTotalTokens

        const estimatedOutputTokens = task.estimatedOutputTokens || 4096

        const fits = estimatedInputTokens + estimatedOutputTokens <= modelLimit

        const compressionNeeded: string[] = []
        if (!fits) {
            for (const dep of deps) {
                const output = this.taskOutputs.get(dep.id)
                if (output && this.estimateTokens(output) > 2000) {
                    compressionNeeded.push(dep.id)
                }
            }
        }

        return {
            estimatedInputTokens,
            estimatedOutputTokens,
            depsTotalTokens,
            modelLimit,
            fits,
            compressionNeeded,
        }
    }

    compressOutput(output: string, targetTokens: number): string {
        const currentTokens = this.estimateTokens(output)
        if (currentTokens <= targetTokens) return output

        const targetChars = targetTokens * CHARS_PER_TOKEN
        const summary = output.slice(0, targetChars)
        logger.info(
            `Compressed output from ${currentTokens} to ${targetTokens} tokens`
        )
        return summary + "\n\n[...output compressed...]"
    }

    getTaskOutput(taskId: string): string | undefined {
        return this.taskOutputs.get(taskId)
    }

    getRelevantContext(depIds: string[]): string {
        const contexts = depIds
            .map(depId => {
                const output = this.taskOutputs.get(depId)
                if (!output) return null

                const tokens = this.estimateTokens(output)
                if (tokens > 2000) {
                    return `[${depId}] (compressed)\n${this.compressOutput(output, 2000)}`
                }
                return `[${depId}]\n${output}`
            })
            .filter(Boolean)

        return contexts.join("\n\n")
    }

    clear(): void {
        this.taskOutputs.clear()
        logger.info("Context tracker cleared")
    }
}
