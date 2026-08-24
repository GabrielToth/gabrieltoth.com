/**
 * ChatExecutionModeToggle Component
 * Sleek, compact toggle switch between Cloud Mode and Local Mode
 */

"use client"

import {
    ExecutionModeSwitch,
    ExecutionMode,
} from "@/components/ui/execution-mode-switch"

export type ChatExecutionMode = ExecutionMode

interface ChatExecutionModeToggleProps {
    mode: ChatExecutionMode
    onChange: (mode: ChatExecutionMode) => void
}

export function ChatExecutionModeToggle({
    mode,
    onChange,
}: ChatExecutionModeToggleProps) {
    return <ExecutionModeSwitch mode={mode} onChange={onChange} />
}
