import type { Task, WorkerConfig, WorkerResult } from "./types"
import { createLogger } from "@/lib/logger"

const logger = createLogger("Worker")

const OMNIROUTE_API = "http://localhost:20128/v1/chat/completions"

export class Worker {
    private config: WorkerConfig

    constructor(config: WorkerConfig) {
        this.config = config
    }

    async execute(
        task: Task,
        depsOutput: Record<string, string>,
        systemPrompt?: string
    ): Promise<WorkerResult> {
        const startTime = Date.now()

        const messages = [
            {
                role: "system" as const,
                content:
                    systemPrompt ||
                    this.buildSystemPrompt(task.type, depsOutput),
            },
            {
                role: "user" as const,
                content: this.buildUserPrompt(task, depsOutput),
            },
        ]

        try {
            logger.info(
                `Worker executing task ${task.id} (${task.type}) with combo ${this.config.combo}`
            )

            const response = await fetch(OMNIROUTE_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: this.config.combo,
                    messages,
                    max_tokens: this.config.maxTokens,
                    stream: false,
                }),
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(
                    `OmniRoute error ${response.status}: ${errorText}`
                )
            }

            const data = await response.json()
            const result = data.choices?.[0]?.message?.content

            if (!result) {
                throw new Error("Empty response from model")
            }

            const tokensUsed = data.usage?.total_tokens || 0

            logger.info(
                `Worker completed task ${task.id} in ${Date.now() - startTime}ms (${tokensUsed} tokens)`
            )

            return {
                taskId: task.id,
                success: true,
                result,
                tokensUsed,
                model: this.config.combo,
                account: "default",
                retryCount: task.retryCount,
                completedAt: Date.now(),
            }
        } catch (error) {
            logger.error(
                `Worker failed task ${task.id}: ${error instanceof Error ? error.message : String(error)}`
            )
            return {
                taskId: task.id,
                success: false,
                error: error instanceof Error ? error.message : String(error),
                tokensUsed: 0,
                model: this.config.combo,
                account: "default",
                retryCount: task.retryCount,
                completedAt: Date.now(),
            }
        }
    }

    private buildSystemPrompt(
        taskType: string,
        depsOutput: Record<string, string>
    ): string {
        const base = `You are a specialized worker for ${taskType} tasks. Execute the task completely without asking for permission or suggesting phased approaches. Complete the entire task in one response.`

        if (Object.keys(depsOutput).length > 0) {
            return `${base}\n\nYou have access to outputs from previous tasks:\n${Object.entries(
                depsOutput
            )
                .map(([id, output]) => `[${id}]:\n${output}`)
                .join("\n\n")}`
        }

        return base
    }

    private buildUserPrompt(
        task: Task,
        depsOutput: Record<string, string>
    ): string {
        let prompt = task.prompt

        if (Object.keys(depsOutput).length > 0) {
            prompt +=
                "\n\nUse the outputs from previous tasks provided in the system message."
        }

        prompt +=
            "\n\nIMPORTANT: Complete the ENTIRE task in this response. Do not stop early. Do not ask for permission to continue. Execute everything now."

        return prompt
    }
}
