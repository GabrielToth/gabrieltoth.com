/**
 * Data Summary Component
 *
 * Displays all account data in read-only format.
 * Used in the verification step to show all information before final submission.
 *
 * Validates: Requirements 4.9
 */

"use client"

import { useTranslations } from "next-intl"

interface DataSummaryProps {
    label: string
    data: Record<string, string | undefined>
    onEdit?: () => void
}

export default function DataSummary({ label, data, onEdit }: DataSummaryProps) {
    const t = useTranslations("auth")

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {label}
                </h3>
                {onEdit && (
                    <button
                        type="button"
                        onClick={onEdit}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                    >
                        {t("completeAccount.step3.edit")}
                    </button>
                )}
            </div>

            <div className="space-y-3">
                {Object.entries(data).map(([key, value]) => {
                    if (!value) return null

                    return (
                        <div key={key} className="flex items-start gap-4">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-24">
                                {t(`completeAccount.${key}`)}:
                            </span>
                            <span className="text-sm text-gray-900 dark:text-white break-all">
                                {key === "password"
                                    ? "••••••••"
                                    : key === "picture"
                                      ? "✓ Uploaded"
                                      : value}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
