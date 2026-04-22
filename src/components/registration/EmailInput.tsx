"use client"

import { validateEmail } from "@/lib/validation"
import { useEffect, useState } from "react"

interface EmailInputProps {
    value: string
    onChange: (email: string) => void
    onValidationChange?: (isValid: boolean) => void
    disabled?: boolean
}

export function EmailInput({
    value,
    onChange,
    onValidationChange,
    disabled = false,
}: EmailInputProps) {
    const [isChecking, setIsChecking] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null)

    // Debounced email uniqueness check
    useEffect(() => {
        if (!value) {
            setError(null)
            setIsAvailable(null)
            onValidationChange?.(false)
            return
        }

        const validation = validateEmail(value)
        if (!validation.isValid) {
            setError(validation.error || "Invalid email format")
            setIsAvailable(null)
            onValidationChange?.(false)
            return
        }

        setError(null)

        const timer = setTimeout(async () => {
            setIsChecking(true)
            try {
                const response = await fetch(
                    `/api/auth/check-email?email=${encodeURIComponent(value)}`
                )
                const data = await response.json()

                if (data.success && data.data.available) {
                    setIsAvailable(true)
                    onValidationChange?.(true)
                } else {
                    setError("Email already registered")
                    setIsAvailable(false)
                    onValidationChange?.(false)
                }
            } catch (err) {
                setError("Failed to check email availability")
                setIsAvailable(false)
                onValidationChange?.(false)
            } finally {
                setIsChecking(false)
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [value, onValidationChange])

    return (
        <div className="w-full">
            <label
                htmlFor="email"
                className="block text-sm sm:text-base font-medium text-gray-100 dark:text-gray-100 mb-2"
            >
                Email Address
            </label>
            <div className="relative">
                <input
                    id="email"
                    type="email"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    disabled={disabled}
                    placeholder="you@example.com"
                    className={`w-full px-4 py-3 sm:py-2 text-base sm:text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all min-h-[44px] sm:min-h-auto ${
                        error
                            ? "border-red-500 focus:ring-red-200 dark:border-red-400 dark:focus:ring-red-900"
                            : isAvailable
                              ? "border-green-500 focus:ring-green-200 dark:border-green-400 dark:focus:ring-green-900"
                              : "border-gray-300 dark:border-gray-600 focus:ring-blue-200 dark:focus:ring-blue-900"
                    } ${disabled ? "bg-gray-100 dark:bg-gray-700 cursor-not-allowed" : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"}`}
                    aria-label="Email address"
                    aria-describedby={
                        error
                            ? "email-error"
                            : isAvailable
                              ? "email-success"
                              : undefined
                    }
                    required
                />
                {isChecking && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin h-5 w-5 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full" />
                    </div>
                )}
                {isAvailable && !isChecking && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 dark:text-green-400">
                        ✓
                    </div>
                )}
            </div>
            {error && (
                <p
                    id="email-error"
                    className="mt-2 text-sm text-red-600 dark:text-red-400"
                >
                    {error}
                </p>
            )}
            {isAvailable && (
                <p
                    id="email-success"
                    className="mt-2 text-sm text-green-600 dark:text-green-400"
                >
                    Email is available
                </p>
            )}
        </div>
    )
}
