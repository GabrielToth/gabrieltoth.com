import { RegistrationFlow } from "@/components/registration/RegistrationFlow"
import { locales } from "@/lib/i18n"
import { getTranslations } from "next-intl/server"

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
        title: t("register.title") || "Create Account",
    }
}

export default async function RegisterPage({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params

    return (
        <>
            <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900">
                <RegistrationFlow />
            </main>
        </>
    )
}
