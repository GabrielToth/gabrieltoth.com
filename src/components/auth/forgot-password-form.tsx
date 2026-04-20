"use client"

/**
 * ForgotPasswordForm Component
 * Provides password reset request functionality with real-time validation
 * Validates: Requirements 5.1, 5.3, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { validateEmail } from "@/lib/validation"
import { FormEvent, useState } from "react"

interface ForgotPasswordFormProps {
    locale: string
}

interface ValidationErrors {
    email?: string
}

/**
 * ForgotPasswordForm Component
 * Requirement 5.1, 5.3, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 *
 * Features:
 * - Real-time email validation
 * - CSRF token protection
 * - Loading and error states
 * - Generic success message (doesn't reveal if email exists)
 */
export function ForgotPasswordForm({ locale }: ForgotPasswordFormProps) {
    const [email, setEmail] = useState("")
    const [errors, setErrors] = useState<ValidationErrors>({})
    const [touched, setTouched] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [serverError, setServerError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [csrfToken, setCsrfToken] = useState<string | null>(null)

    // Fetch CSRF token on component mount
    useState(() => {
        const fetchCsrfToken = async () => {
            try {
                const response = await fetch("/api/auth/csrf")
                const data = await response.json()
                if (data.success && data.data?.csrfToken) {
                    setCsrfToken(data.data.csrfToken)
                }
            } catch (error) {
                console.error("Failed to fetch CSRF token:", error)
            }
        }
        fetchCsrfToken()
    })

    // Real-time validation for email field
    // Requirement 8.1
    const validateEmailField = (value: string) => {
        const emailValidation = validateEmail(value)

        if (!emailValidation.isValid) {
            return emailValidation.error
        }
        return undefined
    }

    // Handle field change with real-time validation
    // Requirement 8.5, 8.6
    const handleEmailChange = (value: string) => {
        setEmail(value)

        // Only validate if field has been touched
        if (touched) {
            const error = validateEmailField(value)
            setErrors({ email: error })
        }
    }

    // Handle field blur to mark as touched
    const handleEmailBlur = () => {
        setTouched(true)
        const error = validateEmailField(email)
        setErrors({ email: error })
    }

    // Handle form submission
    // Requirement 5.1, 5.3
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setServerError(null)
        setSuccess(false)

        // Mark field as touched
        setTouched(true)

        // Validate email
        const emailError = validateEmailField(email)
        setErrors({ email: emailError })

        // Check if there are any errors
        if (emailError) {
            return
        }

        // Check CSRF token
        if (!csrfToken) {
            setServerError("Security token missing. Please refresh the page.")
            return
        }

        setIsLoading(true)

        try {
            // Submit forgot password request
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                },
                body: JSON.stringify({
                    email,
                    csrfToken,
                }),
            })

            const data = await response.json()

            if (!response.ok || !data.success) {
                setServerError(
                    data.error || "An error occurred. Please try again later."
                )
                return
            }

            // Show generic success message
            // Requirement 5.3 - Don't reveal if email exists
            setSuccess(true)
        } catch (error) {
            console.error("Forgot password error:", error)
            setServerError("An error occurred. Please try again later.")
        } finally {
            setIsLoading(false)
        }
    }

    // Success state
    if (success) {
        return (
            <div
                className="rounded-md bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800"
                role="alert"
            >
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                    Check your email
                </h3>
                <p className="mt-2 text-sm text-green-700 dark:text-green-300">
                    If an account exists with this email, a reset link has been
                    sent. Please check your inbox.
                </p>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Server Error Display */}
            {serverError && (
                <div
                    className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800"
                    role="alert"
                >
                    <p className="text-sm text-red-800 dark:text-red-200">
                        {serverError}
                    </p>
                </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={e => handleEmailChange(e.target.value)}
                    onBlur={handleEmailBlur}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    disabled={isLoading}
                    placeholder="your@email.com"
                />
                {errors.email && (
                    <p
                        id="email-error"
                        className="text-sm text-red-600 dark:text-red-400"
                        role="alert"
                    >
                        {errors.email}
                    </p>
                )}
            </div>

            {/* Submit Button */}
            <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !csrfToken}
            >
                {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>
        </form>
    )
}
