/**
 * Account Completion Page
 *
 * Multi-step form for completing account setup for legacy OAuth users.
 * Displays pre-filled data, collects new required fields, and verifies all information.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

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
            <main className="min-h-screen bg-background dark:from-gray-900 dark:to-blue-900">
                <div className="flex items-center justify-center min-h-screen pt-20 pb-12 px-4">
                    <div className="w-full max-w-2xl">
                        <div className="bg-card rounded-lg shadow-xl p-8 border border-border dark:border-border">
                            <h1 className="text-3xl font-bold text-foreground dark:text-foreground mb-2 text-center">
                                {t("completeAccount.title")}
                            </h1>
                            <p className="text-muted-foreground dark:text-muted-foreground text-center mb-8">
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
