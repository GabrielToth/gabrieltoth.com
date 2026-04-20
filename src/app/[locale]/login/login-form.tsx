"use client"

import { GoogleLoginButton } from "@/components/auth/google-login-button"
import { createClient } from "@/lib/supabase/client"
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
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        try {
            const supabase = createClient()
            const { error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            })

            if (error) {
                setError(error.message)
                return
            }

            router.push(`/${locale}/dashboard`)
            router.refresh()
        } catch (err) {
            setError("An unexpected error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <GoogleLoginButton className="w-full mb-6" />

            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                        {t("login.orContinueWith")}
                    </span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
                        placeholder={t("login.emailPlaceholder")}
                        required
                        disabled={isLoading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
                        placeholder="••••••••"
                        required
                        disabled={isLoading}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                            disabled={isLoading}
                        />
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                            {t("login.rememberMe")}
                        </span>
                    </label>
                    <Link
                        href={`/${locale}/forgot-password`}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                        {t("login.forgotPassword")}
                    </Link>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? t("login.loading") : t("login.button")}
                </button>
            </form>
        </>
    )
}
