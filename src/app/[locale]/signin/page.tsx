import { cookies } from "next/headers"
import { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { redirect } from "next/navigation"
import { SignInPageClient } from "./signin-page-client"

const SESSION_TOKEN_HEX_REGEX = /^[a-f0-9]{64}$/

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

    // Redirect authenticated users to dashboard
    const cookieStore = await cookies()
    const hasSession = !!cookieStore
        .get("auth_session")
        ?.value?.match(SESSION_TOKEN_HEX_REGEX)
    const hasRememberMe = !!cookieStore
        .get("remember_me_token")
        ?.value?.match(SESSION_TOKEN_HEX_REGEX)

    if (hasSession || hasRememberMe) {
        redirect(`/${locale}/dashboard`)
    }

    return <SignInPageClient locale={locale} initialEmail={email} />
}
