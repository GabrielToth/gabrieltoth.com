"use client"

import { GoogleLoginButton } from "@/components/auth/google-login-button"
import { useTranslations } from "next-intl"
import { useState } from "react"

interface RegisterFormProps {
    locale: string
}

export default function RegisterForm({ _locale }: RegisterFormProps) {
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
            <GoogleLoginButton className="w-full mb-6" />

            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                        {t("register.orContinueWith")}
                    </span>
                </div>
            </div>

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
                        placeholder={t("register.namePlaceholder")}
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
                        placeholder={t("register.emailPlaceholder")}
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
        </>
    )
}
