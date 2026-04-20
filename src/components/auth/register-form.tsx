"use client"

/**
 * RegisterForm Component
 * Provides user registration with real-time validation
 * Validates: Requirements 1.1, 1.2, 1.3, 1.5, 1.7, 1.8, 1.9, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    calculatePasswordStrength,
    getMissingRequirements,
} from "@/lib/auth/password-strength"
import { sanitizeRegistrationForm } from "@/lib/auth/sanitization"
import {
    validateEmail,
    validateFieldLength,
    validateName,
    validatePassword,
    validatePasswordMatch,
} from "@/lib/validation"
import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"

interface RegisterFormProps {
    locale: string
}

interface FormData {
    name: string
    email: string
    password: string
    confirmPassword: string
}

interface ValidationErrors {
    name?: string
    email?: string
    password?: string
    confirmPassword?: string
}

/**
 * RegisterForm Component
 * Requirement 1.1, 1.2, 1.3, 1.5, 1.7, 1.8, 1.9, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 *
 * Features:
 * - Real-time validation for all fields
 * - Password strength indicator
 * - CSRF token protection
 * - Loading and error states
 * - Redirect to verification pending page on success
 */
export function RegisterForm({ locale }: RegisterFormProps) {
    const router = useRouter()
    const [formData, setFormData] = useState<FormData>({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    })
    const [errors, setErrors] = useState<ValidationErrors>({})
    const [touched, setTouched] = useState<Record<keyof FormData, boolean>>({
        name: false,
        email: false,
        password: false,
        confirmPassword: false,
    })
    const [isLoading, setIsLoading] = useState(false)
    const [serverError, setServerError] = useState<string | null>(null)
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

    // Real-time validation for name field
    // Requirement 8.4
    const validateNameField = (value: string) => {
        const nameValidation = validateName(value)
        const lengthValidation = validateFieldLength(value, "name")

        if (!nameValidation.isValid) {
            return nameValidation.error
        }
        if (!lengthValidation.isValid) {
            return lengthValidation.error
        }
        return undefined
    }

    // Real-time validation for email field
    // Requirement 8.1
    const validateEmailField = (value: string) => {
        const emailValidation = validateEmail(value)
        const lengthValidation = validateFieldLength(value, "email")

        if (!emailValidation.isValid) {
            return emailValidation.error
        }
        if (!lengthValidation.isValid) {
            return lengthValidation.error
        }
        return undefined
    }

    // Real-time validation for password field
    // Requirement 8.2
    const validatePasswordField = (value: string) => {
        const passwordValidation = validatePassword(value)
        const lengthValidation = validateFieldLength(value, "password")

        if (!passwordValidation.isValid) {
            return passwordValidation.error
        }
        if (!lengthValidation.isValid) {
            return lengthValidation.error
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
    const handleFieldChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))

        // Only validate if field has been touched
        if (touched[field]) {
            let error: string | undefined

            switch (field) {
                case "name":
                    error = validateNameField(value)
                    break
                case "email":
                    error = validateEmailField(value)
                    break
                case "password":
                    error = validatePasswordField(value)
                    // Also revalidate confirmPassword if it has been touched
                    if (touched.confirmPassword && formData.confirmPassword) {
                        const confirmError = validateConfirmPasswordField(
                            formData.confirmPassword
                        )
                        setErrors(prev => ({
                            ...prev,
                            confirmPassword: confirmError,
                        }))
                    }
                    break
                case "confirmPassword":
                    error = validateConfirmPasswordField(value)
                    break
            }

            setErrors(prev => ({ ...prev, [field]: error }))
        }
    }

    // Handle field blur to mark as touched
    const handleFieldBlur = (field: keyof FormData) => {
        setTouched(prev => ({ ...prev, [field]: true }))

        // Validate on blur
        let error: string | undefined

        switch (field) {
            case "name":
                error = validateNameField(formData.name)
                break
            case "email":
                error = validateEmailField(formData.email)
                break
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
    // Requirement 1.1, 1.8, 1.9
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setServerError(null)

        // Mark all fields as touched
        setTouched({
            name: true,
            email: true,
            password: true,
            confirmPassword: true,
        })

        // Validate all fields
        const nameError = validateNameField(formData.name)
        const emailError = validateEmailField(formData.email)
        const passwordError = validatePasswordField(formData.password)
        const confirmPasswordError = validateConfirmPasswordField(
            formData.confirmPassword
        )

        const validationErrors: ValidationErrors = {
            name: nameError,
            email: emailError,
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
            // Sanitize form data
            const sanitizedData = sanitizeRegistrationForm(formData)

            // Submit registration
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                },
                body: JSON.stringify({
                    ...sanitizedData,
                    csrfToken,
                }),
            })

            const data = await response.json()

            if (!response.ok || !data.success) {
                setServerError(
                    data.error || "Registration failed. Please try again."
                )
                return
            }

            // Redirect to verification pending page
            router.push(`/${locale}/auth/verify-email-pending`)
        } catch (error) {
            console.error("Registration error:", error)
            setServerError("An error occurred. Please try again later.")
        } finally {
            setIsLoading(false)
        }
    }

    // Calculate password strength for indicator
    // Requirement 8.2
    const passwordStrength = calculatePasswordStrength(formData.password)
    const missingRequirements = getMissingRequirements(formData.password)

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

            {/* Name Field */}
            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={formData.name}
                    onChange={e => handleFieldChange("name", e.target.value)}
                    onBlur={() => handleFieldBlur("name")}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "name-error" : undefined}
                    disabled={isLoading}
                />
                {errors.name && (
                    <p
                        id="name-error"
                        className="text-sm text-red-600 dark:text-red-400"
                        role="alert"
                    >
                        {errors.name}
                    </p>
                )}
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

            {/* Password Field */}
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
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
                        errors.password ? "password-error" : "password-strength"
                    }
                    disabled={isLoading}
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

                {/* Password Strength Indicator */}
                {formData.password && !errors.password && (
                    <div id="password-strength" className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-300 ${
                                        passwordStrength.strength === "weak"
                                            ? "bg-red-500 w-1/4"
                                            : passwordStrength.strength ===
                                                "fair"
                                              ? "bg-orange-500 w-2/4"
                                              : passwordStrength.strength ===
                                                  "good"
                                                ? "bg-yellow-500 w-3/4"
                                                : "bg-green-500 w-full"
                                    }`}
                                />
                            </div>
                            <span
                                className={`text-sm font-medium ${passwordStrength.color}`}
                            >
                                {passwordStrength.feedback}
                            </span>
                        </div>

                        {missingRequirements.length > 0 && (
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                <p className="font-medium mb-1">
                                    Missing requirements:
                                </p>
                                <ul className="list-disc list-inside space-y-0.5">
                                    {missingRequirements.map(req => (
                                        <li key={req}>{req}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
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
                {isLoading ? "Creating account..." : "Create account"}
            </Button>
        </form>
    )
}
