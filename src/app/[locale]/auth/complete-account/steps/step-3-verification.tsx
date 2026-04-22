/**
 * Step 3: Verification Component
 *
 * Displays all account information in read-only format for final review.
 * Allows users to edit sections before final submission.
 *
 * Validates: Requirements 4.5, 7.1
 */

"use client"

import { useTranslations } from "next-intl"
import DataSummary from "../components/data-summary"

interface Step3VerificationProps {
    prefilledData: {
        email: string
        name: string
        picture?: string
    }
    editedData: {
        email: string
        name: string
    }
    newFields: {
        password: string
        phone: string
        birthDate: string
    }
    errors: Record<string, string>
    onEditSection: (section: "prefilled" | "newFields") => void
    onSubmit: () => void
    onBack: () => void
    isLoading?: boolean
}

export default function Step3Verification({
    prefilledData,
    editedData,
    newFields,
    errors,
    onEditSection,
    onSubmit,
    onBack,
    isLoading = false,
}: Step3VerificationProps) {
    const t = useTranslations("auth")

    return (
        <div className="space-y-6">
            <p className="text-gray-600 dark:text-gray-400">
                {t("completeAccount.step3.description")}
            </p>

            {/* Pre-filled Data Summary */}
            <DataSummary
                label={t("completeAccount.step3.prefilledData")}
                data={{
                    email: editedData.email,
                    name: editedData.name,
                    picture: prefilledData.picture ? "✓" : undefined,
                }}
                onEdit={() => onEditSection("prefilled")}
            />

            {/* New Fields Summary */}
            <DataSummary
                label={t("completeAccount.step3.newFields")}
                data={{
                    password: newFields.password ? "••••••••" : undefined,
                    phone: newFields.phone,
                    birthDate: newFields.birthDate,
                }}
                onEdit={() => onEditSection("newFields")}
            />

            {/* Errors Display */}
            {Object.keys(errors).length > 0 && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-800 dark:text-red-200 text-sm font-medium mb-2">
                        {t("completeAccount.errors.validationFailed")}
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                        {Object.entries(errors).map(([field, error]) => (
                            <li
                                key={field}
                                className="text-red-700 dark:text-red-300 text-sm"
                            >
                                {error}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
                <button
                    type="button"
                    onClick={onBack}
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                    {t("completeAccount.back")}
                </button>
                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={isLoading || Object.keys(errors).length > 0}
                    className="flex-1 px-4 py-3 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                    {isLoading
                        ? t("completeAccount.loading")
                        : t("completeAccount.step3.complete")}
                </button>
            </div>

            {/* Info Message */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-blue-800 dark:text-blue-200 text-sm">
                    {t("completeAccount.step3.info")}
                </p>
            </div>
        </div>
    )
}
