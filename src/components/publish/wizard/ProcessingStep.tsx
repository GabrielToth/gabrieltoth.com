"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useTranslations } from "next-intl"
import {
    CheckCircle,
    Loader2,
    AlertCircle,
    Clock,
    Upload,
    ExternalLink,
} from "lucide-react"
import type { ProcessingState } from "./types"

interface ProcessingStepProps {
    processing: ProcessingState
    onRetry: () => void
    onClose: () => void
    onGoToDashboard: () => void
}

export default function ProcessingStep({
    processing,
    onRetry,
    onClose,
    onGoToDashboard,
}: ProcessingStepProps) {
    const t = useTranslations("publish")

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">{t("step5.title")}</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {t("step5.description")}
                </p>
            </div>

            <Card className="p-8">
                <div className="flex flex-col items-center text-center">
                    {/* State-specific content */}
                    {processing.status === "idle" && (
                        <>
                            <Clock className="h-16 w-16 text-blue-500" />
                            <h3 className="mt-4 text-lg font-semibold">
                                {t("step5.queued")}
                            </h3>
                            <p className="mt-2 text-sm text-gray-500">
                                {t("step5.queuedDescription")}
                            </p>
                            <p className="mt-4 text-xs text-gray-400 italic">
                                {t("step5.waitingForYou")}
                            </p>
                        </>
                    )}

                    {processing.status === "queued" && (
                        <>
                            <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
                            <h3 className="mt-4 text-lg font-semibold">
                                {t("step5.queued")}
                            </h3>
                            <p className="mt-2 text-sm text-gray-500">
                                {t("step5.queuedDescription")}
                            </p>
                        </>
                    )}

                    {processing.status === "uploading" && (
                        <>
                            <Upload className="h-16 w-16 text-blue-500 animate-pulse" />
                            <h3 className="mt-4 text-lg font-semibold">
                                {t("step5.processing")}
                            </h3>
                            <div className="mt-4 w-full max-w-xs">
                                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                                    <div
                                        className="h-full rounded-full bg-blue-500 transition-all duration-500"
                                        style={{
                                            width: `${processing.progress}%`,
                                        }}
                                    />
                                </div>
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                                {t("step5.uploadProgress", {
                                    percent: processing.progress,
                                })}
                            </p>
                            <p className="text-xs text-gray-400">
                                {processing.speed}
                            </p>
                        </>
                    )}

                    {processing.status === "metadata" && (
                        <>
                            <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
                            <h3 className="mt-4 text-lg font-semibold">
                                {t("step5.metadataStep")}
                            </h3>
                        </>
                    )}

                    {processing.status === "publishing" && (
                        <>
                            <Loader2 className="h-16 w-16 animate-spin text-green-500" />
                            <h3 className="mt-4 text-lg font-semibold">
                                {t("step5.publishStep")}
                            </h3>
                        </>
                    )}

                    {processing.status === "complete" && (
                        <>
                            <CheckCircle className="h-16 w-16 text-green-500" />
                            <h3 className="mt-4 text-lg font-semibold text-green-700">
                                {t("step5.complete")}
                            </h3>
                            <p className="mt-2 text-sm text-gray-500">
                                {t("step5.completeDescription")}
                            </p>
                            {processing.url && (
                                <Button
                                    className="mt-4"
                                    variant="outline"
                                    asChild
                                >
                                    <a
                                        href={processing.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        {t("step5.viewOnYoutube")}
                                    </a>
                                </Button>
                            )}
                        </>
                    )}

                    {processing.status === "error" && (
                        <>
                            <AlertCircle className="h-16 w-16 text-red-500" />
                            <h3 className="mt-4 text-lg font-semibold text-red-700">
                                {t("step5.error")}
                            </h3>
                            <p className="mt-2 text-sm text-gray-500">
                                {processing.message ||
                                    t("step5.errorDescription")}
                            </p>
                        </>
                    )}
                </div>
            </Card>

            {/* Actions */}
            <div className="flex justify-center gap-3 border-t pt-4 dark:border-gray-700">
                {processing.status === "error" && (
                    <Button onClick={onRetry} variant="default">
                        {t("step5.retry")}
                    </Button>
                )}
                {processing.status === "complete" && (
                    <Button onClick={onGoToDashboard} variant="default">
                        {t("step5.goToDashboard")}
                    </Button>
                )}
                {(processing.status === "error" ||
                    processing.status === "complete") && (
                    <Button onClick={onClose} variant="outline">
                        {t("step5.close")}
                    </Button>
                )}
            </div>
        </div>
    )
}
