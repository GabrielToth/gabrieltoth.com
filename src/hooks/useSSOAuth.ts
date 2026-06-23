/**
 * useSSOAuth Hook
 * Custom hook for managing SSO (Single Sign-On) authentication flow
 * Wraps existing SSO handler and manages loading/error states
 *
 * Validates: Requirements 5.0, 5.2
 */

"use client"

import { logger } from "@/lib/logger"
import { useCallback, useState } from "react"
import { OAuthUser } from "../types/auth"

interface UseSSOAuthReturn {
    handleSSOClick: () => void
    isLoading: boolean
    error: Error | null
}

/**
 * useSSOAuth Hook
 * Manages SSO (Single Sign-On) authentication flow
 *
 * This hook:
 * 1. Manages loading state during SSO flow
 * 2. Handles errors and provides error state
 * 3. Triggers SSO flow via window.location redirect
 * 4. Calls success/error callbacks appropriately
 */
export const useSSOAuth = (
    onSuccess: (user: OAuthUser) => void,
    onError: (error: Error) => void
): UseSSOAuthReturn => {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const handleSSOClick = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)

            // Get SSO authorization URL from API route
            const response = await fetch("/api/auth/oauth/authorize-sso", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to initiate SSO flow")
            }

            const data = await response.json()

            if (!data.success) {
                throw new Error(
                    data.error || "SSO authentication is not available"
                )
            }

            // If SSO is configured, redirect to SSO provider
            if (data.authorizationUrl) {
                window.location.href = data.authorizationUrl
            }

            // Note: The page will redirect, so the following code won't execute
            // The callback will be handled by the OAuth callback endpoint
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err))

            logger.error("SSO flow failed", {
                context: "Auth",
                error,
            })

            setError(error)
            setIsLoading(false)
            onError(error)
        }
    }, [onSuccess, onError])

    return {
        handleSSOClick,
        isLoading,
        error,
    }
}
