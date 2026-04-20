"use client"

/**
 * ResetPasswordForm Component
 * Provides password reset functionality with real-time validation
 * Validates: Requirements 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { validatePassword, validatePasswordMatch } from "@/lib/validation"
import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"

interface ResetPasswordFormProps {
    locale: string
    token: string
}

interface ResetPasswordFormData {
    password: string
    confirmPassword: string
}

interface ValidationErrors {
    password?: string
    confirmPassword?: string
}

/**
 * ResetPasswordForm Component
 * Requirement 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 *
 * Features:
 * - Real-time password validation
 * - Password confirmation matching
 * - CSRF token protection
 * - Loading and error states
 * - Token expiration handling
 * - Redirect to login on success
 */
export function ResetPasswordForm({ locale, token }: ResetPasswordFormProps) {
    const router = useRouter()
    const [formData, setFormData] = useState<ResetPasswordFormData>({
        password: "",
        confirmPassword: "",
    })
    const [errors, setErrors] = useState<ValidationErrors>({})
    const [touched, setTouched] = useState<Record<string, boolean>>({
        password: false,
        confirmPassword: false,
    })
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

    // Real-time validation for password field
    // Requirement 8.2, 5.5
    const validatePasswordField = (value: string) => {
        const passwordValidation = validatePassword(value)

        if (!passwordValidation.isValid) {
            return passwordValidation.error
        }
        return undefined
    }

    // Real-time validation for confirm password field
    // Requirement 8.3
    const validateConfirmPasswordField = (value: string) => {
        const matchValidation = validatePasswordMatch(formData.password, value)

        if (!matchValidation.isValid) {
            return matchValidation.error
        }
        return undefined
    }

    // Handle field change with real-time validation
    // Requirement 8.5, 8.6
    const handleFieldChange = (
        field: keyof ResetPasswordFormData,
        value: string
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }))

        // Only validate if field has been touched
        if (touched[field]) {
            let error: string | undefined

            switch (field) {
                case "password":
                    error = validatePasswordField(value)
                    break
                case "confirmPassword":
                    error = validateConfirmPasswordField(value)
                    break
            }

            setErrors(prev => ({ ...prev, [field]: error }))
        }

        // Also revalidate confirmPassword if password changes
        if (field === "password" && touched.confirmPassword) {
            const confirmError = validatePasswordMatch(
                value,
                formData.confirmPassword
            )
            setErrors(prev => ({
                ...prev,
                confirmPassword: confirmError.isValid
                    ? undefined
                    : confirmError.error,
            }))
        }
    }

    // Handle field blur to mark as touched
    const handleFieldBlur = (field: keyof ResetPasswordFormData) => {
        setTouched(prev => ({ ...prev, [field]: true }))

        // Validate on blur
        let error: string | undefined

        switch (field) {
            case "password":
                error = validatePasswordField(formData.password)
                break
            case "confirmPassword":
                error = validateConfirmPasswordField(formData.confirmPassword)
                break
        }

        setErrors(prev => ({ ...prev, [field]: error }))
    }

    // Handle form submission
    // Requirement 5.4, 5.6, 5.7, 5.8, 5.9
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setServerError(null)

        // Mark all fields as touched
        setTouched({
            password: true,
            confirmPassword: true,
        })

        // Validate all fields
        const passwordError = validatePasswordField(formData.password)
        const confirmPasswordError = validateConfirmPasswordField(
            formData.confirmPassword
        )

        const validationErrors: ValidationErrors = {
            password: passwordError,
            confirmPassword: confirmPasswordError,
        }

        setErrors(validationErrors)

        // Check if there are any errors
        if (Object.values(validationErrors).some(error => error)) {
            return
        }

        // Check CSRF token
        if (!csrfToken) {
            setServerError("Security token missing. Please refresh the page.")
            return
        }

        setIsLoading(true)

        try {
            // Submit password reset
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                },
                body: JSON.stringify({
                    token,
                    password: formData.password,
                    confirmPassword: formData.confirmPassword,
                    csrfToken,
                }),
            })

            const data = await response.json()

            if (!response.ok || !data.success) {
                // Handle expired token specifically
                // Requirement 5.8
                if (
                    data.error?.includes("expired") ||
                    data.error?.includes("invalid")
                ) {
                    setServerError(
                        data.error || "Reset link has expired or is invalid"
                    )
                } else {
                    setServerError(
                        data.error || "An error occurred. Please try again."
                    )
                }
                return
            }

            // Show success and redirect
            // Requirement 5.9
            setSuccess(true)
            setTimeout(() => {
                router.push(`/${locale}/login`)
                router.refresh()
            }, 2000)
        } catch (error) {
            console.error("Reset password error:", error)
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
                    Password reset successfully
                </h3>
                <p className="mt-2 text-sm text-green-700 dark:text-green-300">
                    You can now sign in with your new password. Redirecting to
                    login...
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

            {/* Password Field */}
            <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={e =>
                        handleFieldChange("password", e.target.value)
                    }
                    onBlur={() => handleFieldBlur("password")}
                    aria-invalid={!!errors.password}
                    aria-describedby={
                        errors.password ? "password-error" : undefined
                    }
                    disabled={isLoading}
                    placeholder="Enter new password"
                />
                {errors.password && (
                    <p
                        id="password-error"
                        className="text-sm text-red-600 dark:text-red-400"
                        role="alert"
                    >
                        {errors.password}
                    </p>
                )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={e =>
                        handleFieldChange("confirmPassword", e.target.value)
                    }
                    onBlur={() => handleFieldBlur("confirmPassword")}
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={
                        errors.confirmPassword
                            ? "confirmPassword-error"
                            : undefined
                    }
                    disabled={isLoading}
                    placeholder="Confirm new password"
                />
                {errors.confirmPassword && (
                    <p
                        id="confirmPassword-error"
                        className="text-sm text-red-600 dark:text-red-400"
                        role="alert"
                    >
                        {errors.confirmPassword}
                    </p>
                )}
            </div>

            {/* Submit Button */}
            <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !csrfToken}
            >
                {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
        </form>
    )
}
