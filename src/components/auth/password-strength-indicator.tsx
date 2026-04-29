"use client"

/**
 * PasswordStrengthIndicator Component
 * Displays password strength with real-time criteria validation
 * Shows visual feedback for each password requirement
 */

import { Check, X } from "lucide-react"
import { useMemo } from "react"

interface PasswordCriteria {
    id: string
    label: string
    regex: RegExp
    met: boolean
}

interface PasswordStrengthIndicatorProps {
    password: string
    showCriteria?: boolean
}

/**
 * Password strength criteria
 * Requirement: At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
 */
const PASSWORD_CRITERIA: Omit<PasswordCriteria, "met">[] = [
    {
        id: "length",
        label: "At least 8 characters",
        regex: /.{8,}/,
    },
    {
        id: "uppercase",
        label: "At least one uppercase letter (A-Z)",
        regex: /[A-Z]/,
    },
    {
        id: "lowercase",
        label: "At least one lowercase letter (a-z)",
        regex: /[a-z]/,
    },
    {
        id: "number",
        label: "At least one number (0-9)",
        regex: /\d/,
    },
    {
        id: "special",
        label: "At least one special character (!@#$%^&*)",
        regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    },
]

export function PasswordStrengthIndicator({
    password,
    showCriteria = true,
}: PasswordStrengthIndicatorProps) {
    const criteria = useMemo<PasswordCriteria[]>(() => {
        return PASSWORD_CRITERIA.map(criterion => ({
            ...criterion,
            met: criterion.regex.test(password),
        }))
    }, [password])

    const metCount = criteria.filter(c => c.met).length
    const strength = useMemo(() => {
        if (metCount === 0)
            return { level: 0, label: "No password", color: "bg-gray-300" }
        if (metCount === 1)
            return { level: 1, label: "Very weak", color: "bg-red-500" }
        if (metCount === 2)
            return { level: 2, label: "Weak", color: "bg-orange-500" }
        if (metCount === 3)
            return { level: 3, label: "Fair", color: "bg-yellow-500" }
        if (metCount === 4)
            return { level: 4, label: "Good", color: "bg-lime-500" }
        return { level: 5, label: "Strong", color: "bg-green-500" }
    }, [metCount])

    const isValid = criteria.every(c => c.met)

    return (
        <div className="space-y-3">
            {/* Strength Bar */}
            {password && (
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            Password Strength
                        </span>
                        <span
                            className={`text-xs font-semibold ${
                                strength.level === 5
                                    ? "text-green-600 dark:text-green-400"
                                    : strength.level >= 3
                                      ? "text-yellow-600 dark:text-yellow-400"
                                      : "text-red-600 dark:text-red-400"
                            }`}
                        >
                            {strength.label}
                        </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ${strength.color}`}
                            style={{ width: `${(strength.level / 5) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Criteria List */}
            {showCriteria && password && (
                <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Password Requirements:
                    </p>
                    <ul className="space-y-1.5">
                        {criteria.map(criterion => (
                            <li
                                key={criterion.id}
                                className={`flex items-center gap-2 text-xs transition-colors ${
                                    criterion.met
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-gray-500 dark:text-gray-400"
                                }`}
                            >
                                {criterion.met ? (
                                    <Check className="h-4 w-4 shrink-0" />
                                ) : (
                                    <X className="h-4 w-4 shrink-0 opacity-50" />
                                )}
                                <span>{criterion.label}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Validation Status */}
            {password && (
                <div
                    className={`text-xs font-medium transition-colors ${
                        isValid
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-500 dark:text-gray-400"
                    }`}
                >
                    {isValid ? "✓ Password meets all requirements" : ""}
                </div>
            )}
        </div>
    )
}
