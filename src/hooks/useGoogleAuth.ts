/**
 * useGoogleAuth Hook
 * Custom hook for managing Google OAuth authentication flow
 * Wraps existing Google OAuth handler and manages loading/error states
 *
 * Validates: Requirements 5.0, 5.1
 */

"use client"

import { logger } from "@/lib/logger"
import { useCallback, useState } from "react"
import { OAuthUser } from "../types/auth"

interface UseGoogleAuthReturn {
    handleGoogleClick: () => void
    isLoading: boolean
    error: Error | null
}

/**
 * useGoogleAuth Hook
 * Manages Google OAuth authentication flow
 *
 * This hook:
 * 1. Manages loading state during OAuth flow
 * 2. Handles errors and provides error state
 * 3. Triggers Google OAuth flow via window.location redirect
 * 4. Calls success/error callbacks appropriately
 */
export const useGoogleAuth = (
    onSuccess: (user: OAuthUser) => void,
    onError: (error: Error) => void
): UseGoogleAuthReturn => {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const handleGoogleClick = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)

            // Get Google OAuth authorization URL from API route
            const response = await fetch("/api/auth/oauth/authorize-google", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(
                    data.error || "Failed to initiate Google OAuth flow"
                )
            }

            const data = await response.json()

            if (!data.success || !data.authorizationUrl) {
                throw new Error("No authorization URL received from server")
            }

            // Redirect to Google OAuth authorization URL
            // This will redirect to Google's login page
            window.location.href = data.authorizationUrl

            // Note: The page will redirect, so the following code won't execute
            // The callback will be handled by the OAuth callback endpoint
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err))

            logger.error("Google OAuth flow failed", {
                context: "Auth",
                error,
            })

            setError(error)
            setIsLoading(false)
            onError(error)
        }
    }, [onSuccess, onError])

    return {
        handleGoogleClick,
        isLoading,
        error,
    }
}
