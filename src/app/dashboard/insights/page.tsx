"use client"

import { useTranslations } from "next-intl"

/**
 * Insights Tab Page
 * Displays analytics and performance metrics
 * Shows metrics, graphs, and channel comparisons
 */
export default function InsightsPage() {
    const t = useTranslations("dashboard.insights")

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground dark:text-foreground">
                    {t("title")}
                </h1>
                <p className="mt-2 text-muted-foreground dark:text-muted-foreground">
                    {t("description")}
                </p>
            </div>

            {/* Placeholder for InsightsContainer component */}
            <div className="rounded-lg border border-border bg-white p-8 text-center dark:border-border dark:bg-card">
                <p className="text-muted-foreground dark:text-muted-foreground">
                    {t("comingSoon")}
                </p>
            </div>
        </div>
    )
}
