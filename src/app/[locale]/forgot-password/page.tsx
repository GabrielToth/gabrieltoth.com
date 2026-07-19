import { locales } from "@/lib/i18n"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import ForgotPasswordForm from "./forgot-password-form"

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
        title: t("forgotPassword.title"),
    }
}

export default async function ForgotPasswordPage({
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
            <main className="min-h-screen bg-background dark:from-gray-900 dark:to-blue-900">
                <div className="flex items-center justify-center min-h-screen pt-20 pb-12 px-4">
                    <div className="w-full max-w-md">
                        <div className="bg-card rounded-lg shadow-xl p-8 border border-border dark:border-border">
                            <h1 className="text-3xl font-bold text-foreground dark:text-foreground mb-2 text-center">
                                {t("forgotPassword.title")}
                            </h1>
                            <p className="text-muted-foreground dark:text-muted-foreground text-center mb-6">
                                {t("forgotPassword.subtitle")}
                            </p>

                            <ForgotPasswordForm locale={locale} />

                            <p className="text-center text-muted-foreground dark:text-muted-foreground mt-6">
                                {t("forgotPassword.rememberPassword")}{" "}
                                <Link
                                    href={`/${locale}/login`}
                                    className="text-primary dark:text-primary hover:text-primary dark:hover:text-primary font-medium"
                                >
                                    {t("forgotPassword.loginLink")}
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
