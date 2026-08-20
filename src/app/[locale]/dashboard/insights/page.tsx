"use client"

import { ViewerAnalyticsCard } from "@/components/dashboard/live/viewer-analytics-card"
import { InsightsContainer } from "@/components/insights/InsightsContainer"
import { useTranslations } from "next-intl"

export default function InsightsPage() {
    const t = useTranslations("dashboard.insights")

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">
                    {t("title")}
                </h1>
                <p className="mt-2 text-muted-foreground">{t("description")}</p>
            </div>

            {/* Viewer Analytics (Viewer Retention & Chat Retention) */}
            <div className="space-y-6">
                <ViewerAnalyticsCard
                    history={[
                        { timestamp: Date.now() - 1800000, count: 45 },
                        { timestamp: Date.now() - 1200000, count: 88 },
                        { timestamp: Date.now() - 600000, count: 112 },
                        { timestamp: Date.now(), count: 95 },
                    ]}
                    chatHistory={[
                        { timestamp: Date.now() - 1800000, chattersCount: 12, repeatChattersCount: 4 },
                        { timestamp: Date.now() - 1200000, chattersCount: 28, repeatChattersCount: 14 },
                        { timestamp: Date.now() - 600000, chattersCount: 35, repeatChattersCount: 20 },
                        { timestamp: Date.now(), chattersCount: 30, repeatChattersCount: 18 },
                    ]}
                />

                <InsightsContainer />
            </div>
        </div>
    )
}
