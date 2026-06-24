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
                <h1 className="text-3xl font-bold text-gray-900">
                    {t("title")}
                </h1>
                <p className="mt-2 text-gray-600">{t("description")}</p>
            </div>

            {/* Placeholder for InsightsContainer component */}
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
                <p className="text-gray-500">{t("comingSoon")}</p>
            </div>
        </div>
    )
}
