import type { Task, WorkflowDAG, WorkerConfig, RetryStrategy } from "./types"
import { Worker } from "./worker"
import { ContextTracker } from "./context-tracker"
import { AccountPool } from "./account-pool"
import { CheckpointManager } from "./checkpoint-manager"
import { createLogger } from "@/lib/logger"

const logger = createLogger("DAGExecutor")

const MAX_RETRIES = 5
const RETRY_STRATEGIES: RetryStrategy[] = [
    "same_model",
    "different_model",
    "different_account",
    "split",
    "alternative_approach",
]

export class DAGExecutor {
    private workerConfigs: Map<string, WorkerConfig>
    private contextTracker: ContextTracker
    private accountPool: AccountPool
    private workers: Map<string, Worker>
    private checkpointManager: CheckpointManager

    constructor(
        workerConfigs: WorkerConfig[],
        contextTracker: ContextTracker,
        accountPool: AccountPool
    ) {
        this.workerConfigs = new Map(
            workerConfigs.map(c => [c.type, c])
        )
        this.contextTracker = contextTracker
        this.accountPool = accountPool
        this.workers = new Map()
        this.checkpointManager = new CheckpointManager()

        for (const config of workerConfigs) {
            this.workers.set(config.type, new Worker(config))
        }
    }

    async execute(dag: WorkflowDAG): Promise<WorkflowDAG> {
        logger.info(`Starting DAG execution: ${dag.name}`)
        dag.status = "running"
        dag.updatedAt = Date.now()

        const completed = new Set<string>()
        const failed = new Set<string>()

        // Restore completed tasks from checkpoint if resuming
        for (const task of dag.tasks) {
            if (task.status === "completed") {
                completed.add(task.id)
            } else if (task.status === "failed") {
                failed.add(task.id)
            }
        }

        while (completed.size + failed.size < dag.tasks.length) {
            const ready = dag.tasks.filter(
                task =>
                    task.status === "pending" &&
                    task.deps.every(depId => completed.has(depId))
            )

            if (ready.length === 0) {
                const remaining = dag.tasks.filter(
                    task => !completed.has(task.id) && !failed.has(task.id)
                )
                if (remaining.length > 0) {
                    logger.error(
                        `DAG deadlock: ${remaining.length} tasks remaining but none ready`
                    )
                    dag.status = "failed"
                    this.checkpointManager.save(dag)
                    return dag
                }
                break
            }

            logger.info(`${ready.length} tasks ready to execute`)

            await Promise.all(
                ready.map(async task => {
                    try {
                        await this.executeTask(task, dag)
                        completed.add(task.id)
                        
                        // Save checkpoint after each completed task
                        this.checkpointManager.save(dag)
                    } catch (error) {
                        logger.error(
                            `Task ${task.id} failed after all retries: ${error instanceof Error ? error.message : String(error)}`
                        )
                        failed.add(task.id)
                        task.status = "failed"
                        task.error =
                            error instanceof Error
                                ? error.message
                                : String(error)
                        
                        // Save checkpoint on failure too
                        this.checkpointManager.save(dag)
                    }
                })
            )
        }

        if (failed.size > 0) {
            logger.error(`DAG failed: ${failed.size} tasks failed`)
            dag.status = "failed"
        } else {
            logger.info(`DAG completed: ${completed.size} tasks successful`)
            dag.status = "completed"
            // Delete checkpoint when successfully completed
            this.checkpointManager.delete(dag.id)
        }

        dag.updatedAt = Date.now()
        return dag
    }

    resume(dagId: string): Promise<WorkflowDAG> | null {
        const dag = this.checkpointManager.load(dagId)
        if (!dag) {
            logger.error(`No checkpoint found for ${dagId}`)
            return null
        }
        logger.info(`Resuming workflow ${dag.name} from checkpoint`)
        return this.execute(dag)
    }

