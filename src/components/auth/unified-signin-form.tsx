"use client"

import {
    signInWithEmail,
    signInWithSSO,
    signUpWithEmail,
} from "@/lib/auth/unified-auth"
import { logger } from "@/lib/logger"
import { LockKeyhole } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { FaEnvelope, FaGoogle } from "react-icons/fa"

interface UnifiedSignInFormProps {
    locale: string
    initialEmail?: string
    onModeChange?: (mode: "signin" | "signup") => void
}

type FormStep = "buttons" | "email" | "password" | "register"
type FormMode = "signin" | "signup"

export default function UnifiedSignInForm({
    locale,
    initialEmail = "",
    onModeChange,
}: UnifiedSignInFormProps) {
    const t = useTranslations("auth")
    const router = useRouter()

    const [step, setStep] = useState<FormStep>("buttons")
    const [mode, setMode] = useState<FormMode>("signin")

    // Notify parent when mode changes
    const handleModeChange = (newMode: FormMode) => {
        setMode(newMode)
        onModeChange?.(newMode)
    }
    const [email, setEmail] = useState(initialEmail)
    const [fullName, setFullName] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Step 1: Email verification
    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        try {
            // Always proceed to password step regardless of whether email exists
            // This prevents user enumeration attacks
            setStep("password")
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    // Step 2: Password entry (for existing users) or registration
    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        try {
            const result = await signInWithEmail(email, password)

            if (!result.success) {
                // Always return generic error message to prevent user enumeration
                setError("Invalid email or password")
                return
            }

            router.push(`/${locale}/dashboard`)
            router.refresh()
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            setError("Invalid email or password")
        } finally {
            setIsLoading(false)
        }
    }

    // Step 3: Registration (for new users)
    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Validate full name
        if (!fullName || fullName.trim().length < 2) {
            setError("Please enter your full name")
            return
        }

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
                full_name: fullName.trim(),
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
            await signInWithSSO(email || "")
        } catch (err) {
            setError(err instanceof Error ? err.message : "SSO sign-in failed")
            setIsLoading(false)
        }
    }

    // Handle Google Login
    const handleGoogleLogin = async () => {
        try {
            setError(null)
            setIsLoading(true)

            // Get Google Client ID from environment
            const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
            if (!clientId) {
                throw new Error("Google Client ID not configured")
            }

            // Get redirect URI from environment
            const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
            if (!redirectUri) {
                throw new Error("Google redirect URI not configured")
            }

            // Generate state parameter for CSRF protection
            const state = Math.random().toString(36).substring(7)
            sessionStorage.setItem("oauth_state", state)

            // Build Google OAuth authorization URL
            const params = new URLSearchParams({
                client_id: clientId,
                redirect_uri: redirectUri,
                response_type: "code",
                scope: "openid email profile",
                state,
            })

            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

            // Redirect to Google OAuth
            window.location.href = authUrl
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err))
            logger.error("Google login error", {
                context: "Auth",
                error,
            })
            setError(error.message)
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md mx-auto">
            {/* Step 1: Button Selection */}
            {step === "buttons" && (
                <div className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Google Button - White background */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full h-12 px-4 bg-white dark:bg-gray-100 hover:bg-gray-50 dark:hover:bg-gray-200 text-gray-900 dark:text-gray-900 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-300"
                    >
                        <FaGoogle size={20} />
                        {mode === "signin"
                            ? t("signin.googleButton")
                            : t("signin.googleSignUpButton")}
                    </button>

                    {/* SSO Button - Dark background */}
                    <button
                        onClick={handleSSO}
                        disabled={isLoading}
                        className="w-full h-12 px-4 bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <LockKeyhole size={20} />
                        {mode === "signin"
                            ? t("signin.sso")
                            : t("signin.ssoSignUp")}
                    </button>

                    {/* Email Button - Border only */}
                    <button
                        onClick={() => setStep("email")}
                        disabled={isLoading}
                        className="w-full h-12 px-4 border-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <FaEnvelope size={20} />
                        {mode === "signin"
                            ? t("signin.emailButton")
                            : t("signin.emailSignUpButton")}
                    </button>

                    {/* Create Account Link */}
                    <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-600 text-center">
                        {mode === "signin" ? (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t("signin.noAccount")}{" "}
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleModeChange("signup")
                                        setError(null)
                                    }}
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                                >
                                    {t("signin.createAccount")}
                                </button>
                            </p>
                        ) : (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t("signin.haveAccount")}{" "}
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleModeChange("signin")
                                        setStep("buttons")
                                        setError(null)
                                    }}
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                                >
                                    {t("signin.signIn")}
                                </button>
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Step 2: Email */}
            {step === "email" && (
                <>
                    {/* Back Button */}
                    <button
                        onClick={() => {
                            setStep("buttons")
                            setEmail("")
                            setError(null)
                        }}
                        className="mb-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                    >
                        ← {t("register.back")}
                    </button>

                    {mode === "signin" ? (
                        <>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                {t("signin.email")}
                            </h3>
                        </>
                    ) : (
                        <>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                {t("register.email")}
                            </h3>
                        </>
                    )}

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

                    {/* Toggle between Sign In and Sign Up */}
                    <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-600 text-center">
                        {mode === "signin" ? (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t("signin.noAccount")}{" "}
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleModeChange("signup")
                                        setError(null)
                                    }}
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                                >
                                    {t("signin.createAccount")}
                                </button>
                            </p>
                        ) : (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t("signin.haveAccount")}{" "}
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleModeChange("signin")
                                        setError(null)
                                    }}
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                                >
                                    {t("signin.signIn")}
                                </button>
                            </p>
                        )}
                    </div>

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
                            {mode === "signin"
                                ? t("signin.sso")
                                : t("signin.ssoSignUp")}
                        </button>
                    </div>
                </>
            )}

            {/* Step 2: Password (existing user) */}
            {step === "password" && mode === "signin" && (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    {/* Back Button */}
                    <button
                        type="button"
                        onClick={() => {
                            setStep("buttons")
                            setEmail("")
                            setPassword("")
                            setError(null)
                        }}
                        className="mb-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                    >
                        ← {t("register.back")}
                    </button>

                    {error && (
                        <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

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

                    {/* Create Account Button */}
                    <button
                        type="button"
                        onClick={() => {
                            setStep("email")
                            setPassword("")
                            handleModeChange("signup")
                            setError(null)
                        }}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                    >
                        {t("signin.createAccount")}
                    </button>
                </form>
            )}

            {/* Step 3: Register (new user) */}
            {step === "password" && mode === "signup" && (
                <form
                    onSubmit={handleRegisterSubmit}
                    noValidate
                    className="space-y-4"
                >
                    {/* Back Button */}
                    <button
                        type="button"
                        onClick={() => {
                            setStep("buttons")
                            setEmail("")
                            setFullName("")
                            setPassword("")
                            setConfirmPassword("")
                            setError(null)
                        }}
                        className="mb-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                    >
                        ← {t("register.back")}
                    </button>

                    {error && (
                        <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t("register.name")}
                        </label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
                            placeholder={t("register.namePlaceholder")}
                            required
                            disabled={isLoading}
                        />
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

                    <button
                        type="button"
                        onClick={() => {
                            setStep("email")
                            setFullName("")
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
