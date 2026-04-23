/**
 * Password Strength Component
 *
 * Displays password requirements and their validation status.
 * Updates in real-time as the user types.
 *
 * Validates: Requirements 5.2, 5.3
 */

"use client"

import { useTranslations } from "next-intl"
import { useMemo } from "react"

interface PasswordStrengthProps {
    password: string
}

interface PasswordRequirement {
    key: string
    label: string
    met: boolean
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
    const t = useTranslations("auth")

    const requirements: PasswordRequirement[] = useMemo(() => {
        return [
            {
                key: "minLength",
                label: t("completeAccount.passwordRequirements.minLength"),
                met: password.length >= 8,
            },
            {
                key: "uppercase",
                label: t("completeAccount.passwordRequirements.uppercase"),
                met: /[A-Z]/.test(password),
            },
            {
                key: "lowercase",
                label: t("completeAccount.passwordRequirements.lowercase"),
                met: /[a-z]/.test(password),
            },
            {
                key: "number",
                label: t("completeAccount.passwordRequirements.number"),
                met: /\d/.test(password),
            },
            {
                key: "special",
                label: t("completeAccount.passwordRequirements.special"),
                met: /[!@#$%^&*]/.test(password),
            },
        ]
    }, [password, t])

    const allRequirementsMet = requirements.every(req => req.met)
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
                <span
                    className={`text-xs font-semibold ${
                        allRequirementsMet
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-600 dark:text-gray-400"
                    }`}
                >
                    {metCount}/{requirements.length}
                </span>
            </div>

            {/* Requirements List */}
            <div className="space-y-2">
                {requirements.map(requirement => (
                    <div
                        key={requirement.key}
                        className="flex items-center gap-2 text-sm"
                    >
                        {/* Checkmark Icon */}
                        <div
                            className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                                requirement.met
                                    ? "bg-green-100 dark:bg-green-900/30"
                                    : "bg-gray-100 dark:bg-gray-800"
                            }`}
                        >
                            {requirement.met ? (
                                <svg
                                    className="w-3 h-3 text-green-600 dark:text-green-400"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                    aria-hidden="true"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            ) : (
                                <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full" />
                            )}
                        </div>

                        {/* Requirement Label */}
                        <span
                            className={`transition-colors duration-300 ${
                                requirement.met
                                    ? "text-green-700 dark:text-green-300"
                                    : "text-gray-600 dark:text-gray-400"
                            }`}
                        >
                            {requirement.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
