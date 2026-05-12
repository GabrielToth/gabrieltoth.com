import { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { SignInPageClient } from "./signin-page-client"

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
        title: t("signin.titleSignIn"),
        description: t("signin.description"),
    }
}

export default async function SignInPage({
    params,
    searchParams,
}: SignInPageProps) {
    const { locale } = await params
    const { email } = await searchParams

    return <SignInPageClient locale={locale} initialEmail={email} />
}
