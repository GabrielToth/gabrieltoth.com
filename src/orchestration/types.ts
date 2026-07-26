export type TaskType =
    | "decompose"
    | "documentation"
    | "test"
    | "code"
    | "review"
    | "merge"
    | "research"
    | "analyze"
    | "fix"
    | "bug-hunt"

export type TaskStatus =
    "pending" | "running" | "completed" | "failed" | "retrying"

export type RetryStrategy =
    | "same_model"
    | "different_model"
    | "different_account"
    | "split"
    | "alternative_approach"

export interface Task {
    id: string
    type: TaskType
    deps: string[]
    prompt: string
    systemPrompt?: string
    status: TaskStatus
    result?: string
    error?: string
    estimatedInputTokens: number
    estimatedOutputTokens: number
    actualTokens?: number
    retryCount: number
    retryStrategy?: RetryStrategy
    parentId?: string
    children?: string[]
    createdAt: number
    updatedAt: number
}

export interface WorkflowDAG {
    id: string
    name: string
    description: string
    tasks: Task[]
    context: Record<string, unknown>
    status: TaskStatus
    createdAt: number
    updatedAt: number
}

export interface WorkerConfig {
    type: TaskType
    combo: string
    maxTokens: number
    priority: number
    contextLimit: number
}

export interface AccountConfig {
    provider: string
    accountId: string
    models: string[]
    usedTokens: number
    tokenLimit: number
    status: "ok" | "rate_limited" | "paused" | "error"
    lastUsedAt?: number
}

export interface ContextBudget {
    estimatedInputTokens: number
    estimatedOutputTokens: number
    depsTotalTokens: number
    modelLimit: number
    fits: boolean
    compressionNeeded: string[]
}

export interface BugHuntConfig {
    name: string
    schedule: string
    maxPages: number
    actions: BugHuntAction[]
    onError: ErrorAction[]
}

export type BugHuntAction =
    | { type: "navigate"; url: string }
    | { type: "click_all_links" }
    | { type: "fill_random_forms" }
    | { type: "check_console_errors" }
    | { type: "check_responsive"; sizes: number[] }
    | { type: "check_contrast" }
    | { type: "check_overlapping_elements" }
    | { type: "test_empty_states" }
    | { type: "test_error_boundaries" }
    | { type: "test_input_validation" }

export type ErrorAction =
    | { type: "screenshot" }
    | { type: "capture_console" }
    | { type: "capture_network_logs" }
    | { type: "create_issue" }

export interface WorkerResult {
    taskId: string
    success: boolean
    result?: string
    error?: string
    tokensUsed: number
    model: string
    account: string
    retryCount: number
    completedAt: number
}
