/**
 * Step 3: Verification Component
 *
 * Displays all collected data in read-only format for final review.
 * Allows editing of individual sections before final submission.
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8
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
            {/* Step Title */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {t("completeAccount.step3.title")}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    {t("completeAccount.step3.description")}
                </p>
            </div>

            {/* Profile Picture */}
            {prefilledData.picture && (
                <div className="flex justify-center">
                    <img
                        src={prefilledData.picture}
                        alt={editedData.name}
                        className="w-20 h-20 rounded-full border-4 border-blue-200 dark:border-blue-800 object-cover"
                    />
                </div>
            )}

            {/* Pre-filled Data Summary */}
            <DataSummary
                title={t("completeAccount.step3.prefilledData")}
                data={{
                    [t("completeAccount.step1.email")]: editedData.email,
                    [t("completeAccount.step1.name")]: editedData.name,
                }}
                onEdit={() => onEditSection("prefilled")}
            />

            {/* New Fields Summary */}
            <DataSummary
                title={t("completeAccount.step3.newFields")}
                data={{
                    [t("completeAccount.step2.password")]: newFields.password
                        ? "••••••••"
                        : "",
                    [t("completeAccount.step2.phone")]: newFields.phone,
                    [t("completeAccount.step2.birthDate")]: newFields.birthDate,
                }}
                onEdit={() => onEditSection("newFields")}
            />

            {/* Info Message */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    {t("completeAccount.step3.info")}
                </p>
            </div>

            {/* Error Message */}
            {errors.submit && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200">
                        {t(`completeAccount.errors.${errors.submit}`)}
                    </p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
                <button
                    onClick={onBack}
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                    {t("completeAccount.back")}
                </button>
                <button
                    onClick={onSubmit}
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 bg-green-600 dark:bg-green-500 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                    {isLoading
                        ? t("completeAccount.loading")
                        : t("completeAccount.step3.complete")}
                </button>
            </div>
        </div>
    )
}
