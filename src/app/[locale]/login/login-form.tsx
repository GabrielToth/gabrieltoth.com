"use client"

import { GoogleLoginButton } from "@/components/auth/google-login-button"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface LoginFormProps {
    locale: string
}

export default function LoginForm({ locale }: LoginFormProps) {
    const t = useTranslations("auth")
    const router = useRouter()
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })
    const [rememberMe, setRememberMe] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [showEmailForm, setShowEmailForm] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    rememberMe,
                }),
            })

            const data = await response.json()

            if (!response.ok || !data.success) {
                setError(data.error || "Invalid email or password")
                return
            }

            router.push(`/${locale}/dashboard`)
            router.refresh()
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            setError("An unexpected error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <GoogleLoginButton className="w-full mb-3" type="login" />

            <button
                onClick={() => setShowEmailForm(!showEmailForm)}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-accent hover:bg-accent dark:bg-muted dark:hover:bg-muted text-foreground dark:text-foreground rounded-lg font-medium transition-colors mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {t("login.emailButton")}
            </button>

            {showEmailForm && (
                <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                    {error && (
                        <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-foreground dark:text-foreground mb-2">
                            {t("login.email")}
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={e =>
                                setFormData({
                                    ...formData,
                                    email: e.target.value,
                                })
                            }
                            className="w-full px-4 py-2 border border-input dark:border-input rounded-lg bg-card dark:bg-muted text-foreground dark:text-foreground focus:outline-none focus:ring-2 focus:ring-ring dark:focus:ring-ring"
                            placeholder={t("login.emailPlaceholder")}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground dark:text-foreground mb-2">
                            {t("login.password")}
                        </label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={e =>
                                setFormData({
                                    ...formData,
                                    password: e.target.value,
                                })
                            }
                            className="w-full px-4 py-2 border border-input dark:border-input rounded-lg bg-card dark:bg-muted text-foreground dark:text-foreground focus:outline-none focus:ring-2 focus:ring-ring dark:focus:ring-ring"
                            placeholder="••••••••"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={e => setRememberMe(e.target.checked)}
                                className="rounded border-input dark:border-input text-primary focus:ring-ring"
                                disabled={isLoading}
                            />
                            <span className="ml-2 text-sm text-muted-foreground dark:text-muted-foreground">
                                {t("login.rememberMe")}
                            </span>
                        </label>
                        <Link
                            href={`/${locale}/forgot-password`}
                            className="text-sm text-primary dark:text-primary hover:text-primary dark:hover:text-primary"
                        >
                            {t("login.forgotPassword")}
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full px-4 py-3 bg-primary hover:bg-primary dark:bg-primary dark:hover:bg-primary text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? t("login.loading") : t("login.button")}
                    </button>
                </form>
            )}

            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-input dark:border-input"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-card text-muted-foreground dark:text-muted-foreground">
                        {t("login.noAccount")}
                    </span>
                </div>
            </div>

            <Link
                href={`/${locale}/register`}
                className="w-full px-4 py-3 bg-primary hover:bg-primary dark:bg-primary dark:hover:bg-primary text-white rounded-lg font-medium transition-colors text-center block mb-6"
            >
                {t("login.registerLink")}
            </Link>

            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-input dark:border-input"></div>
                </div>
            </div>

            <p className="text-center text-xs text-muted-foreground dark:text-muted-foreground">
                {t("login.privacyPolicy")}
            </p>
        </>
    )
}
