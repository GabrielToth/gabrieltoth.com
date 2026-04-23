"use client"

import { GoogleLoginButton } from "@/components/auth/google-login-button"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useState } from "react"
import "react-international-phone/style.css"

interface RegisterFormMultistepProps {
    locale: string
}

type Step = "initial" | "email" | "name" | "phone" | "password" | "confirm"

interface FormData {
    email: string
    name: string
    phone: string
    password: string
    confirmPassword: string
}

export default function RegisterFormMultistep({
    locale,
}: RegisterFormMultistepProps) {
    const t = useTranslations("auth")
    const router = useRouter()
    const [step, setStep] = useState<Step>("initial")
    const [formData, setFormData] = useState<FormData>({
        email: "",
        name: "",
        phone: "",
        password: "",
        confirmPassword: "",
    })
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!formData.email.trim()) {
            setError(t("register.emailRequired"))
            return
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
            setError(t("register.invalidEmail"))
            return
        }

        setStep("name")
    }

    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!formData.name.trim()) {
            setError(t("register.nameRequired"))
            return
        }

        if (formData.name.trim().length < 2) {
            setError(t("register.nameTooShort"))
            return
        }

        setStep("phone")
    }

    const handlePhoneSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!formData.phone.trim()) {
            setError(t("register.phoneRequired"))
            return
        }

        setStep("password")
    }

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!formData.password.trim()) {
            setError(t("register.passwordRequired"))
            return
        }

        if (formData.password.length < 6) {
            setError(t("register.passwordTooShort"))
            return
        }

        if (!formData.confirmPassword.trim()) {
            setError(t("register.confirmPasswordRequired"))
            return
        }

        if (formData.password !== formData.confirmPassword) {
            setError(t("register.passwordMismatch"))
            return
        }

        setStep("confirm")
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.message || "Registration failed")
                return
            }

            // Redirect to email confirmation page
            router.push(
                `/${locale}/verify-email?email=${encodeURIComponent(formData.email)}`
            )
        } catch (err) {
            setError("An unexpected error occurred")
            console.error("Registration error:", err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleBack = () => {
        if (step === "initial") return
        if (step === "email") setStep("initial")
        if (step === "name") setStep("email")
        if (step === "phone") setStep("name")
        if (step === "password") setStep("phone")
        if (step === "confirm") setStep("password")
    }

    // Step: Initial - Choose login method
    if (step === "initial") {
        return (
            <div className="space-y-6">
                <GoogleLoginButton className="w-full" type="register" />

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                            {t("register.orContinueWith")}
                        </span>
                    </div>
                </div>

                <button
                    onClick={() => setStep("email")}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                    {t("register.emailButton")}
                </button>
            </div>
        )
    }

    // Step: Email
    if (step === "email") {
        return (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {t("register.emailStep")}
                    </h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        1/5
                    </span>
                </div>

                {error && (
                    <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
                        {error}
                    </div>
                )}

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
                        autoComplete="email"
                        autoFocus
                    />
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        {t("register.back")}
                    </button>
                    <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                    >
                        {t("register.next")}
                    </button>
                </div>
            </form>
        )
    }

    // Step: Name
    if (step === "name") {
        return (
            <form onSubmit={handleNameSubmit} className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {t("register.nameStep")}
                    </h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        2/5
                    </span>
                </div>

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
                        value={formData.name}
                        onChange={e =>
                            setFormData({
                                ...formData,
                                name: e.target.value,
                            })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
                        placeholder={t("register.namePlaceholder")}
                        autoComplete="name"
                        autoFocus
                    />
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        {t("register.back")}
                    </button>
                    <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                    >
                        {t("register.next")}
                    </button>
                </div>
            </form>
        )
    }

    // Step: Phone
    if (step === "phone") {
        return (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {t("register.phoneStep")}
                    </h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        3/5
                    </span>
                </div>

                {error && (
                    <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("register.phone")}
                    </label>
                    <PhoneInput
                        defaultCountry="br"
                        value={formData.phone}
                        onChange={phone =>
                            setFormData({
                                ...formData,
                                phone,
                            })
                        }
                        inputProps={{
                            autoComplete: "tel",
                            placeholder: t("register.phonePlaceholder"),
                            className:
                                "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500",
                        }}
                        countrySelectorStyleProps={{
                            buttonClassName:
                                "border border-gray-300 dark:border-gray-600 rounded-l-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600",
                        }}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {t("register.phoneHint")}
                    </p>
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        {t("register.back")}
                    </button>
                    <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                    >
                        {t("register.next")}
                    </button>
                </div>
            </form>
        )
    }

    // Step: Password
    if (step === "password") {
        return (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {t("register.passwordStep")}
                    </h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        4/5
                    </span>
                </div>

                {error && (
                    <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
                        {error}
                    </div>
                )}

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
                        minLength={6}
                        autoComplete="new-password"
                        autoFocus
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
                        minLength={6}
                        autoComplete="new-password"
                    />
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        {t("register.back")}
                    </button>
                    <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                    >
                        {t("register.next")}
                    </button>
                </div>
            </form>
        )
    }

    // Step: Confirmation
    if (step === "confirm") {
        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {t("register.confirmStep")}
                    </h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        5/5
                    </span>
                </div>

                {error && (
                    <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            {t("register.email")}
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                            {formData.email}
                        </p>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            {t("register.name")}
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                            {formData.name}
                        </p>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            {t("register.phone")}
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                            {formData.phone}
                        </p>
                    </div>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("register.confirmMessage")}
                </p>

                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        {t("register.back")}
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading
                            ? t("register.loading")
                            : t("register.button")}
                    </button>
                </div>
            </form>
        )
    }

    return null
}
