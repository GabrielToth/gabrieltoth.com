/**
 * Password Strength Indicator Component
 *
 * Displays password requirements and their status (met/unmet).
 * Updates in real-time as the user types.
 *
 * Validates: Requirements 4.8
 */

"use client"

import { useTranslations } from "next-intl"
import { useMemo } from "react"

interface PasswordStrengthProps {
    password: string
}

interface PasswordRequirement {
    label: string
    met: boolean
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
    const t = useTranslations("auth")

    const requirements = useMemo((): PasswordRequirement[] => {
        return [
            {
                label: t("completeAccount.passwordRequirements.minLength"),
                met: password.length >= 8,
            },
            {
                label: t("completeAccount.passwordRequirements.uppercase"),
                met: /[A-Z]/.test(password),
            },
            {
                label: t("completeAccount.passwordRequirements.lowercase"),
                met: /[a-z]/.test(password),
            },
            {
                label: t("completeAccount.passwordRequirements.number"),
                met: /\d/.test(password),
            },
            {
                label: t("completeAccount.passwordRequirements.special"),
                met: /[!@#$%^&*]/.test(password),
            },
        ]
    }, [password, t])

    const allMet = requirements.every(req => req.met)
    const metCount = requirements.filter(req => req.met).length

    return (
        <div className="space-y-3">
            {/* Strength Indicator */}
            <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${
                            metCount === 0
                                ? "w-0 bg-gray-300"
                                : metCount <= 2
                                  ? "w-1/3 bg-red-500"
                                  : metCount <= 4
                                    ? "w-2/3 bg-yellow-500"
                                    : "w-full bg-green-500"
                        }`}
                    />
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {metCount}/{requirements.length}
                </span>
            </div>

            {/* Requirements List */}
            <div className="space-y-2">
                {requirements.map((req, index) => (
                    <div
                        key={index}
                        className="flex items-center gap-2 text-sm"
                    >
                        <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                                req.met
                                    ? "bg-green-100 dark:bg-green-900/30"
                                    : "bg-gray-100 dark:bg-gray-700"
                            }`}
                        >
                            {req.met ? (
                                <svg
                                    className="w-3 h-3 text-green-600 dark:text-green-400"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            ) : (
                                <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full" />
                            )}
                        </div>
                        <span
                            className={`${
                                req.met
                                    ? "text-green-700 dark:text-green-300"
                                    : "text-gray-600 dark:text-gray-400"
                            }`}
                        >
                            {req.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* Status Message */}
            {password && (
                <div
                    className={`text-xs font-medium ${
                        allMet
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-600 dark:text-gray-400"
                    }`}
                >
                    {allMet
                        ? t("completeAccount.passwordRequirements.strong")
                        : t("completeAccount.passwordRequirements.weak")}
                </div>
            )}
        </div>
    )
}
