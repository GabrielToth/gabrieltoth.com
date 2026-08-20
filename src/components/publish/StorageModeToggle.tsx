"use client"

import { ExecutionModeSwitch } from "@/components/ui/execution-mode-switch"
import { useTranslations } from "next-intl"

export interface StorageModeToggleProps {
    mode: "cloud" | "local"
    onModeChange: (mode: "cloud" | "local") => void
    disabled?: boolean
}

export default function StorageModeToggle({
    mode,
    onModeChange,
    disabled = false,
}: StorageModeToggleProps) {
    const t = useTranslations("publish")

    return (
        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
            <span className="text-xs font-medium text-foreground">
                {t("storageMode.title")}
            </span>
            <ExecutionModeSwitch mode={mode} onChange={onModeChange} disabled={disabled} />
        </div>
    )
}
