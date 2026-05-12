"use client"

import UnifiedSignInForm from "@/components/auth/unified-signin-form"
import { useTranslations } from "next-intl"
import { useState } from "react"

interface SignInPageClientProps {
    locale: string
    initialEmail?: string
    initialMode?: "signin" | "signup"
}

export function SignInPageClient({
    locale,
    initialEmail = "",
    initialMode = "signin",
}: SignInPageClientProps) {
    const t = useTranslations("auth")
    const [mode, setMode] = useState<"signin" | "signup">(initialMode)

    const title =
        mode === "signup" ? t("signin.titleSignUp") : t("signin.titleSignIn")

    const handleModeChange = (newMode: "signin" | "signup") => {
        setMode(newMode)
        // Update URL when mode changes
        const newUrl =
            newMode === "signup"
                ? `/${locale}/signin?mode=signup${initialEmail ? `&email=${initialEmail}` : ""}`
                : `/${locale}/signin${initialEmail ? `?email=${initialEmail}` : ""}`
        window.history.replaceState({}, "", newUrl)
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            {title}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            {t("signin.subtitle")}
                        </p>
                    </div>

                    {/* Form */}
                    <UnifiedSignInForm
                        locale={locale}
                        initialEmail={initialEmail}
                        onModeChange={handleModeChange}
                    />
                </div>
            </div>
        </div>
    )
}
