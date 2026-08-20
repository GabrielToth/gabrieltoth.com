/**
 * ChatExecutionModeToggle Component
 * Toggle between Cloud Execution Mode (Backend Pooled Sockets / Quota Saver) and Local Mode (Direct Browser Sockets)
 */

"use client"

import { Cloud, Laptop } from "lucide-react"

export type ChatExecutionMode = "cloud" | "local"

interface ChatExecutionModeToggleProps {
    mode: ChatExecutionMode
    onChange: (mode: ChatExecutionMode) => void
}

export function ChatExecutionModeToggle({ mode, onChange }: ChatExecutionModeToggleProps) {
    return (
        <div className="flex items-center rounded-lg border border-border bg-muted/40 p-1 text-xs">
            <button
                type="button"
                onClick={() => onChange("cloud")}
                className={`flex items-center space-x-1.5 rounded-md px-2.5 py-1 font-medium transition-colors ${
                    mode === "cloud"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                }`}
                title="Modo Cloud: 1 conexão por canal no backend (Economiza Quotas & Infraestrutura)"
            >
                <Cloud className="h-3.5 w-3.5" />
                <span>Cloud Mode</span>
            </button>

            <button
                type="button"
                onClick={() => onChange("local")}
                className={`flex items-center space-x-1.5 rounded-md px-2.5 py-1 font-medium transition-colors ${
                    mode === "local"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                }`}
                title="Modo Local: Conexão direta do navegador com as APIs (Zero dependência do servidor)"
            >
                <Laptop className="h-3.5 w-3.5" />
                <span>Local Mode</span>
            </button>
        </div>
    )
}
