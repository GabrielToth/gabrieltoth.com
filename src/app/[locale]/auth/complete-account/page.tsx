/**
 * Account Completion Page
 *
 * Multi-step form for completing account setup for legacy OAuth users.
 * Displays pre-filled data, collects new required fields, and verifies all information.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import Header from "@/components/layout/header"
import { locales } from "@/lib/i18n"
import { getTranslations } from "next-intl/server"
import CompleteAccountForm from "./complete-account-form"

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
        title: t("completeAccount.title"),
        description: t("completeAccount.subtitle"),
    }
}

export default async function CompleteAccountPage({
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
                    <div className="w-full max-w-2xl">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-200 dark:border-gray-700">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                                {t("completeAccount.title")}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
                                {t("completeAccount.subtitle")}
                            </p>

                            <CompleteAccountForm locale={locale} />
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
