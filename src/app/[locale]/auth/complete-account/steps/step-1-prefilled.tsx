/**
 * Step 1: Pre-filled Data Component
 *
 * Displays pre-filled data from OAuth provider and allows editing.
 * Shows email, name, and profile picture.
 *
 * Validates: Requirements 3.3, 3.4, 4.4, 4.5
 */

"use client"

import { useTranslations } from "next-intl"
import { useCallback, useState } from "react"
import FieldEditor from "../components/field-editor"

interface Step1PrefilledProps {
    prefilledData: {
        email: string
        name: string
        picture?: string
    }
    editedData: {
        email: string
        name: string
    }
    errors: Record<string, string>
    onUpdateField: (field: "email" | "name", value: string) => void
    onContinue: () => void
    isLoading?: boolean
}

export default function Step1Prefilled({
    prefilledData,
    editedData,
    errors,
    onUpdateField,
    onContinue,
    isLoading = false,
}: Step1PrefilledProps) {
    const t = useTranslations("auth")
    const [editingField, setEditingField] = useState<"email" | "name" | null>(
        null
    )

    const handleEditField = useCallback((field: "email" | "name") => {
        setEditingField(field)
    }, [])

    const handleSaveField = useCallback(
        (field: "email" | "name", value: string) => {
            onUpdateField(field, value)
            setEditingField(null)
        },
        [onUpdateField]
    )

    const handleCancelEdit = useCallback(() => {
        setEditingField(null)
    }, [])

    return (
        <div className="space-y-6">
            {/* Step Title */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {t("completeAccount.step1.title")}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    {t("completeAccount.step1.description")}
                </p>
            </div>

            {/* Profile Picture */}
            {prefilledData.picture && (
                <div className="flex justify-center">
                    <img
                        src={prefilledData.picture}
                        alt={prefilledData.name}
                        className="w-24 h-24 rounded-full border-4 border-blue-200 dark:border-blue-800 object-cover"
                    />
                </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
                {/* Email Field */}
                {editingField === "email" ? (
                    <FieldEditor
                        label={t("completeAccount.step1.email")}
                        value={editedData.email}
                        placeholder={t(
                            "completeAccount.step1.emailPlaceholder"
                        )}
                        type="email"
                        error={errors.email}
                        onSave={value => handleSaveField("email", value)}
                        onCancel={handleCancelEdit}
                        isLoading={isLoading}
                    />
                ) : (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t("completeAccount.step1.email")}
                        </label>
                        <div className="flex items-center justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                            <span className="text-gray-900 dark:text-white">
                                {editedData.email}
                            </span>
                            <button
                                onClick={() => handleEditField("email")}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                            >
                                {t("completeAccount.step1.edit")}
                            </button>
                        </div>
                        {errors.email && (
                            <p className="text-sm text-red-600 dark:text-red-400">
                                {t(`completeAccount.errors.${errors.email}`)}
                            </p>
                        )}
                    </div>
                )}

                {/* Name Field */}
                {editingField === "name" ? (
                    <FieldEditor
                        label={t("completeAccount.step1.name")}
                        value={editedData.name}
                        placeholder={t("completeAccount.step1.namePlaceholder")}
                        error={errors.name}
                        onSave={value => handleSaveField("name", value)}
                        onCancel={handleCancelEdit}
                        isLoading={isLoading}
                    />
                ) : (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t("completeAccount.step1.name")}
                        </label>
                        <div className="flex items-center justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                            <span className="text-gray-900 dark:text-white">
                                {editedData.name}
                            </span>
                            <button
                                onClick={() => handleEditField("name")}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                            >
                                {t("completeAccount.step1.edit")}
                            </button>
                        </div>
                        {errors.name && (
                            <p className="text-sm text-red-600 dark:text-red-400">
                                {t(`completeAccount.errors.${errors.name}`)}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Continue Button */}
            <button
                onClick={onContinue}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
                {isLoading
                    ? t("completeAccount.loading")
                    : t("completeAccount.step1.continue")}
            </button>
        </div>
    )
}
