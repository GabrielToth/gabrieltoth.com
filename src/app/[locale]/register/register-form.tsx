"use client"

import { GoogleLoginButton } from "@/components/auth/google-login-button"

interface RegisterFormProps {
    locale: string
}

export default function RegisterForm({ _locale }: RegisterFormProps) {
    return <GoogleLoginButton className="w-full" />
}
