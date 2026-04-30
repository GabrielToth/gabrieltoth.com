"use client"

import { GoogleLoginButton } from "@/components/auth/google-login-button"
import {
    checkUserExists,
    signInWithEmail,
    signInWithSSO,
    signUpWithEmail,
} from "@/lib/auth/unified-auth"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface UnifiedSignInFormProps {
    locale: string
}

type FormStep = "email" | "password" | "register"

export default function UnifiedSignInForm({ locale }: UnifiedSignInFormProps) {
    const t = useTranslations("auth")
    const router = useRouter()

    const [step, setStep] = useState<FormStep>("email")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [userExists, setUserExists] = useState(false)

    // Step 1: Email verification
    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        try {
            const result = await checkUserExists(email)

            if (!result.success) {
                setError(result.error || "Failed to verify email")
                return
            }

            setUserExists(result.userExists)
            setStep(result.userExists ? "password" : "register")
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    // Step 2: Password entry (for existing users)
    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        try {
            const result = await signInWithEmail(email, password)

            if (!result.success) {
                setError(result.error || "Sign in failed")
                return
            }

            router.push(`/${locale}/dashboard`)
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    // Step 3: Registration (for new users)
    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters")
            return
        }

        setIsLoading(true)

        try {
            const result = await signUpWithEmail(email, password, {
                email_verified: false,
            })

            if (!result.success) {
                setError(result.error || "Sign up failed")
                return
            }

            // Redirect to complete account setup
            router.push(`/${locale}/auth/complete-account`)
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    // Handle SSO
    const handleSSO = async () => {
        setError(null)
        setIsLoading(true)

        try {
            await signInWithSSO(email)
        } catch (err) {
            setError(err instanceof Error ? err.message : "SSO sign-in failed")
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md mx-auto">
            {/* Step 1: Email */}
            {step === "email" && (
                <>
                    <GoogleLoginButton className="w-full mb-6" type="login" />

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                {t("signin.orContinueWith")}
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t("signin.email")}
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
                                placeholder={t("signin.emailPlaceholder")}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading
                                ? t("signin.loading")
                                : t("signin.continue")}
                        </button>
                    </form>

                    {/* SSO Option */}
                    <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-600">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {t("signin.ssoDescription")}
                        </p>
                        <button
                            onClick={handleSSO}
                            disabled={isLoading || !email}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                            {t("signin.sso")}
                        </button>
                    </div>
                </>
            )}

            {/* Step 2: Password (existing user) */}
            {step === "password" && (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {t("signin.welcomeBack")} <strong>{email}</strong>
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t("signin.password")}
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
                            placeholder="••••••••"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => {
                                setStep("email")
                                setPassword("")
                                setError(null)
                            }}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                            {t("signin.changeEmail")}
                        </button>
                        <Link
                            href={`/${locale}/forgot-password`}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                            {t("signin.forgotPassword")}
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? t("signin.loading") : t("signin.signIn")}
                    </button>
                </form>
            )}

            {/* Step 3: Register (new user) */}
            {step === "register" && (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {t("signin.createAccount")} <strong>{email}</strong>
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t("signin.password")}
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
                            placeholder="••••••••"
                            required
                            disabled={isLoading}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {t("signin.passwordRequirement")}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t("signin.confirmPassword")}
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
                            placeholder="••••••••"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="flex items-start">
                        <input
                            type="checkbox"
                            id="terms"
                            className="mt-1 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                            required
                            disabled={isLoading}
                        />
                        <label
                            htmlFor="terms"
                            className="ml-2 text-sm text-gray-600 dark:text-gray-400"
                        >
                            {t("signin.agreeTerms")}{" "}
                            <Link
                                href={`/${locale}/terms-of-service`}
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                {t("signin.termsLink")}
                            </Link>
                        </label>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setStep("email")
                            setPassword("")
                            setConfirmPassword("")
                            setError(null)
                        }}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                        {t("signin.changeEmail")}
                    </button>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading
                            ? t("signin.loading")
                            : t("signin.createAccount")}
                    </button>
                </form>
            )}
        </div>
    )
}
