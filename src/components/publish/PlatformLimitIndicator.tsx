"use client"

import { Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslations } from "next-intl"
import {
    getPlatformLimit,
    type PlatformLimits,
} from "@/lib/youtube/platform-limits"

export interface PlatformLimitIndicatorProps {
    platforms: string[]
    fileSizeBytes?: number
    durationSeconds?: number
}

function formatBytes(bytes: number): string {
    if (bytes >= 1024 * 1024 * 1024) {
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(0)}GB`
    }
    if (bytes >= 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(0)}MB`
    }
    return `${(bytes / 1024).toFixed(0)}KB`
}

function formatDuration(seconds: number): string {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hrs > 0) return `${hrs}h ${mins}m`
    return `${mins}min`
}

export default function PlatformLimitIndicator({
    platforms,
    fileSizeBytes,
    durationSeconds,
}: PlatformLimitIndicatorProps) {
    const t = useTranslations("publish")

    if (platforms.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center gap-4 py-8 text-center text-muted-foreground">
                    <Info className="h-8 w-8" />
                    <p className="text-sm">
                        {t("platformLimit.selectPlatform")}
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Info className="h-5 w-5" />
                    {t("platformLimit.title")}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {platforms.map(platform => {
                    const limits: PlatformLimits | undefined =
                        getPlatformLimit(platform)
                    if (!limits) return null

                    const exceedsSize =
                        fileSizeBytes != null &&
                        fileSizeBytes > limits.maxFileSizeBytes
                    const exceedsDuration =
                        durationSeconds != null &&
                        durationSeconds > limits.maxDurationSeconds

                    return (
                        <div
                            key={platform}
                            className={`rounded-lg border p-3 ${
                                exceedsSize || exceedsDuration
                                    ? "border-red-200 bg-red-50"
                                    : "border-border"
                            }`}
                        >
                            <h4 className="mb-2 font-medium capitalize">
                                {platform}
                            </h4>
                            <div className="space-y-1 text-sm text-muted-foreground">
                                <p>
                                    {t("platformLimit.maxSize")}:{" "}
                                    {formatBytes(limits.maxFileSizeBytes)}
                                </p>
                                <p>
                                    {t("platformLimit.maxDuration")}:{" "}
                                    {formatDuration(limits.maxDurationSeconds)}
                                </p>
                                <p>
                                    {t("platformLimit.minDuration")}:{" "}
                                    {formatDuration(limits.minDurationSeconds)}
                                </p>
                                <p>
                                    {t("platformLimit.supportedCodecs")}:{" "}
                                    {limits.supportedCodecs.join(", ")}
                                </p>
                                <p>
                                    {t("platformLimit.resolution")}:{" "}
                                    {limits.maxResolution}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    )
}
