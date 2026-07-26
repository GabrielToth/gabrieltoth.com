import type { WorkflowDAG, Task, WorkerConfig, AccountConfig } from "./types"
import { DAGExecutor } from "./dag-executor"
import { ContextTracker } from "./context-tracker"
import { AccountPool } from "./account-pool"
import { Worker } from "./worker"
import { createLogger } from "@/lib/logger"
import { readFileSync } from "fs"
import { join } from "path"
import { load as loadYaml } from "js-yaml"

const logger = createLogger("Conductor")

export class Conductor {
    private dagExecutor: DAGExecutor
    private contextTracker: ContextTracker
    private accountPool: AccountPool
    private workerConfigs: WorkerConfig[]
    private workflowTemplates: Map<string, unknown>

    constructor() {
        const configDir = join(process.cwd(), "config", "orchestration")

        const modelsConfig = loadYaml(
            readFileSync(join(configDir, "models.yaml"), "utf-8")
        ) as { task_types: Record<string, unknown> }

        this.workerConfigs = Object.entries(modelsConfig.task_types).map(
            ([type, config]: [string, unknown]) => {
                const c = config as Record<string, unknown>
                return {
                    type: type as WorkerConfig["type"],
                    combo: c.combo as string,
                    maxTokens: c.max_tokens as number,
                    priority: c.priority as number,
                    contextLimit: c.context_limit as number,
                }
            }
        )

        const modelLimits: Record<string, number> = {}
        for (const config of this.workerConfigs) {
            modelLimits[config.combo] = config.contextLimit
        }

        this.contextTracker = new ContextTracker(modelLimits)

        const accountsConfig = loadYaml(
            readFileSync(join(configDir, "accounts.yaml"), "utf-8")
        ) as { accounts: AccountConfig[] }

        this.accountPool = new AccountPool(accountsConfig.accounts)

        this.dagExecutor = new DAGExecutor(
            this.workerConfigs,
            this.contextTracker,
            this.accountPool
        )

        const workflowsConfig = loadYaml(
            readFileSync(join(configDir, "workflows.yaml"), "utf-8")
        ) as Record<string, unknown>

        this.workflowTemplates = new Map(Object.entries(workflowsConfig))

        logger.info("Conductor initialized")
    }

    async execute(
        input: string,
        context?: Record<string, unknown>
    ): Promise<string> {
        const requestType = await this.classifyRequest(input)
        logger.info(`Request classified as: ${requestType}`)

        if (requestType === "question") {
            return this.answerQuestion(input)
        }

        if (requestType === "simple") {
            return this.executeSimpleTask(input)
        }

        const result = await this.executeWorkflow("implement", input, context)
        return this.formatWorkflowResult(result)
    }

    async executeWorkflow(
        workflowName: string,
        input: string,
        context?: Record<string, unknown>
    ): Promise<WorkflowDAG> {
        logger.info(`Starting workflow: ${workflowName}`)

        const template = this.workflowTemplates.get(workflowName)
        if (!template) {
            throw new Error(`Unknown workflow: ${workflowName}`)
        }

        const dag = await this.decomposeWorkflow(
            workflowName,
            input,
            template,
            context
        )

        const result = await this.dagExecutor.execute(dag)

        this.contextTracker.clear()

        logger.info(
            `Workflow ${workflowName} ${result.status} in ${result.updatedAt - result.createdAt}ms`
        )

        return result
    }

    private async classifyRequest(
        input: string
    ): Promise<"question" | "simple" | "complex"> {
        const prompt = `Classify this request into exactly one category:

"${input}"

Categories:
- "question": User is asking for information, explanation, or clarification
- "simple": Single-file change, small bug fix, or straightforward task
- "complex": Multi-step feature, refactoring, or requires documentation + tests + code

Reply with ONLY one word: question, simple, or complex`

        const decomposerConfig = this.workerConfigs.find(
            c => c.type === "decompose"
        )
        if (!decomposerConfig) throw new Error("No decompose worker config")

        const worker = new Worker(decomposerConfig)
        const result = await worker.execute(
            {
                id: "classify",
                type: "decompose",
                deps: [],
                prompt,
                status: "running",
                estimatedInputTokens: 500,
                estimatedOutputTokens: 10,
                retryCount: 0,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            },
            {}
        )

        if (!result.success || !result.result) {
            logger.warn("Classification failed, defaulting to complex")
            return "complex"
        }

        const classification = result.result.toLowerCase().trim()
        if (classification.includes("question")) return "question"
        if (classification.includes("simple")) return "simple"
        return "complex"
    }

