"use client"

/**
 * LoginForm Component
 * Provides user login with real-time validation, CSRF protection, CAPTCHA verification, and accessibility
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.1, 3.2, 3.3, 3.5, 3.6, 3.7, 3.8, 3.9, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 20.1, 20.2, 20.8, 20.9
 */

import { FieldError, ServerError } from "@/components/auth/error-display"
import TurnstileWidget from "@/components/auth/turnstile-widget"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { validateEmail } from "@/lib/validation"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useRef, useState } from "react"

interface LoginFormProps {
    locale: string
}

interface LoginFormData {
    email: string
    password: string
    rememberMe: boolean
    captchaToken: string | null
}

interface ValidationErrors {
    email?: string
    password?: string
}

/**
 * LoginForm Component
 * Requirement 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.1, 3.2, 3.3, 3.5, 3.6, 3.7, 3.8, 3.9, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 20.1, 20.2, 20.8, 20.9
 *
 * Features:
 * - Real-time email validation
 * - "Remember Me" checkbox for extended session
 * - CSRF token protection
 * - CAPTCHA verification (Cloudflare Turnstile)
 * - Loading and error states
 * - Rate limiting error display
 * - Redirect to dashboard on success
 * - WCAG 2.1 Level AA compliance
 * - Keyboard navigation support
 * - Screen reader support
 * - Focus management
 * - Responsive design
 * - Password manager support
 * - Loading state visual feedback
 */
export function LoginForm({ locale }: LoginFormProps) {
    const router = useRouter()
    const formRef = useRef<HTMLFormElement>(null)
    const errorRef = useRef<HTMLDivElement>(null)
    const [formData, setFormData] = useState<LoginFormData>({
        email: "",
        password: "",
        rememberMe: false,
        captchaToken: null,
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
            } catch {
                // CSRF optional in tests / offline; form still validates client-side
            }
        }
        fetchCsrfToken()
    }, [])

    // Focus management for error messages (Requirement 15.4)
    useEffect(() => {
        if (serverError && errorRef.current) {
            // Announce error to screen readers
            errorRef.current.focus()
            // Only scroll if scrollIntoView is available (not in test environment)
            if (errorRef.current.scrollIntoView) {
                errorRef.current.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                })
            }
        }
    }, [serverError])

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

    // Handle CAPTCHA token change
    // Requirement 20.1, 20.2
    const handleCaptchaTokenChange = (token: string | null) => {
        setFormData(prev => ({ ...prev, captchaToken: token }))
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
    // Requirement 3.1, 3.5, 3.6, 3.7, 3.8, 20.1, 20.2
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setServerError(null)

        // Mark all fields as touched
        setTouched({
            email: true,
            password: true,
        })

        // Validate CAPTCHA token first (Requirement 20.1, 20.2)
        if (!formData.captchaToken) {
            setServerError("Please complete the security verification")
            return
        }

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
            // Submit login with CAPTCHA token (Requirement 20.8, 20.9)
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
                    captchaToken: formData.captchaToken,
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
        <form onSubmit={handleSubmit} className="space-y-6" ref={formRef}>
            {/* Server Error Display with focus management */}
            <div ref={errorRef} tabIndex={-1}>
                <ServerError error={serverError} />
            </div>

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
                    placeholder="Enter your email address"
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
                    placeholder="Enter your password"
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
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                    aria-describedby="rememberMe-description"
                />
                <Label
                    htmlFor="rememberMe"
                    className="text-sm font-normal cursor-pointer"
                >
                    Remember me for 30 days
                </Label>
                <span id="rememberMe-description" className="sr-only">
                    Keep me logged in on this device for 30 days
                </span>
            </div>

            {/* CAPTCHA Widget */}
            {/* Requirement 20.1, 20.2, 20.8, 20.9 */}
            <div className="space-y-2">
                <TurnstileWidget
                    onTokenChange={handleCaptchaTokenChange}
                    theme="light"
                    size="normal"
                    className="w-full"
                />
            </div>

            {/* Submit Button */}
            <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !csrfToken || !formData.captchaToken}
                aria-busy={isLoading}
            >
                {isLoading ? (
                    <>
                        <span className="inline-block animate-spin mr-2">
                            ⏳
                        </span>
                        Signing in...
                    </>
                ) : (
                    "Sign in"
                )}
            </Button>
        </form>
    )
}
