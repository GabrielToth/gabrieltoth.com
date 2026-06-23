/**
 * useEmailAuth Hook
 * Custom hook for managing email authentication flow
 * Wraps existing email auth handler and manages loading/error states
 *
 * Validates: Requirements 2.0, 5.0, 5.3
 */

"use client"

import { logger } from "@/lib/logger"
import { useCallback, useState } from "react"
import { OAuthUser } from "../types/auth"

interface UseEmailAuthReturn {
    handleEmailSubmit: (email: string, password: string) => Promise<void>
    isLoading: boolean
    error: Error | null
}

/**
 * useEmailAuth Hook
 * Manages email authentication flow
 *
 * This hook:
 * 1. Manages loading state during email auth
 * 2. Handles errors and provides error state
 * 3. Submits email/password to API route for authentication
 * 4. Calls success/error callbacks appropriately
 */
export const useEmailAuth = (
    onSuccess: (user: OAuthUser) => void,
    onError: (error: Error) => void
): UseEmailAuthReturn => {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const handleEmailSubmit = useCallback(
        async (email: string, password: string) => {
            try {
                setIsLoading(true)
                setError(null)

                // Validate inputs
                if (!email || !password) {
                    throw new Error("Email and password are required")
                }

                // Submit email/password to API route for authentication
                const response = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email,
                        password,
                    }),
                })

                if (!response.ok) {
                    const data = await response.json()
                    throw new Error(data.error || "Email authentication failed")
                }

                const data = await response.json()

                if (!data.success || !data.data) {
                    throw new Error("Invalid response from server")
                }

                // Call success callback with user data
                onSuccess(data.data)
            } catch (err) {
                const error =
                    err instanceof Error ? err : new Error(String(err))

                logger.error("Email authentication failed", {
                    context: "Auth",
                    error,
                })

                setError(error)
                onError(error)
            } finally {
                setIsLoading(false)
            }
        },
        [onSuccess, onError]
    )

    return {
        handleEmailSubmit,
        isLoading,
        error,
    }
}
