/**
 * Step 2: New Required Fields Component
 *
 * Collects password, phone number, and birth date.
 * Displays real-time validation and password strength indicator.
 *
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8
 */

"use client"

import { Input } from "@/components/ui/input"
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

    const isFormValid =
        newFields.password &&
        newFields.phone &&
        newFields.birthDate &&
        !errors.password &&
        !errors.phone &&
        !errors.birthDate

    return (
        <div className="space-y-6">
            {/* Step Title */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {t("completeAccount.step2.title")}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    {t("completeAccount.step2.description")}
                </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
                {/* Password Field */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t("completeAccount.step2.password")}
                    </label>
                    <Input
                        type="password"
                        value={newFields.password}
                        onChange={e =>
                            onUpdateField("password", e.target.value)
                        }
                        placeholder={t(
                            "completeAccount.step2.passwordPlaceholder"
                        )}
                        disabled={isLoading}
                        aria-invalid={!!errors.password}
                        className={
                            errors.password
                                ? "border-red-500 dark:border-red-400"
                                : ""
                        }
                    />
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        {t("completeAccount.step2.passwordHint")}
                    </p>
                    {errors.password && (
                        <p className="text-sm text-red-600 dark:text-red-400">
                            {t(`completeAccount.errors.${errors.password}`)}
                        </p>
                    )}

                    {/* Password Strength Indicator */}
                    {newFields.password && (
                        <div className="mt-3">
                            <PasswordStrength password={newFields.password} />
                        </div>
                    )}
                </div>

                {/* Phone Number Field */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t("completeAccount.step2.phone")}
                    </label>
                    <Input
                        type="tel"
                        value={newFields.phone}
                        onChange={e => onUpdateField("phone", e.target.value)}
                        placeholder={t(
                            "completeAccount.step2.phonePlaceholder"
                        )}
                        disabled={isLoading}
                        aria-invalid={!!errors.phone}
                        className={
                            errors.phone
                                ? "border-red-500 dark:border-red-400"
                                : ""
                        }
                    />
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        {t("completeAccount.step2.phoneHint")}
                    </p>
                    {errors.phone && (
                        <p className="text-sm text-red-600 dark:text-red-400">
                            {t(`completeAccount.errors.${errors.phone}`)}
                        </p>
                    )}
                </div>

                {/* Birth Date Field */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t("completeAccount.step2.birthDate")}
                    </label>
                    <Input
                        type="date"
                        value={newFields.birthDate}
                        onChange={e =>
                            onUpdateField("birthDate", e.target.value)
                        }
                        disabled={isLoading}
                        aria-invalid={!!errors.birthDate}
                        className={
                            errors.birthDate
                                ? "border-red-500 dark:border-red-400"
                                : ""
                        }
                    />
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        {t("completeAccount.step2.birthDateHint")}
                    </p>
                    {errors.birthDate && (
                        <p className="text-sm text-red-600 dark:text-red-400">
                            {t(`completeAccount.errors.${errors.birthDate}`)}
                        </p>
                    )}
                </div>
            </div>

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
                    onClick={onContinue}
                    disabled={isLoading || !isFormValid}
                    className="flex-1 px-4 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                    {isLoading
                        ? t("completeAccount.loading")
                        : t("completeAccount.step2.continue")}
                </button>
            </div>
        </div>
    )
}
