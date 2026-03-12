import Header from "@/components/layout/header"
import { locales } from "@/lib/i18n"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import LoginForm from "./login-form"

export function generateStaticParams() {
    return locales.map(locale => ({ locale }))
}

export async function generateMetadata({
    params,
}: {
    params: { locale: string }
}) {
    const t = await getTranslations({
        locale: params.locale,
        namespace: "auth",
    })
    return {
        title: t("login.title"),
    }
}

export default async function LoginPage({
    params,
}: {
    params: { locale: string }
}) {
    const t = await getTranslations({
        locale: params.locale,
        namespace: "auth",
    })
    const locale = params.locale

    return (
        <>
            <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900">
                <Header />
                <div className="flex items-center justify-center min-h-screen pt-20 pb-12 px-4">
                    <div className="w-full max-w-md">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-200 dark:border-gray-700">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                                {t("login.title")}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                                {t("login.subtitle")}
                            </p>

                            <LoginForm locale={locale} />

                            <p className="text-center text-gray-600 dark:text-gray-400 mt-6">
                                {t("login.noAccount")}{" "}
                                <Link
                                    href={`/${locale}/register`}
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                                >
                                    {t("login.registerLink")}
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
