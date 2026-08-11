"use client"

import { StreamHealthCard } from "@/components/dashboard/live/stream-health-card"
import { ViewerAnalyticsCard } from "@/components/dashboard/live/viewer-analytics-card"
import { useLocale, useTranslations } from "next-intl"

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

            {/* Viewer Analytics + Stream Health */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <StreamHealthCard
                    metrics={{
                        bitrateKbps: 6000,
                        fps: 60,
                        droppedFrames: 0,
                        totalFrames: 12000,
                        latencyMs: 1800,
                        resolution: "1080p60",
                        codec: "h264",
                        timestamp: Date.now(),
                    }}
                />
                <ViewerAnalyticsCard
                    history={[
                        { timestamp: Date.now() - 1800000, count: 45 },
                        { timestamp: Date.now() - 1200000, count: 88 },
                        { timestamp: Date.now() - 600000, count: 112 },
                        { timestamp: Date.now(), count: 95 },
                    ]}
                />
            </div>
        </div>
    )
}
