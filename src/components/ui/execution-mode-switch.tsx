/**
 * ExecutionModeSwitch Component
 * Minimalist, compact toggle switch between Cloud Mode (Server Infra) and Local Mode (Client Direct)
 */

"use client"

import { Cloud, Laptop } from "lucide-react"

export type ExecutionMode = "cloud" | "local"

interface ExecutionModeSwitchProps {
    mode: ExecutionMode
    onChange: (mode: ExecutionMode) => void
    disabled?: boolean
    compact?: boolean
    showCreditsNotice?: boolean
}

export function ExecutionModeSwitch({
    mode,
    onChange,
    disabled = false,
    compact = false,
}: ExecutionModeSwitchProps) {
    return (
        <div className="inline-flex items-center rounded-full border border-border/80 bg-muted/30 p-0.5 text-xs">
            <button
                type="button"
                onClick={() => onChange("cloud")}
                disabled={disabled}
                className={`flex items-center space-x-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                    mode === "cloud"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                title="Modo Cloud: Processamento na Nuvem (Consome Créditos)"
            >
                <Cloud className="h-3.5 w-3.5" />
                <span>Cloud</span>
            </button>

            <button
                type="button"
                onClick={() => onChange("local")}
                disabled={disabled}
                className={`flex items-center space-x-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                    mode === "local"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                title="Modo Local: Processamento Direto no Computador (Grátis)"
            >
                <Laptop className="h-3.5 w-3.5" />
                <span>Local</span>
            </button>
        </div>
    )
}
