/**
 * Step 1: Pre-filled Data Component
 *
 * Displays pre-filled data from OAuth provider with edit functionality.
 * Allows users to review and modify email and name before proceeding.
 *
 * Validates: Requirements 4.3, 4.4
 */

"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"
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

    const handleEditField = (field: "email" | "name") => {
        setEditingField(field)
    }

    const handleSaveField = (field: "email" | "name", value: string) => {
        onUpdateField(field, value)
        setEditingField(null)
    }

    const handleCancelEdit = () => {
        setEditingField(null)
    }

    return (
        <div className="space-y-6">
            <p className="text-gray-600 dark:text-gray-400">
                {t("completeAccount.step1.description")}
            </p>

            {/* Profile Picture */}
            {prefilledData.picture && (
                <div className="flex justify-center">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-200 dark:border-blue-800">
                        <img
                            src={prefilledData.picture}
                            alt={prefilledData.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            )}

            {/* Email Field */}
            <div className="space-y-3">
                {editingField === "email" ? (
                    <FieldEditor
                        label={t("completeAccount.step1.email")}
                        value={editedData.email}
                        type="email"
                        placeholder={t(
                            "completeAccount.step1.emailPlaceholder"
                        )}
                        error={errors.email}
                        onSave={value => handleSaveField("email", value)}
                        onCancel={handleCancelEdit}
                        isLoading={isLoading}
                    />
                ) : (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t("completeAccount.step1.email")}
                            </label>
                            <p className="text-gray-900 dark:text-white">
                                {editedData.email}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleEditField("email")}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm"
                        >
                            {t("completeAccount.step1.edit")}
                        </button>
                    </div>
                )}
                {errors.email && !editingField && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                        {errors.email}
                    </p>
                )}
            </div>

            {/* Name Field */}
            <div className="space-y-3">
                {editingField === "name" ? (
                    <FieldEditor
                        label={t("completeAccount.step1.name")}
                        value={editedData.name}
                        type="text"
                        placeholder={t("completeAccount.step1.namePlaceholder")}
                        error={errors.name}
                        onSave={value => handleSaveField("name", value)}
                        onCancel={handleCancelEdit}
                        isLoading={isLoading}
                    />
                ) : (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t("completeAccount.step1.name")}
                            </label>
                            <p className="text-gray-900 dark:text-white">
                                {editedData.name}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleEditField("name")}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm"
                        >
                            {t("completeAccount.step1.edit")}
                        </button>
                    </div>
                )}
                {errors.name && !editingField && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                        {errors.name}
                    </p>
                )}
            </div>

            {/* Continue Button */}
            <button
                type="button"
                onClick={onContinue}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
                {isLoading
                    ? t("completeAccount.loading")
                    : t("completeAccount.step1.continue")}
            </button>
        </div>
    )
}
