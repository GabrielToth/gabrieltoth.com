import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const SESSION_TOKEN_HEX_REGEX = /^[a-f0-9]{64}$/

export default async function LoginPage({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params

    // Check if user already has an active session
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

    redirect(`/${locale}/signin`)
}
