"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useTranslations } from "next-intl"
import { CheckCircle, CloudOff, HardDrive, Lock } from "lucide-react"

interface StorageModeStepProps {
    selectedMode: "local" | "cloud"
    onBack: () => void
    onNext: () => void
}

export default function StorageModeStep({
    selectedMode,
    onBack,
    onNext,
}: StorageModeStepProps) {
    const t = useTranslations("publish")

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">{t("step3.title")}</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {t("step3.description")}
                </p>
            </div>

            <div className="grid gap-4">
                {/* Local Storage - Selected & Active */}
                <Card
                    className={`relative overflow-hidden border-2 transition-all ${
                        selectedMode === "local"
                            ? "border-blue-500 ring-2 ring-blue-500/20"
                            : ""
                    }`}
                >
                    <div className="flex items-start gap-4 p-4">
                        <div className="flex-shrink-0 pt-1">
                            <HardDrive className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">
                                    {t("step3.local")}
                                </h3>
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                    <CheckCircle className="h-3 w-3" />
                                    {t("step3.localSelected")}
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                {t("step3.localDescription")}
                            </p>
                            <span className="mt-2 inline-block rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                {t("step3.localRecommended")}
                            </span>
                        </div>
                    </div>
                </Card>

                {/* Cloud Storage - Disabled */}
                <Card className="relative overflow-hidden opacity-60 grayscale">
                    <div className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-black/20">
                        <Lock className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="flex items-start gap-4 p-4">
                        <div className="flex-shrink-0 pt-1">
                            <CloudOff className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg text-gray-500">
                                    {t("step3.cloud")}
                                </h3>
                                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                    <Lock className="h-3 w-3" />
                                    {t("step1.notImplemented")}
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">
                                {t("step3.cloudDescription")}
                            </p>
                            <p className="mt-2 text-xs text-gray-400">
                                {t("step3.cloudUnavailable")}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Navigation */}
            <div className="flex justify-between border-t pt-4 dark:border-gray-700">
                <Button onClick={onBack} variant="outline">
                    {t("wizard.back")}
                </Button>
                <Button onClick={onNext}>{t("wizard.next")}</Button>
            </div>
        </div>
    )
}
