/**
 * ViewerAnalyticsCard Component
 * Displays viewer metrics, Viewer Retention Rate (Watch Time / Stream Duration), and Chat Retention Rate
 */

"use client"

import {
    calculateViewerRetention,
    ViewerDataPoint,
    ChatDataPoint,
} from "@/lib/live/viewer-analytics"
import { useTranslations } from "next-intl"

interface ViewerAnalyticsCardProps {
    history: ViewerDataPoint[]
    chatHistory?: ChatDataPoint[]
}

export function ViewerAnalyticsCard({
    history,
    chatHistory,
}: ViewerAnalyticsCardProps) {
    const stats = calculateViewerRetention(history, chatHistory)
    const t = useTranslations("dashboard.insights.viewer")

    return (
        <div className="rounded-xl border border-neutral-800 bg-background p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="text-sm font-semibold text-neutral-200">
                    {t("title")}
                </h3>
                <span className="text-xs font-mono text-neutral-400">
                    {t("duration")}: {stats.durationMinutes}m
                </span>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded-lg bg-card p-2.5">
                    <p className="text-neutral-400">{t("peakViewers")}</p>
                    <p className="mt-1 text-sm font-bold text-emerald-400">
                        {stats.peakViewers}
                    </p>
                </div>
                <div className="rounded-lg bg-card p-2.5">
                    <p className="text-neutral-400">{t("averageViewers")}</p>
                    <p className="mt-1 text-sm font-bold text-sky-400">
                        {stats.averageViewers}
                    </p>
                </div>
                <div className="rounded-lg bg-card p-2.5">
                    <p
                        className="text-neutral-400"
                        title="Tempo assistido / Tempo total de live"
                    >
                        {t("viewerRetention")}
                    </p>
                    <p className="mt-1 text-sm font-bold text-indigo-400">
                        {stats.viewerRetentionRate}%
                    </p>
                </div>
                <div className="rounded-lg bg-card p-2.5">
                    <p
                        className="text-neutral-400"
                        title="Retenção de participantes no chat"
                    >
                        {t("chatRetention")}
                    </p>
                    <p className="mt-1 text-sm font-bold text-purple-400">
                        {stats.chatRetentionRate}%
                    </p>
                </div>
            </div>
        </div>
    )
}
