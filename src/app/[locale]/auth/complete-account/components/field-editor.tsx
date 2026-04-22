/**
 * Field Editor Component
 *
 * Provides inline editing capability for form fields.
 * Includes save/cancel buttons and validation.
 *
 * Validates: Requirements 4.7
 */

"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"

interface FieldEditorProps {
    label: string
    value: string
    placeholder?: string
    type?: "text" | "email" | "password" | "tel" | "date"
    error?: string
    onSave: (value: string) => void
    onCancel: () => void
    isLoading?: boolean
}

export default function FieldEditor({
    label,
    value,
    placeholder,
    type = "text",
    error,
    onSave,
    onCancel,
    isLoading = false,
}: FieldEditorProps) {
    const t = useTranslations("auth")
    const [editValue, setEditValue] = useState(value)

    const handleSave = () => {
        if (editValue.trim()) {
            onSave(editValue)
        }
    }

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
            </label>

            <input
                type={type}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                placeholder={placeholder}
                disabled={isLoading}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                    error
                        ? "border-red-500 dark:border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            />

            {error && (
                <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                </p>
            )}

            <div className="flex gap-2 pt-2">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isLoading || !editValue.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                    {isLoading
                        ? t("completeAccount.saving")
                        : t("completeAccount.save")}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                    {t("completeAccount.cancel")}
                </button>
            </div>
        </div>
    )
}
