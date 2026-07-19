"use client"

import UnifiedSignInForm from "@/components/auth/unified-signin-form"
import { useTranslations } from "next-intl"
import { useState } from "react"

interface SignInPageClientProps {
    locale: string
    initialEmail?: string
}

export function SignInPageClient({
    locale,
    initialEmail = "",
}: SignInPageClientProps) {
    const t = useTranslations("auth")
    const [mode, setMode] = useState<"signin" | "signup">("signin")

    const title =
        mode === "signup" ? t("signin.titleSignUp") : t("signin.titleSignIn")

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="bg-card rounded-lg shadow-lg p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-foreground dark:text-foreground mb-2">
                            {title}
                        </h1>
                        <p className="text-muted-foreground dark:text-muted-foreground">
                            {t("signin.subtitle")}
                        </p>
                    </div>

                    {/* Form */}
                    <UnifiedSignInForm
                        locale={locale}
                        initialEmail={initialEmail}
                        onModeChange={setMode}
                    />
                </div>
            </div>
        </div>
    )
}
