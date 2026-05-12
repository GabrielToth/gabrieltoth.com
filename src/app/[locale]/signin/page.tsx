import { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { SignInPageClient } from "./signin-page-client"

interface SignInPageProps {
    params: Promise<{
        locale: string
    }>
    searchParams: Promise<{
        email?: string
        mode?: "signin" | "signup"
    }>
}

export async function generateMetadata({
    params,
    searchParams,
}: SignInPageProps): Promise<Metadata> {
    const { locale } = await params
    const { mode } = await searchParams
    const t = await getTranslations({ locale, namespace: "auth" })

    const isSignUp = mode === "signup"
    const title = isSignUp ? t("signin.titleSignUp") : t("signin.titleSignIn")
    const description = isSignUp
        ? t("signin.subtitle")
        : t("signin.description")

    return {
        title,
        description,
    }
}

export default async function SignInPage({
    params,
    searchParams,
}: SignInPageProps) {
    const { locale } = await params
    const { email, mode } = await searchParams

    return (
        <SignInPageClient
            locale={locale}
            initialEmail={email}
            initialMode={mode || "signin"}
        />
    )
}
