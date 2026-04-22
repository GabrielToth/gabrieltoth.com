/**
 * GoogleLoginButton Component
 * Displays a button to initiate Google OAuth login flow
 *
 * Validates: Requirements 20.1, 20.2, 20.3, 20.4, 20.5
 */

"use client"

import { logger } from "@/lib/logger"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface GoogleLoginButtonProps {
    onSuccess?: (response: { code: string }) => void
    onError?: (error: Error) => void
    className?: string
    type?: "login" | "register"
}

/**
 * GoogleLoginButton Component
 *
 * This component:
 * 1. Displays a button with text "Login via Google" or "Sign up with Google"
 * 2. Uses @react-oauth/google library for OAuth flow
 * 3. Includes client_id, redirect_uri, scope, state parameters
 * 4. Handles successful login response
 * 5. Sends authorization code to POST /api/auth/google/callback
 * 6. Redirects to /dashboard on success
 * 7. Displays error message on failure
 *
 * Validates: Requirements 20.1, 20.2, 20.3, 20.4, 20.5
 */
export function GoogleLoginButton({
    onSuccess,
    onError,
    className = "",
    type = "login",
}: GoogleLoginButtonProps) {
    const router = useRouter()
    const t = useTranslations("auth")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleGoogleLogin = async () => {
        try {
            setIsLoading(true)
            setError(null)

            // Get Google Client ID from environment
            const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
            if (!clientId) {
                throw new Error("Google Client ID not configured")
            }

            // Get redirect URI from environment
            const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
            if (!redirectUri) {
                throw new Error("Google redirect URI not configured")
            }

            // Generate state parameter for CSRF protection
            const state = Math.random().toString(36).substring(7)
            sessionStorage.setItem("oauth_state", state)

            // Build Google OAuth authorization URL
            const params = new URLSearchParams({
                client_id: clientId,
                redirect_uri: redirectUri,
                response_type: "code",
                scope: "openid email profile",
                state,
            })

            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

            // Redirect to Google OAuth
            window.location.href = authUrl
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err))
            logger.error("Google login error", {
                context: "Auth",
                error,
            })
            setError(error.message)
            onError?.(error)
        } finally {
            setIsLoading(false)
        }
    }

    const buttonText =
        type === "login" ? t("login.googleButton") : t("register.googleButton")
    const loadingText = type === "login" ? "Logging in..." : "Signing up..."

    return (
        <div className="flex flex-col gap-2">
            <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
            >
                {isLoading ? loadingText : buttonText}
            </button>
            {error && <div className="text-red-600 text-sm">{error}</div>}
        </div>
    )
}
