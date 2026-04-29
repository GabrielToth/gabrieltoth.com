"use client"

import { calculatePasswordStrength } from "@/lib/auth/password-strength"
import { validatePassword } from "@/lib/validation"
import { useEffect, useState } from "react"

interface PasswordSetupProps {
    value: string
    confirmValue: string
    onChange: (password: string) => void
    onConfirmChange: (confirm: string) => void
    onValidationChange?: (isValid: boolean) => void
    disabled?: boolean
}

export function PasswordSetup({
    value,
    confirmValue,
    onChange,
    onConfirmChange,
    onValidationChange,
    disabled = false,
}: PasswordSetupProps) {
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const validation = validatePassword(value)
    const strength = calculatePasswordStrength(value)
    const passwordsMatch = value && confirmValue && value === confirmValue

    // Update validation state whenever password or confirm password changes
    useEffect(() => {
        // Password is valid only if:
        // 1. Password meets all requirements
        // 2. Confirm password is provided
        // 3. Passwords match
        const isValid = validation.isValid && confirmValue && passwordsMatch

        // Call validation callback immediately
        onValidationChange?.(isValid)

        // Update error message based on current state
        if (!value) {
            // No password entered yet - no error
            setError(null)
        } else if (!validation.isValid) {
            // Password doesn't meet requirements
            setError(validation.error || "Password does not meet requirements")
        } else if (!confirmValue) {
            // Password is valid but confirm password is empty - no error yet
            setError(null)
        } else if (!passwordsMatch) {
            // Passwords don't match
            setError("Passwords do not match")
        } else {
            // Everything is valid
            setError(null)
        }
    }, [value, confirmValue, validation, passwordsMatch, onValidationChange])

    return (
        <div className="w-full space-y-4">
            {/* Password Input */}
            <div>
                <label
                    htmlFor="password"
                    className="block text-sm sm:text-base font-medium text-gray-100 dark:text-gray-100 mb-2"
                >
                    Password
                </label>
                <div className="relative">
                    <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        disabled={disabled}
                        placeholder="Enter a strong password"
                        className={`w-full px-4 py-3 sm:py-2 text-base sm:text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all min-h-[44px] sm:min-h-auto ${
                            value && !validation.isValid
                                ? "border-red-500 focus:ring-red-200 dark:border-red-400 dark:focus:ring-red-900"
                                : value && validation.isValid
                                  ? "border-green-500 focus:ring-green-200 dark:border-green-400 dark:focus:ring-green-900"
                                  : "border-gray-300 dark:border-gray-600 focus:ring-blue-200 dark:focus:ring-blue-900"
                        } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                        aria-label="Password"
                        aria-describedby="password-requirements"
                        aria-invalid={value && !validation.isValid}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 text-sm font-medium min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label={
                            showPassword ? "Hide password" : "Show password"
                        }
                    >
                        {showPassword ? "Hide" : "Show"}
                    </button>
                </div>
                {/* Real-time password validation feedback */}
                {value && !validation.isValid && (
                    <p
                        className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center gap-1"
                        role="alert"
                    >
                        <span className="text-lg">✕</span>
                        {validation.error}
                    </p>
                )}
                {value && validation.isValid && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                        <span className="text-lg">✓</span>
                        Password meets all requirements
                    </p>
                )}
            </div>

            {/* Password Strength Indicator */}
            {value && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all ${
                                    strength.strength === "weak"
                                        ? "bg-red-500 w-1/4"
                                        : strength.strength === "fair"
                                          ? "bg-orange-500 w-1/2"
                                          : strength.strength === "good"
                                            ? "bg-yellow-500 w-3/4"
                                            : "bg-green-500 w-full"
                                }`}
                            />
                        </div>
                        <span className="text-sm font-medium capitalize text-gray-900 dark:text-gray-100">
                            {strength.strength}
                        </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {strength.feedback}
                    </p>
                </div>
            )}

            {/* Password Requirements */}
            <div
                className={`p-4 rounded-lg space-y-2 transition-all ${
                    value && validation.isValid
                        ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                        : value && !validation.isValid
                          ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                          : "bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                }`}
            >
                <p
                    className="text-sm font-medium text-gray-900 dark:text-gray-100"
                    id="password-requirements"
                >
                    Password Requirements:
                </p>
                <ul className="space-y-1 text-sm" role="list">
                    <li
                        className={`transition-colors ${
                            validation.requirements.minLength
                                ? "text-green-600 dark:text-green-400 font-medium"
                                : "text-gray-600 dark:text-gray-400"
                        }`}
                        role="listitem"
                    >
                        {validation.requirements.minLength ? "✓" : "○"} At least
                        8 characters
                    </li>
                    <li
                        className={`transition-colors ${
                            validation.requirements.hasUppercase
                                ? "text-green-600 dark:text-green-400 font-medium"
                                : "text-gray-600 dark:text-gray-400"
                        }`}
                        role="listitem"
                    >
                        {validation.requirements.hasUppercase ? "✓" : "○"} One
                        uppercase letter (A-Z)
                    </li>
                    <li
                        className={`transition-colors ${
                            validation.requirements.hasLowercase
                                ? "text-green-600 dark:text-green-400 font-medium"
                                : "text-gray-600 dark:text-gray-400"
                        }`}
                        role="listitem"
                    >
                        {validation.requirements.hasLowercase ? "✓" : "○"} One
                        lowercase letter (a-z)
                    </li>
                    <li
                        className={`transition-colors ${
                            validation.requirements.hasNumber
                                ? "text-green-600 dark:text-green-400 font-medium"
                                : "text-gray-600 dark:text-gray-400"
                        }`}
                        role="listitem"
                    >
                        {validation.requirements.hasNumber ? "✓" : "○"} One
                        number (0-9)
                    </li>
                    <li
                        className={`transition-colors ${
                            validation.requirements.hasSpecial
                                ? "text-green-600 dark:text-green-400 font-medium"
                                : "text-gray-600 dark:text-gray-400"
                        }`}
                        role="listitem"
                    >
                        {validation.requirements.hasSpecial ? "✓" : "○"} One
                        special character (!@#$%^&*)
                    </li>
                </ul>
            </div>

            {/* Confirm Password Input */}
            <div>
                <label
                    htmlFor="confirm"
                    className="block text-sm sm:text-base font-medium text-gray-100 dark:text-gray-100 mb-2"
                >
                    Confirm Password
                </label>
                <div className="relative">
                    <input
                        id="confirm"
                        type={showConfirm ? "text" : "password"}
                        value={confirmValue}
                        onChange={e => onConfirmChange(e.target.value)}
                        disabled={disabled}
                        placeholder="Confirm your password"
                        className={`w-full px-4 py-3 sm:py-2 text-base sm:text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all min-h-[44px] sm:min-h-auto ${
                            confirmValue && !passwordsMatch
                                ? "border-red-500 focus:ring-red-200 dark:border-red-400 dark:focus:ring-red-900"
                                : confirmValue &&
                                    passwordsMatch &&
                                    validation.isValid
                                  ? "border-green-500 focus:ring-green-200 dark:border-green-400 dark:focus:ring-green-900"
                                  : "border-gray-300 dark:border-gray-600 focus:ring-blue-200 dark:focus:ring-blue-900"
                        } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                        aria-label="Confirm password"
                        aria-invalid={confirmValue && !passwordsMatch}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 text-sm font-medium min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label={
                            showConfirm ? "Hide password" : "Show password"
                        }
                    >
                        {showConfirm ? "Hide" : "Show"}
                    </button>
                </div>
                {/* Real-time confirm password feedback */}
                {confirmValue && !passwordsMatch && (
                    <p
                        className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center gap-1"
                        role="alert"
                    >
                        <span className="text-lg">✕</span>
                        Passwords do not match
                    </p>
                )}
                {confirmValue && passwordsMatch && validation.isValid && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                        <span className="text-lg">✓</span>
                        Passwords match
                    </p>
                )}
            </div>
        </div>
    )
}
