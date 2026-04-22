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
                className="block text-sm font-medium text-gray-900 mb-2"
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
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        error
                            ? "border-red-500 focus:ring-red-200"
                            : isAvailable
                              ? "border-green-500 focus:ring-green-200"
                              : "border-gray-300 focus:ring-blue-200"
                    } ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                    aria-label="Email address"
                    aria-describedby={error ? "email-error" : undefined}
                />
                {isChecking && (
                    <div className="absolute right-3 top-3">
                        <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                    </div>
                )}
                {isAvailable && !isChecking && (
                    <div className="absolute right-3 top-3 text-green-500">
                        ✓
                    </div>
                )}
            </div>
            {error && (
                <p id="email-error" className="mt-1 text-sm text-red-600">
                    {error}
                </p>
            )}
            {isAvailable && (
                <p className="mt-1 text-sm text-green-600">
                    Email is available
                </p>
            )}
        </div>
    )
}
