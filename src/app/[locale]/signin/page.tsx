import UnifiedSignInForm from "@/components/auth/unified-signin-form"
import { Metadata } from "next"
import { getTranslations } from "next-intl/server"

interface SignInPageProps {
    params: Promise<{
        locale: string
    }>
    searchParams: Promise<{
        email?: string
        mode?: "signin" | "signup"
    }>
}

export async function generateMetadata({
    params,
    searchParams,
}: SignInPageProps): Promise<Metadata> {
    const { locale } = await params
    const { mode } = await searchParams
    const t = await getTranslations({ locale, namespace: "auth" })

    const isSignUp = mode === "signup"
    const title = isSignUp ? t("signin.titleSignUp") : t("signin.titleSignIn")
    const description = isSignUp
        ? t("signin.subtitle")
        : t("signin.description")

    return {
        title,
        description,
    }
}

export default async function SignInPage({
    params,
    searchParams,
}: SignInPageProps) {
    const { locale } = await params
    const { email, mode } = await searchParams
    const t = await getTranslations({ locale, namespace: "auth" })

    const isSignUp = mode === "signup"
    const title = isSignUp ? t("signin.titleSignUp") : t("signin.titleSignIn")

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
                    <UnifiedSignInForm locale={locale} initialEmail={email} />
                </div>
            </div>
        </div>
    )
}
