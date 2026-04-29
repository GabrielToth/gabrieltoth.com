"use client"

/**
 * LoginForm Component
 * Provides user login with real-time validation
 * Validates: Requirements 3.1, 3.2, 3.3, 3.5, 3.6, 3.7, 3.8, 3.9, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import { FieldError, ServerError } from "@/components/auth/error-display"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { validateEmail } from "@/lib/validation"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useState } from "react"

interface LoginFormProps {
    locale: string
}

interface LoginFormData {
    email: string
    password: string
    rememberMe: boolean
}

interface ValidationErrors {
    email?: string
    password?: string
}

/**
 * LoginForm Component
 * Requirement 3.1, 3.2, 3.3, 3.5, 3.6, 3.7, 3.8, 3.9, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 *
 * Features:
 * - Real-time email validation
 * - "Remember Me" checkbox for extended session
 * - CSRF token protection
 * - Loading and error states
 * - Rate limiting error display
 * - Redirect to dashboard on success
 */
export function LoginForm({ locale }: LoginFormProps) {
    const router = useRouter()
    const [formData, setFormData] = useState<LoginFormData>({
        email: "",
        password: "",
        rememberMe: false,
    })
    const [errors, setErrors] = useState<ValidationErrors>({})
    const [touched, setTouched] = useState<Record<string, boolean>>({
        email: false,
        password: false,
    })
    const [isLoading, setIsLoading] = useState(false)
    const [serverError, setServerError] = useState<string | null>(null)
    const [csrfToken, setCsrfToken] = useState<string | null>(null)

    // Fetch CSRF token on component mount
    useEffect(() => {
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
    }, [])

    // Real-time validation for email field
    // Requirement 8.1
    const validateEmailField = (value: string) => {
        const emailValidation = validateEmail(value)

        if (!emailValidation.isValid) {
            return emailValidation.error
        }
        return undefined
    }

    // Validate password field (just check if not empty)
    // Requirement 3.2
    const validatePasswordField = (value: string) => {
        if (!value || value.trim().length === 0) {
            return "Password is required"
        }
        return undefined
    }

    // Handle field change with real-time validation
    // Requirement 8.5, 8.6
    const handleFieldChange = (
        field: keyof Omit<LoginFormData, "rememberMe">,
        value: string
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }))

        // Only validate if field has been touched
        if (touched[field]) {
            let error: string | undefined

            switch (field) {
                case "email":
                    error = validateEmailField(value)
                    break
                case "password":
                    error = validatePasswordField(value)
                    break
            }

            setErrors(prev => ({ ...prev, [field]: error }))
        }
    }

    // Handle checkbox change
    // Requirement 3.9
    const handleRememberMeChange = (checked: boolean) => {
        setFormData(prev => ({ ...prev, rememberMe: checked }))
    }

    // Handle field blur to mark as touched
    const handleFieldBlur = (
        field: keyof Omit<LoginFormData, "rememberMe">
    ) => {
        setTouched(prev => ({ ...prev, [field]: true }))

        // Validate on blur
        let error: string | undefined

        switch (field) {
            case "email":
                error = validateEmailField(formData.email)
                break
            case "password":
                error = validatePasswordField(formData.password)
                break
        }

        setErrors(prev => ({ ...prev, [field]: error }))
    }

    // Handle form submission
    // Requirement 3.1, 3.5, 3.6, 3.7, 3.8
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setServerError(null)

        // Mark all fields as touched
        setTouched({
            email: true,
            password: true,
        })

        // Validate all fields
        const emailError = validateEmailField(formData.email)
        const passwordError = validatePasswordField(formData.password)

        const validationErrors: ValidationErrors = {
            email: emailError,
            password: passwordError,
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
            // Submit login
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    rememberMe: formData.rememberMe,
                    csrfToken,
                }),
            })

            const data = await response.json()

            if (!response.ok || !data.success) {
                // Handle rate limiting error specifically
                // Requirement 3.7
                if (response.status === 429) {
                    setServerError(
                        data.error ||
                            "Too many login attempts. Please try again later."
                    )
                } else if (response.status === 401) {
                    // Invalid credentials or email not verified
                    setServerError(data.error || "Invalid email or password")
                } else if (response.status >= 500) {
                    // Server error
                    setServerError(
                        "Server error. Please try again later or contact support."
                    )
                } else {
                    // Generic error for invalid credentials
                    // Requirement 3.2
                    setServerError(data.error || "Invalid email or password")
                }
                return
            }

            // Redirect to dashboard on success
            // Requirement 3.6
            router.push(`/${locale}/dashboard`)
            router.refresh()
        } catch (error) {
            console.error("Login error:", error)

            // Check if it's a network error
            if (error instanceof TypeError) {
                setServerError(
                    "Network error. Please check your connection and try again."
                )
            } else {
                setServerError("An error occurred. Please try again later.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Server Error Display */}
            <ServerError error={serverError} />

            {/* Email Field */}
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={e => handleFieldChange("email", e.target.value)}
                    onBlur={() => handleFieldBlur("email")}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    disabled={isLoading}
                />
                <FieldError error={errors.email} fieldName="email" />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    showPasswordToggle
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
                />
                <FieldError error={errors.password} fieldName="password" />
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center space-x-2">
                <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={e => handleRememberMeChange(e.target.checked)}
                    disabled={isLoading}
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                />
                <Label
                    htmlFor="rememberMe"
                    className="text-sm font-normal cursor-pointer"
                >
                    Remember me for 30 days
                </Label>
            </div>

            {/* Submit Button */}
            <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !csrfToken}
            >
                {isLoading ? "Signing in..." : "Sign in"}
            </Button>
        </form>
    )
}
