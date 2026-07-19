"use client"

import { Cloud, Laptop } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Cloud className="h-5 w-5" />
                    {t("storageMode.title")}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => onModeChange("cloud")}
                        disabled={disabled}
                        className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-colors ${
                            mode === "cloud"
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-border text-muted-foreground hover:border-input"
                        } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                    >
                        <Cloud className="h-8 w-8" />
                        <span className="text-sm font-medium">
                            {t("storageMode.cloud")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {t("storageMode.cloudDescription")}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => onModeChange("local")}
                        disabled={disabled}
                        className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-colors ${
                            mode === "local"
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-border text-muted-foreground hover:border-input"
                        } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                    >
                        <Laptop className="h-8 w-8" />
                        <span className="text-sm font-medium">
                            {t("storageMode.local")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {t("storageMode.localDescription")}
                        </span>
                    </button>
                </div>
            </CardContent>
        </Card>
    )
}
