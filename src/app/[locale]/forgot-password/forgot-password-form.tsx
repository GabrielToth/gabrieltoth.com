"use client"

import { createClient } from "@/lib/supabase/client"
import { useTranslations } from "next-intl"
import { useState } from "react"

interface ForgotPasswordFormProps {
    locale: string
}

export default function ForgotPasswordForm({
    _locale,
}: ForgotPasswordFormProps) {
    const t = useTranslations("auth")
    const [email, setEmail] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [emailError, setEmailError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Real-time email validation
    const validateEmail = (email: string): string | null => {
        if (email.length === 0) return null
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return "Invalid email format"
        }
        return null
    }

    const handleEmailChange = (newEmail: string) => {
        setEmail(newEmail)
        const error = validateEmail(newEmail)
        setEmailError(error)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(false)

        // Validate email before submission
        const emailValidationError = validateEmail(email)
        if (emailValidationError) {
            setEmailError(emailValidationError)
            return
        }

        setIsLoading(true)

        try {
            const supabase = createClient()
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            })

            if (error) {
                setError(error.message)
                return
            }

            setSuccess(true)
        } catch (err) {
            setError("An unexpected error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <div className="p-4 bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg">
                <p className="font-medium">
                    {t("forgotPassword.successTitle")}
                </p>
                <p className="text-sm mt-1">
                    {t("forgotPassword.successMessage")}
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
                    {t("forgotPassword.email")}
                </label>
                <input
                    type="email"
                    value={email}
                    onChange={e => handleEmailChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
                    placeholder={t("forgotPassword.emailPlaceholder")}
                    required
                    disabled={isLoading}
                />
                {emailError && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {emailError}
                    </p>
                )}
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading
                    ? t("forgotPassword.loading")
                    : t("forgotPassword.button")}
            </button>
        </form>
    )
}
