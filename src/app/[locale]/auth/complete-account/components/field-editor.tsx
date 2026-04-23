/**
 * Field Editor Component
 *
 * Provides inline editing functionality for form fields.
 * Displays save/cancel buttons and validation feedback.
 *
 * Validates: Requirements 4.4, 4.5
 */

"use client"

import { Input } from "@/components/ui/input"
import { useTranslations } from "next-intl"
import { useCallback, useState } from "react"

interface FieldEditorProps {
    label: string
    value: string
    placeholder?: string
    type?: string
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

    const handleSave = useCallback(() => {
        onSave(editValue)
    }, [editValue, onSave])

    const handleCancel = useCallback(() => {
        setEditValue(value)
        onCancel()
    }, [value, onCancel])

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                handleSave()
            } else if (e.key === "Escape") {
                handleCancel()
            }
        },
        [handleSave, handleCancel]
    )

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
            </label>

            <Input
                type={type}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={isLoading}
                aria-invalid={!!error}
                className={error ? "border-red-500 dark:border-red-400" : ""}
            />

            {error && (
                <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                </p>
            )}

            <div className="flex gap-2 pt-2">
                <button
                    onClick={handleSave}
                    disabled={isLoading || editValue === value}
                    className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                    {isLoading
                        ? t("completeAccount.saving")
                        : t("completeAccount.save")}
                </button>
                <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                    {t("completeAccount.cancel")}
                </button>
            </div>
        </div>
    )
}
