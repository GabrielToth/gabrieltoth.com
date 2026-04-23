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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {title}
                </h3>
                {onEdit && (
                    <button
                        onClick={onEdit}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                    >
                        {t("completeAccount.step3.edit")}
                    </button>
                )}
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                {Object.entries(data).map(([key, value]) => {
                    if (!value) return null

                    return (
                        <div
                            key={key}
                            className="flex justify-between items-start gap-4"
                        >
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {key}
                            </span>
                            <span className="text-sm text-gray-900 dark:text-white text-right break-words">
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
