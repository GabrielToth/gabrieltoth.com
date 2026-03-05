"use client"

import Header from "@/components/layout/header"
import { useLocale } from "@/hooks/use-locale"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useState } from "react"

export default function RegisterPage() {
    const { locale } = useLocale()
    const t = useTranslations("auth")
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // TODO: Implement registration logic
        console.log("Register:", formData)
    }

    return (
        <>
            <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900">
                <Header />
                <div className="flex items-center justify-center min-h-screen pt-20 pb-12 px-4">
                    <div className="w-full max-w-md">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-200 dark:border-gray-700">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                                {t("register.title")}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                                {t("register.subtitle")}
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t("register.name")}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e =>
                                            setFormData({
                                                ...formData,
                                                name: e.target.value,
                                            })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
                                        placeholder={t(
                                            "register.namePlaceholder"
                                        )}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t("register.email")}
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
                                        placeholder={t(
                                            "register.emailPlaceholder"
                                        )}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t("register.password")}
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
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t("register.confirmPassword")}
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={e =>
                                            setFormData({
                                                ...formData,
                                                confirmPassword: e.target.value,
                                            })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors mt-6"
                                >
                                    {t("register.button")}
                                </button>
                            </form>

                            <p className="text-center text-gray-600 dark:text-gray-400 mt-6">
                                {t("register.haveAccount")}{" "}
                                <Link
                                    href={`/${locale}/login`}
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                                >
                                    {t("register.loginLink")}
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
