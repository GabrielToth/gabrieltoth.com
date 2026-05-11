import UnifiedSignInForm from "@/components/auth/unified-signin-form"
import { Metadata } from "next"
import { getTranslations } from "next-intl/server"

interface SignInPageProps {
    params: Promise<{
        locale: string
    }>
    searchParams: Promise<{
        email?: string
    }>
}

export async function generateMetadata({
    params,
}: SignInPageProps): Promise<Metadata> {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "auth" })

    return {
        title: t("signin.title"),
        description: t("signin.description"),
    }
}

export default async function SignInPage({
    params,
    searchParams,
}: SignInPageProps) {
    const { locale } = await params
    const { email } = await searchParams
    const t = await getTranslations({ locale, namespace: "auth" })

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            {t("signin.title")}
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
