"use client"

import { GoogleLoginButton } from "@/components/auth/google-login-button"

interface LoginFormProps {
    locale: string
}

export default function LoginForm({ _locale }: LoginFormProps) {
    return <GoogleLoginButton className="w-full" />
}