    private async answerQuestion(input: string): Promise<string> {
        logger.info("Answering question directly")
        const docsConfig = this.workerConfigs.find(
            c => c.type === "documentation"
        )
        if (!docsConfig) throw new Error("No documentation worker config")

        const worker = new Worker(docsConfig)
        const result = await worker.execute(
            {
                id: "answer",
                type: "documentation",
                deps: [],
                prompt: input,
                status: "running",
                estimatedInputTokens: 1000,
                estimatedOutputTokens: 2000,
                retryCount: 0,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            },
            {}
        )

        if (!result.success || !result.result) {
            throw new Error("Failed to answer question")
        }

        return result.result
    }

    private async executeSimpleTask(input: string): Promise<string> {
        logger.info("Executing simple task")
        const taskType = this.detectTaskType(input)
        const config = this.workerConfigs.find(c => c.type === taskType)
        if (!config) throw new Error(`No config for task type: ${taskType}`)

        const worker = new Worker(config)
        const result = await worker.execute(
            {
                id: "simple-task",
                type: taskType,
                deps: [],
                prompt: input,
                status: "running",
                estimatedInputTokens: 2000,
                estimatedOutputTokens: 5000,
                retryCount: 0,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            },
            {}
        )

        if (!result.success || !result.result) {
            throw new Error("Failed to execute simple task")
        }

        return result.result
    }

    private detectTaskType(input: string): Task["type"] {
        const lower = input.toLowerCase()
        if (
            lower.includes("doc") ||
            lower.includes("readme") ||
            lower.includes("comment")
        ) {
            return "documentation"
        }
        if (lower.includes("test") || lower.includes("spec")) {
            return "test"
        }
        if (lower.includes("review") || lower.includes("check")) {
            return "review"
        }
        return "code"
    }

    private formatWorkflowResult(dag: WorkflowDAG): string {
        const results = dag.tasks
            .filter(t => t.result)
            .map(t => `## ${t.id}\n${t.result}`)
            .join("\n\n")
        return results || "Workflow completed but no results available"
    }

    private async decomposeWorkflow(
        workflowName: string,
        input: string,
        template: unknown,
        context?: Record<string, unknown>
    ): Promise<WorkflowDAG> {
        const t = template as {
            description: string
            steps: Array<{
                id: string
                type: string
                deps: string[]
                prompt?: string
            }>
        }

        const decomposerConfig = this.workerConfigs.find(
            c => c.type === "decompose"
        )
        if (!decomposerConfig) {
            throw new Error("No decompose worker config")
        }

        const decomposer = new Worker(decomposerConfig)

        const decomposePrompt = `Given this high-level task: "${input}"\n\nAnd this workflow template:\n${JSON.stringify(t, null, 2)}\n\nGenerate detailed prompts for each step. Return a JSON object with structure: {steps: [{id, type, deps, prompt, estimatedOutputTokens}]}`

        const decomposeResult = await decomposer.execute(
            {
                id: "decompose",
                type: "decompose",
                deps: [],
                prompt: decomposePrompt,
                status: "running",
                estimatedInputTokens: 2000,
                estimatedOutputTokens: 4000,
                retryCount: 0,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            },
            {}
        )

        if (!decomposeResult.success || !decomposeResult.result) {
            throw new Error("Failed to decompose workflow")
        }

        logger.debug(
            `Decompose result: ${decomposeResult.result.slice(0, 500)}`
        )

        let decomposed: {
            steps: Array<{
                id: string
                type: string
                deps: string[]
                prompt: string
                estimatedOutputTokens: number
            }>
        }
        try {
            const jsonMatch = decomposeResult.result.match(/\{[\s\S]*\}/)
            if (!jsonMatch) {
                throw new Error("No JSON found in response")
            }
            decomposed = JSON.parse(jsonMatch[0])
        } catch (error) {
            logger.error(`Failed to parse: ${decomposeResult.result}`)
            throw new Error(
                `Failed to parse decomposed workflow: ${error instanceof Error ? error.message : String(error)}`
            )
        }

        const tasks: Task[] = decomposed.steps.map(step => ({
            id: step.id,
            type: step.type as Task["type"],
            deps: step.deps,
            prompt: step.prompt,
            status: "pending" as const,
            estimatedInputTokens: 2000,
            estimatedOutputTokens: step.estimatedOutputTokens,
            retryCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }))

        const dag: WorkflowDAG = {
            id: `${workflowName}-${Date.now()}`,
            name: workflowName,
            description: t.description,
            tasks,
            context: context || {},
            status: "pending",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }

        logger.info(
            `Decomposed workflow ${workflowName} into ${tasks.length} tasks`
        )

        return dag
    }

    getAccountStatus(): Record<string, unknown> {
        return this.accountPool.getStatus()
    }
}
