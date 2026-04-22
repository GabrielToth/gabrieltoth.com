"use client"

import { useEffect, useState } from "react"
import { ErrorDisplay } from "./ErrorDisplay"

/**
 * GoogleOAuthFlow Component - Step 1: OAuth Authorization
 *
 * Handles Google OAuth authorization flow:
 * 1. Displays authorization button
 * 2. Redirects to Google OAuth consent screen
 * 3. Handles authorization callback
 * 4. Extracts email and name from Google profile
 * 5. Handles authorization failures with error messages
 *
 * Validates: Requirements 5.1-5.9, 26.1-26.7
 */

interface GoogleOAuthFlowProps {
    onComplete: (data: {
        email: string
        name: string
        birthDate: string
        phone: string
    }) => void
    onBack: () => void
    googleClientId: string
}

export function GoogleOAuthFlow({
    onComplete,
    onBack,
    googleClientId,
}: GoogleOAuthFlowProps) {
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isProcessingCallback, setIsProcessingCallback] = useState(false)

    /**
     * Handle OAuth callback from Google
     * Exchanges authorization code for access token and extracts user data
     */
    useEffect(() => {
        const handleOAuthCallback = async () => {
            const params = new URLSearchParams(window.location.search)
            const code = params.get("code")
            const state = params.get("state")
            const errorParam = params.get("error")

            // Check for authorization errors from Google
            if (errorParam) {
                const errorDescription =
                    params.get("error_description") || errorParam
                console.warn("Google OAuth error:", errorDescription)
                setError("Google authorization failed. Please try again.")
                return
            }

            // No authorization code means this is not a callback
            if (!code) {
                return
            }

            setIsProcessingCallback(true)
            try {
                // Validate CSRF state token
                const savedState = sessionStorage.getItem("oauth_state")
                if (!savedState || savedState !== state) {
                    console.warn("CSRF state validation failed")
                    setError("Security validation failed. Please try again.")
                    return
                }

                // Exchange authorization code for access token
                const response = await fetch("/api/auth/google/callback", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code, state }),
                })

                const data = await response.json()

                if (!response.ok) {
                    console.error("OAuth callback error:", data.error)
                    setError(
                        data.error ||
                            "Google authorization failed. Please try again."
                    )
                    return
                }

                // Extract email and name from Google profile
                const googleEmail = data.data?.email
                const googleName = data.data?.name

                if (!googleEmail || !googleName) {
                    console.error("Missing email or name from Google profile")
                    setError(
                        "Failed to extract profile information from Google. Please try again."
                    )
                    return
                }

                // Clean up URL to remove authorization code
                window.history.replaceState(
                    {},
                    document.title,
                    window.location.pathname
                )

                // Clear OAuth state from session storage
                sessionStorage.removeItem("oauth_state")

                // Call onComplete with extracted data
                // birthDate and phone will be collected in the next step
                onComplete({
                    email: googleEmail,
                    name: googleName,
                    birthDate: "",
                    phone: "",
                })
            } catch (err) {
                console.error("OAuth callback error:", err)
                setError("Google authorization failed. Please try again.")
            } finally {
                setIsProcessingCallback(false)
            }
        }

        handleOAuthCallback()
    }, [onComplete])

    /**
     * Start Google OAuth authorization flow
     * Generates CSRF state token and redirects to Google OAuth consent screen
     */
    const handleStartOAuth = () => {
        setIsLoading(true)
        setError(null)

        try {
            // Validate Google Client ID
            if (!googleClientId) {
                console.error("Google Client ID not configured")
                setError(
                    "Google OAuth is not properly configured. Please try again later."
                )
                setIsLoading(false)
                return
            }

            // Generate CSRF state token for security
            const state = Math.random().toString(36).substring(7)
            sessionStorage.setItem("oauth_state", state)

            // Get redirect URI from environment or construct from current origin
            const redirectUri =
                process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ||
                (typeof window !== "undefined"
                    ? `${window.location.origin}/api/auth/google/callback`
                    : "")

            if (!redirectUri) {
                console.error("Google redirect URI not configured")
                setError(
                    "Google OAuth is not properly configured. Please try again later."
                )
                setIsLoading(false)
                return
            }

            // Construct Google OAuth authorization URL
            // Scopes: email (user's email), profile (user's name and picture)
            const params = new URLSearchParams({
                client_id: googleClientId,
                redirect_uri: redirectUri,
                response_type: "code",
                scope: "email profile",
                state,
                // Optional: prompt user to select account even if already logged in
                prompt: "select_account",
            })

            // Redirect to Google OAuth consent screen
            window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
        } catch (err) {
            console.error("OAuth initialization error:", err)
            setError("Failed to start Google authorization. Please try again.")
            setIsLoading(false)
        }
    }

    /**
     * Retry authorization after error
     */
    const handleRetry = () => {
        setError(null)
        handleStartOAuth()
    }

    // Show loading state while processing OAuth callback
    if (isProcessingCallback) {
        return (
            <div className="w-full space-y-6">
                <div className="text-center">
                    <div className="mb-4 flex justify-center">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full" />
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">
                        Authorizing with Google
                    </h2>
                    <p className="text-gray-400">
                        Please wait while we complete your authorization...
                    </p>
                </div>
            </div>
        )
    }

    // OAuth Authorization Step
    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">
                    Sign up with Google
                </h2>
                <p className="text-gray-400">
                    Click the button below to authorize with your Google account
                </p>
            </div>

            {/* Error Display */}
            {error && (
                <ErrorDisplay error={error} onDismiss={() => setError(null)} />
            )}

            {/* Authorization Buttons */}
            <div className="flex flex-col gap-3">
                {/* Authorize with Google Button */}
                <button
                    onClick={handleStartOAuth}
                    disabled={isLoading}
                    className="w-full px-6 py-3 sm:py-3 bg-white hover:bg-gray-100 disabled:bg-white disabled:opacity-50 text-gray-900 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 border border-gray-300 disabled:cursor-not-allowed min-h-[44px] text-base sm:text-sm"
                    aria-label="Authorize with Google"
                >
                    {isLoading ? (
                        <>
                            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                            <span>Authorizing...</span>
                        </>
                    ) : (
                        <>
                            {/* Google Logo */}
                            <svg
                                className="w-5 h-5"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                aria-hidden="true"
                            >
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span>Authorize with Google</span>
                        </>
                    )}
                </button>

                {/* Try Again Button (shown when error occurs) */}
                {error && (
                    <button
                        onClick={handleRetry}
                        disabled={isLoading}
                        className="w-full px-6 py-3 sm:py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed min-h-[44px] text-base sm:text-sm"
                        aria-label="Try authorization again"
                    >
                        Try Again
                    </button>
                )}

                {/* Back Button */}
                <button
                    onClick={onBack}
                    disabled={isLoading}
                    className="w-full px-6 py-3 sm:py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed min-h-[44px] text-base sm:text-sm"
                    aria-label="Go back to authentication method selection"
                >
                    Back
                </button>
            </div>

            {/* Info Text */}
            <p className="text-xs text-gray-500 text-center">
                We'll use your Google email and name to create your account.
                You'll be able to add more information in the next step.
            </p>
        </div>
    )
}