    private async executeTask(task: Task, dag: WorkflowDAG): Promise<void> {
        logger.info(`Executing task ${task.id} (${task.type})`)
        task.status = "running"
        task.updatedAt = Date.now()

        const deps = dag.tasks.filter(t => task.deps.includes(t.id))
        const depsOutput: Record<string, string> = {}
        for (const dep of deps) {
            const output = this.contextTracker.getTaskOutput(dep.id)
            if (output) {
                depsOutput[dep.id] = output
            }
        }

        // Inject relevant context from dependencies into task prompt
        if (task.deps.length > 0) {
            const contextSummary = this.contextTracker.getRelevantContext(task.deps)
            if (contextSummary) {
                task.prompt = `${task.prompt}\n\n## Context from dependencies:\n${contextSummary}`
            }
        }

        const workerConfig = this.workerConfigs.get(task.type)
        if (!workerConfig) {
            throw new Error(`No worker config for task type ${task.type}`)
        }

        const budget = this.contextTracker.computeContextBudget(
            task,
            deps,
            workerConfig.contextLimit
        )

        if (!budget.fits && budget.compressionNeeded.length > 0) {
            logger.warn(
                `Task ${task.id} exceeds context budget, compressing ${budget.compressionNeeded.length} deps`
            )
            for (const depId of budget.compressionNeeded) {
                const output = depsOutput[depId]
                if (output) {
                    depsOutput[depId] = this.contextTracker.compressOutput(
                        output,
                        2000
                    )
                }
            }
        }

        let lastError: Error | null = null

        for (let retry = 0; retry <= MAX_RETRIES; retry++) {
            task.retryCount = retry

            if (retry > 0) {
                const strategy = RETRY_STRATEGIES[Math.min(retry - 1, RETRY_STRATEGIES.length - 1)]
                task.retryStrategy = strategy
                logger.info(
                    `Retrying task ${task.id} (attempt ${retry}/${MAX_RETRIES}) with strategy: ${strategy}`
                )
                task.status = "retrying"

                if (strategy === "split") {
                    await this.splitTask(task, dag, depsOutput)
                    return
                }

                if (strategy === "alternative_approach") {
                    task.prompt = `ALTERNATIVE APPROACH REQUIRED: The previous approach failed. Try a completely different method to: ${task.prompt}`
                }
            }

            const worker = this.workers.get(task.type)
            if (!worker) {
                throw new Error(`No worker for task type ${task.type}`)
            }

            try {
                const result = await worker.execute(task, depsOutput)

                if (result.success && result.result) {
                    task.status = "completed"
                    task.result = result.result
                    task.actualTokens = result.tokensUsed
                    task.updatedAt = Date.now()

                    this.contextTracker.recordTaskOutput(task.id, result.result)

                    logger.info(
                        `Task ${task.id} completed (${result.tokensUsed} tokens)`
                    )
                    return
                } else {
                    lastError = new Error(result.error || "Unknown error")
                }
            } catch (error) {
                lastError =
                    error instanceof Error
                        ? error
                        : new Error(String(error))
            }

            if (retry < MAX_RETRIES) {
                const delayMs = Math.min(1000 * Math.pow(2, retry), 30000)
                logger.info(`Waiting ${delayMs}ms before retry`)
                await new Promise(resolve => setTimeout(resolve, delayMs))
            }
        }

        throw (
            lastError ||
            new Error(`Task ${task.id} failed after ${MAX_RETRIES} retries`)
        )
    }

    private async splitTask(
        task: Task,
        dag: WorkflowDAG,
        depsOutput: Record<string, string>
    ): Promise<void> {
        logger.info(`Splitting task ${task.id} into child tasks`)

        const decomposer = this.workers.get("decompose")
        if (!decomposer) {
            throw new Error("No decomposer worker available for split")
        }

        const splitPrompt = `Split the following task into 3-5 smaller subtasks. Return a JSON array of subtasks, each with: {id, prompt, estimatedOutputTokens}. Original task: ${task.prompt}`

        const result = await decomposer.execute(
            {
                ...task,
                type: "decompose",
                prompt: splitPrompt,
            },
            depsOutput
        )

        if (!result.success || !result.result) {
            throw new Error("Failed to split task")
        }

        let subtasks: Array<{
            id: string
            prompt: string
            estimatedOutputTokens: number
        }>
        try {
            subtasks = JSON.parse(result.result)
        } catch {
            throw new Error("Failed to parse subtasks JSON")
        }

        const childTasks: Task[] = subtasks.map(st => ({
            id: `${task.id}.${st.id}`,
            type: task.type,
            deps: task.deps,
            prompt: st.prompt,
            status: "pending" as const,
            estimatedInputTokens: 2000,
            estimatedOutputTokens: st.estimatedOutputTokens,
            retryCount: 0,
            parentId: task.id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }))

        dag.tasks.push(...childTasks)
        task.children = childTasks.map(t => t.id)

        logger.info(
            `Task ${task.id} split into ${childTasks.length} child tasks`
        )

        for (const child of childTasks) {
            await this.executeTask(child, dag)
        }

        const childResults = childTasks
            .map(c => this.contextTracker.getTaskOutput(c.id))
            .filter(Boolean)
            .join("\n\n")

        task.status = "completed"
        task.result = childResults
        task.updatedAt = Date.now()
        this.contextTracker.recordTaskOutput(task.id, childResults)

        logger.info(
            `Task ${task.id} completed via child tasks (${childResults.length} chars)`
        )
    }
}
