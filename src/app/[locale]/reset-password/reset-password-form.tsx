"use client"

import { createClient } from "@/lib/supabase/client"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface ResetPasswordFormProps {
    locale: string
}

interface ValidationErrors {
    password?: string
    confirmPassword?: string
}

export default function ResetPasswordForm({ locale }: ResetPasswordFormProps) {
    const t = useTranslations("auth")
    const router = useRouter()
    const [formData, setFormData] = useState({
        password: "",
        confirmPassword: "",
    })
    const [error, setError] = useState<string | null>(null)
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
        {}
    )
    const [success, setSuccess] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Real-time password validation
    const validatePassword = (password: string): string | undefined => {
        if (password.length === 0) return undefined
        if (password.length < 8) {
            return t("resetPassword.passwordTooShort")
        }
        const hasUppercase = /[A-Z]/.test(password)
        const hasLowercase = /[a-z]/.test(password)
        const hasNumber = /[0-9]/.test(password)
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)

        if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
            return t("resetPassword.passwordRequirements")
        }
        return undefined
    }

    // Real-time confirm password validation
    const validateConfirmPassword = (
        confirmPassword: string
    ): string | undefined => {
        if (confirmPassword.length === 0) return undefined
        if (confirmPassword !== formData.password) {
            return t("resetPassword.passwordMismatch")
        }
        return undefined
    }

    const handlePasswordChange = (password: string) => {
        setFormData({ ...formData, password })
        const error = validatePassword(password)
        setValidationErrors(prev => ({ ...prev, password: error }))
    }

    const handleConfirmPasswordChange = (confirmPassword: string) => {
        setFormData({ ...formData, confirmPassword })
        const error = validateConfirmPassword(confirmPassword)
        setValidationErrors(prev => ({ ...prev, confirmPassword: error }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(false)

        // Validate passwords
        const passwordError = validatePassword(formData.password)
        const confirmPasswordError = validateConfirmPassword(
            formData.confirmPassword
        )

        if (passwordError || confirmPasswordError) {
            setValidationErrors({
                password: passwordError,
                confirmPassword: confirmPasswordError,
            })
            return
        }

        if (formData.password !== formData.confirmPassword) {
            setError(t("resetPassword.passwordMismatch"))
            return
        }

        setIsLoading(true)

        try {
            const supabase = createClient()
            const { error } = await supabase.auth.updateUser({
                password: formData.password,
            })

            if (error) {
                if (error.message.includes("expired")) {
                    setError(t("resetPassword.tokenExpired"))
                } else {
                    setError(error.message)
                }
                return
            }

            setSuccess(true)
            // Redirect to login after 2 seconds
            setTimeout(() => {
                router.push(`/${locale}/login`)
            }, 2000)
        } catch (err) {
            setError("An unexpected error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <div className="p-4 bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg">
                <p className="font-medium">{t("resetPassword.successTitle")}</p>
                <p className="text-sm mt-1">
                    {t("resetPassword.successMessage")}
                </p>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("resetPassword.password")}
                </label>
                <input
                    type="password"
                    value={formData.password}
                    onChange={e => handlePasswordChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
                    placeholder={t("resetPassword.passwordPlaceholder")}
                    required
                    disabled={isLoading}
                    minLength={8}
                />
                {validationErrors.password && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {validationErrors.password}
                    </p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("resetPassword.confirmPassword")}
                </label>
                <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={e => handleConfirmPasswordChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
                    placeholder={t("resetPassword.confirmPasswordPlaceholder")}
                    required
                    disabled={isLoading}
                    minLength={8}
                />
                {validationErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {validationErrors.confirmPassword}
                    </p>
                )}
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading
                    ? t("resetPassword.loading")
                    : t("resetPassword.button")}
            </button>
        </form>
    )
}
