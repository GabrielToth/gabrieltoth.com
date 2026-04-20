import { getTranslations } from "next-intl/server"
import Link from "next/link"
import ResetPasswordForm from "./reset-password-form"

export function generateStaticParams() {
    return [
        { locale: "en" },
        { locale: "pt-BR" },
        { locale: "es" },
        { locale: "de" },
    ]
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "auth" })

    return {
        title: t("resetPassword.title"),
        description: t("resetPassword.subtitle"),
    }
}

export default async function ResetPasswordPage({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "auth" })

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                        {t("resetPassword.title")}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        {t("resetPassword.subtitle")}
                    </p>
                </div>

                <div className="mt-8 bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <ResetPasswordForm locale={locale} />

                    <p className="text-center text-gray-600 dark:text-gray-400 mt-6">
                        <Link
                            href={`/${locale}/login`}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                            {t("resetPassword.loginLink")}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
