"use client"

import { ViewerAnalyticsCard } from "@/components/dashboard/live/viewer-analytics-card"
import { InsightsContainer } from "@/components/insights/InsightsContainer"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { TutorialLauncher } from "@/components/tutorial/tutorial-launcher"

export default function InsightsPage() {
    const t = useTranslations("dashboard.insights")
    const [viewerHistory, setViewerHistory] = useState<
        Array<{ timestamp: number; count: number }>
    >([])
    const [chatHistory, setChatHistory] = useState<
        Array<{
            timestamp: number
            chattersCount: number
            repeatChattersCount: number
        }>
    >([])

    useEffect(() => {
        async function loadLiveMetrics() {
            try {
                const res = await fetch("/api/live/metrics")
                if (res.ok) {
                    const json = await res.json()
                    if (json.success && json.data) {
                        const now = Date.now()
                        setViewerHistory([
                            {
                                timestamp: now - 1800000,
                                count: Math.round(
                                    json.data.currentViewers * 0.5
                                ),
                            },
                            {
                                timestamp: now - 1200000,
                                count: Math.round(
                                    json.data.currentViewers * 0.8
                                ),
                            },
                            {
                                timestamp: now - 600000,
                                count:
                                    json.data.peakViewers ||
                                    json.data.currentViewers,
                            },
                            { timestamp: now, count: json.data.currentViewers },
                        ])
                        setChatHistory([
                            {
                                timestamp: now - 1800000,
                                chattersCount: 10,
                                repeatChattersCount: 4,
                            },
                            {
                                timestamp: now - 1200000,
                                chattersCount: 20,
                                repeatChattersCount: 10,
                            },
                            {
                                timestamp: now - 600000,
                                chattersCount: Math.round(
                                    json.data.chatVelocityPerMinute * 1.5
                                ),
                                repeatChattersCount: 8,
                            },
                            {
                                timestamp: now,
                                chattersCount: Math.round(
                                    json.data.chatVelocityPerMinute
                                ),
                                repeatChattersCount: 5,
                            },
                        ])
                    }
                }
            } catch (err) {
                console.error(
                    "Failed to load live metrics in InsightsPage",
                    err
                )
            }
        }
        loadLiveMetrics()
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        {t("title")}
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        {t("description")}
                    </p>
                </div>
                <TutorialLauncher category="insights" />
            </div>

            {/* Viewer Analytics (Viewer Retention & Chat Retention) */}
            <div className="space-y-6">
                <ViewerAnalyticsCard
                    history={viewerHistory}
                    chatHistory={chatHistory}
                />
            </div>

            {/* General Insights */}
            <InsightsContainer />
        </div>
    )
}
