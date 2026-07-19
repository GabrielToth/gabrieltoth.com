"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "next-intl"
import { SiYoutube } from "@icons-pack/react-simple-icons"
import {
    CheckCircle,
    Loader2,
    AlertCircle,
    Clock,
    Upload,
    ExternalLink,
    XCircle,
} from "lucide-react"
import type { ProcessingState, PlatformResult } from "./types"

interface ProcessingStepProps {
    processing: ProcessingState
    onRetry: () => void
    onClose: () => void
    onGoToDashboard: () => void
}

/** Platform icons for results */
const PLATFORM_ICONS: Record<string, React.ReactNode> = {
    youtube: <SiYoutube className="h-4 w-4 text-red-600" />,
}

/** Platform display names */
const PLATFORM_NAMES: Record<string, string> = {
    youtube: "YouTube",
    facebook: "Facebook",
    instagram: "Instagram",
    twitter: "Twitter",
    linkedin: "LinkedIn",
}

export default function ProcessingStep({
    processing,
    onRetry,
    onClose,
    onGoToDashboard,
}: ProcessingStepProps) {
    const t = useTranslations("publish")

    const getResultsSummary = (results: PlatformResult[]) => {
        const successCount = results.filter(r => r.success).length
        const failCount = results.filter(r => !r.success).length
        return `${successCount} publicado(s), ${failCount} falha(s)`
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">{t("step7.title")}</h2>
                <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">
                    {t("step7.description")}
                </p>
            </div>

            <Card className="p-8">
                <div className="flex flex-col items-center text-center">
                    {/* Idle state */}
                    {processing.status === "idle" && (
                        <>
                            <Clock className="h-16 w-16 text-primary" />
                            <h3 className="mt-4 text-lg font-semibold">
                                {t("step7.queued")}
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {t("step7.queuedDescription")}
                            </p>
                            <p className="mt-4 text-xs text-muted-foreground italic">
                                {t("step7.waitingForYou")}
                            </p>
                        </>
                    )}

                    {/* Queued */}
                    {processing.status === "queued" && (
                        <>
                            <Loader2 className="h-16 w-16 animate-spin text-primary" />
                            <h3 className="mt-4 text-lg font-semibold">
                                {t("step7.queued")}
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {t("step7.queuedDescription")}
                            </p>
                        </>
                    )}

                    {/* Uploading - show per platform */}
                    {processing.status === "uploading" && (
                        <>
                            <Upload className="h-16 w-16 text-primary animate-pulse" />
                            <h3 className="mt-4 text-lg font-semibold">
                                {t("step7.processing")}
                            </h3>
                            <div className="mt-4 w-full max-w-xs">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    {PLATFORM_ICONS[processing.platformId] ||
                                        null}
                                    <span className="text-sm font-medium capitalize">
                                        {PLATFORM_NAMES[
                                            processing.platformId
                                        ] || processing.platformId}
                                    </span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
                                    <div
                                        className="h-full rounded-full bg-primary/50 transition-all duration-500"
                                        style={{
                                            width: `${processing.progress}%`,
                                        }}
                                    />
                                </div>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {t("step7.uploadProgress", {
                                    percent: processing.progress,
                                })}
                            </p>
                            {processing.speed && (
                                <p className="text-xs text-muted-foreground">
                                    {processing.speed}
                                </p>
                            )}
                        </>
                    )}

                    {/* Metadata */}
                    {processing.status === "metadata" && (
                        <>
                            <Loader2 className="h-16 w-16 animate-spin text-primary" />
                            <h3 className="mt-4 text-lg font-semibold">
                                {t("step7.metadataStep")}
                            </h3>
                            <div className="mt-2 flex items-center gap-2">
                                {PLATFORM_ICONS[processing.platformId] || null}
                                <span className="text-sm capitalize">
                                    {PLATFORM_NAMES[processing.platformId] ||
                                        processing.platformId}
                                </span>
                            </div>
                        </>
                    )}

                    {/* Publishing */}
                    {processing.status === "publishing" && (
                        <>
                            <Loader2 className="h-16 w-16 animate-spin text-green-500" />
                            <h3 className="mt-4 text-lg font-semibold">
                                {t("step7.publishStep")}
                            </h3>
                            <div className="mt-2 flex items-center gap-2">
                                {PLATFORM_ICONS[processing.platformId] || null}
                                <span className="text-sm capitalize">
                                    {PLATFORM_NAMES[processing.platformId] ||
                                        processing.platformId}
                                </span>
                            </div>
                        </>
                    )}

                    {/* Complete */}
                    {processing.status === "complete" && (
                        <>
                            <CheckCircle className="h-16 w-16 text-green-500" />
                            <h3 className="mt-4 text-lg font-semibold text-green-700">
                                {t("step7.complete")}
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {getResultsSummary(processing.results)}
                            </p>
                            {/* Per-platform results */}
                            <div className="mt-4 w-full space-y-2">
                                {processing.results.map(result => (
                                    <div
                                        key={result.platformId}
                                        className="flex items-center justify-between rounded border p-3"
                                    >
                                        <div className="flex items-center gap-2">
                                            {PLATFORM_ICONS[
                                                result.platformId
                                            ] || null}
                                            <span className="text-sm font-medium capitalize">
                                                {PLATFORM_NAMES[
                                                    result.platformId
                                                ] || result.platformId}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {result.success ? (
                                                <>
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                    {result.url && (
                                                        <a
                                                            href={result.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-primary hover:underline"
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                        </a>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="flex items-center gap-1 text-xs text-red-500">
                                                    <XCircle className="h-4 w-4" />
                                                    {result.error || "Failed"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Partial - some succeeded, some failed */}
                    {processing.status === "partial" && (
                        <>
                            <AlertCircle className="h-16 w-16 text-amber-500" />
                            <h3 className="mt-4 text-lg font-semibold text-amber-700">
                                Publicação parcial
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {getResultsSummary(processing.results)}
                            </p>
                            <div className="mt-4 w-full space-y-2">
                                {processing.results.map(result => (
                                    <div
                                        key={result.platformId}
                                        className="flex items-center justify-between rounded border p-3"
                                    >
                                        <div className="flex items-center gap-2">
                                            {PLATFORM_ICONS[
                                                result.platformId
                                            ] || null}
                                            <span className="text-sm font-medium capitalize">
                                                {PLATFORM_NAMES[
                                                    result.platformId
                                                ] || result.platformId}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {result.success ? (
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <span className="flex items-center gap-1 text-xs text-red-500">
                                                    <XCircle className="h-4 w-4" />
                                                    {result.error || "Failed"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Error */}
                    {processing.status === "error" && (
                        <>
                            <AlertCircle className="h-16 w-16 text-red-500" />
                            <h3 className="mt-4 text-lg font-semibold text-red-700">
                                {t("step7.error")}
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {processing.message ||
                                    t("step7.errorDescription")}
                            </p>
                            {processing.platformId && (
                                <Badge variant="outline" className="mt-2">
                                    {PLATFORM_NAMES[processing.platformId] ||
                                        processing.platformId}
                                </Badge>
                            )}
                        </>
                    )}
                </div>
            </Card>

            {/* Actions */}
            <div className="flex justify-center gap-3 border-t pt-4 dark:border-border">
                {(processing.status === "error" ||
                    processing.status === "partial") && (
                    <Button onClick={onRetry} variant="default">
                        {t("step7.retry")}
                    </Button>
                )}
                {(processing.status === "complete" ||
                    processing.status === "partial") && (
                    <Button onClick={onGoToDashboard} variant="default">
                        {t("step7.goToDashboard")}
                    </Button>
                )}
                {(processing.status === "error" ||
                    processing.status === "complete" ||
                    processing.status === "partial") && (
                    <Button onClick={onClose} variant="outline">
                        {t("step7.close")}
                    </Button>
                )}
            </div>
        </div>
    )
}
