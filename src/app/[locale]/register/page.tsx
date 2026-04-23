import Header from "@/components/layout/header"
import { locales } from "@/lib/i18n"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import RegisterFormMultistep from "./register-form-multistep"

export function generateStaticParams() {
    return locales.map(locale => ({ locale }))
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    const t = await getTranslations({
        locale,
        namespace: "auth",
    })
    return {
        title: t("register.title"),
    }
}

export default async function RegisterPage({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    const t = await getTranslations({
        locale,
        namespace: "auth",
    })

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

                            <RegisterFormMultistep locale={locale} />

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
