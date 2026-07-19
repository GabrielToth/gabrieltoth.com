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
    searchParams,
}: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ token?: string }>
}) {
    const { locale } = await params
    const { token } = await searchParams
    const t = await getTranslations({ locale, namespace: "auth" })

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted dark:bg-background py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground dark:text-foreground">
                        {t("resetPassword.title")}
                    </h2>
                    <p className="mt-2 text-center text-sm text-muted-foreground dark:text-muted-foreground">
                        {t("resetPassword.subtitle")}
                    </p>
                </div>

                <div className="mt-8 bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <ResetPasswordForm locale={locale} token={token} />

                    <p className="text-center text-muted-foreground dark:text-muted-foreground mt-6">
                        <Link
                            href={`/${locale}/login`}
                            className="text-primary dark:text-primary hover:text-primary dark:hover:text-primary"
                        >
                            {t("resetPassword.loginLink")}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
