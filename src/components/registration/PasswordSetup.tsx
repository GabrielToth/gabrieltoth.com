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

    useEffect(() => {
        const isValid = validation.isValid && passwordsMatch
        onValidationChange?.(isValid)

        if (!passwordsMatch && confirmValue) {
            setError("Passwords do not match")
        } else if (!validation.isValid && value) {
            setError(validation.error || "Password does not meet requirements")
        } else {
            setError(null)
        }
    }, [value, confirmValue, validation, passwordsMatch, onValidationChange])

    return (
        <div className="w-full space-y-4">
            {/* Password Input */}
            <div>
                <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-900 mb-2"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                        aria-label="Password"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-600 hover:text-gray-900"
                        aria-label={
                            showPassword ? "Hide password" : "Show password"
                        }
                    >
                        {showPassword ? "Hide" : "Show"}
                    </button>
                </div>
            </div>

            {/* Password Strength Indicator */}
            {value && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
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
                        <span className="text-sm font-medium capitalize text-gray-900">
                            {strength.strength}
                        </span>
                    </div>
                    <p className="text-sm text-gray-600">{strength.feedback}</p>
                </div>
            )}

            {/* Password Requirements */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium text-gray-900">
                    Password Requirements:
                </p>
                <ul className="space-y-1 text-sm">
                    <li
                        className={
                            validation.requirements.minLength
                                ? "text-green-600"
                                : "text-gray-600"
                        }
                    >
                        {validation.requirements.minLength ? "✓" : "○"} At least
                        8 characters
                    </li>
                    <li
                        className={
                            validation.requirements.hasUppercase
                                ? "text-green-600"
                                : "text-gray-600"
                        }
                    >
                        {validation.requirements.hasUppercase ? "✓" : "○"} One
                        uppercase letter
                    </li>
                    <li
                        className={
                            validation.requirements.hasLowercase
                                ? "text-green-600"
                                : "text-gray-600"
                        }
                    >
                        {validation.requirements.hasLowercase ? "✓" : "○"} One
                        lowercase letter
                    </li>
                    <li
                        className={
                            validation.requirements.hasNumber
                                ? "text-green-600"
                                : "text-gray-600"
                        }
                    >
                        {validation.requirements.hasNumber ? "✓" : "○"} One
                        number
                    </li>
                    <li
                        className={
                            validation.requirements.hasSpecial
                                ? "text-green-600"
                                : "text-gray-600"
                        }
                    >
                        {validation.requirements.hasSpecial ? "✓" : "○"} One
                        special character
                    </li>
                </ul>
            </div>

            {/* Confirm Password Input */}
            <div>
                <label
                    htmlFor="confirm"
                    className="block text-sm font-medium text-gray-900 mb-2"
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
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                            error && confirmValue
                                ? "border-red-500 focus:ring-red-200"
                                : passwordsMatch && confirmValue
                                  ? "border-green-500 focus:ring-green-200"
                                  : "border-gray-300 focus:ring-blue-200"
                        }`}
                        aria-label="Confirm password"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-3 text-gray-600 hover:text-gray-900"
                        aria-label={
                            showConfirm ? "Hide password" : "Show password"
                        }
                    >
                        {showConfirm ? "Hide" : "Show"}
                    </button>
                </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {passwordsMatch && confirmValue && (
                <p className="text-sm text-green-600">✓ Passwords match</p>
            )}
        </div>
    )
}
