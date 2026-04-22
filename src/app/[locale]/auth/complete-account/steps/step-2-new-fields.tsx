/**
 * Step 2: New Required Fields Component
 *
 * Collects password, phone number, and birth date with real-time validation.
 * Displays password strength indicator and validation messages.
 *
 * Validates: Requirements 4.4, 4.5
 */

"use client"

import { useTranslations } from "next-intl"
import PasswordStrength from "../components/password-strength"

interface Step2NewFieldsProps {
    newFields: {
        password: string
        phone: string
        birthDate: string
    }
    errors: Record<string, string>
    onUpdateField: (
        field: "password" | "phone" | "birthDate",
        value: string
    ) => void
    onContinue: () => void
    onBack: () => void
    isLoading?: boolean
}

export default function Step2NewFields({
    newFields,
    errors,
    onUpdateField,
    onContinue,
    onBack,
    isLoading = false,
}: Step2NewFieldsProps) {
    const t = useTranslations("auth")

    return (
        <div className="space-y-6">
            <p className="text-gray-600 dark:text-gray-400">
                {t("completeAccount.step2.description")}
            </p>

            {/* Password Field */}
            <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("completeAccount.step2.password")}
                </label>
                <input
                    type="password"
                    value={newFields.password}
                    onChange={e => onUpdateField("password", e.target.value)}
                    placeholder={t("completeAccount.step2.passwordPlaceholder")}
                    disabled={isLoading}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                        errors.password
                            ? "border-red-500 dark:border-red-500"
                            : "border-gray-300 dark:border-gray-600"
                    } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                />
                {errors.password && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                        {errors.password}
                    </p>
                )}

                {/* Password Strength Indicator */}
                {newFields.password && (
                    <div className="mt-4">
                        <PasswordStrength password={newFields.password} />
                    </div>
                )}
            </div>

            {/* Phone Number Field */}
            <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("completeAccount.step2.phone")}
                </label>
                <input
                    type="tel"
                    value={newFields.phone}
                    onChange={e => onUpdateField("phone", e.target.value)}
                    placeholder={t("completeAccount.step2.phonePlaceholder")}
                    disabled={isLoading}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                        errors.phone
                            ? "border-red-500 dark:border-red-500"
                            : "border-gray-300 dark:border-gray-600"
                    } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                />
                {errors.phone && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                        {errors.phone}
                    </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("completeAccount.step2.phoneHint")}
                </p>
            </div>

            {/* Birth Date Field */}
            <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("completeAccount.step2.birthDate")}
                </label>
                <input
                    type="date"
                    value={newFields.birthDate}
                    onChange={e => onUpdateField("birthDate", e.target.value)}
                    disabled={isLoading}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                        errors.birthDate
                            ? "border-red-500 dark:border-red-500"
                            : "border-gray-300 dark:border-gray-600"
                    } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                />
                {errors.birthDate && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                        {errors.birthDate}
                    </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("completeAccount.step2.birthDateHint")}
                </p>
            </div>

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
                    onClick={onContinue}
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                    {isLoading
                        ? t("completeAccount.loading")
                        : t("completeAccount.step2.continue")}
                </button>
            </div>
        </div>
    )
}
