/**
 * Data Summary Component
 *
 * Displays all account information in a read-only format.
 * Used in the verification step to show all collected data.
 *
 * Validates: Requirements 7.1, 7.2
 */

"use client"

import { useTranslations } from "next-intl"

interface DataSummaryProps {
    title: string
    data: Record<string, string | undefined>
    onEdit?: () => void
}

export default function DataSummary({ title, data, onEdit }: DataSummaryProps) {
    const t = useTranslations("auth")

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground dark:text-foreground">
                    {title}
                </h3>
                {onEdit && (
                    <button
                        onClick={onEdit}
                        className="text-primary dark:text-primary hover:text-primary dark:hover:text-primary text-sm font-medium"
                    >
                        {t("completeAccount.step3.edit")}
                    </button>
                )}
            </div>

            <div className="space-y-3 bg-muted dark:bg-card/50 rounded-lg p-4">
                {Object.entries(data).map(([key, value]) => {
                    if (!value) return null

                    return (
                        <div
                            key={key}
                            className="flex justify-between items-start gap-4"
                        >
                            <span className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                                {key}
                            </span>
                            <span className="text-sm text-foreground dark:text-foreground text-right break-words">
                                {key.toLowerCase().includes("password")
                                    ? "••••••••"
                                    : value}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
