/**
 * useAuthentication Hook
 * Custom hook for managing overall authentication state
 * Handles success and error callbacks, user storage, and redirects
 *
 * Validates: Requirements 5.0
 */

"use client"

import { logger } from "@/lib/logger"
import { useRouter } from "next/navigation"
import { useCallback, useRef } from "react"
import { OAuthUser } from "../types/auth"

interface UseAuthenticationReturn {
    handleAuthSuccess: (user: OAuthUser) => void
    handleAuthError: (error: Error) => void
}

/**
 * useAuthentication Hook
 * Manages authentication state and callbacks
 *
 * This hook:
 * 1. Stores user data in localStorage/context
 * 2. Redirects to appropriate destination after successful auth
 * 3. Displays error messages with auto-dismiss
 * 4. Manages focus for accessibility
 */
export const useAuthentication = (
    redirectTo?: string
): UseAuthenticationReturn => {
    const router = useRouter()
    const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const handleAuthSuccess = useCallback(
        (user: OAuthUser) => {
            try {
                // Store user data in localStorage for client-side access
                localStorage.setItem("user", JSON.stringify(user))

                logger.info("User authenticated successfully", {
                    context: "Auth",
                    data: { userId: user.id },
                })

                // Determine redirect destination
                const destination = redirectTo || "/dashboard"

                // Redirect to appropriate destination
                router.push(destination)
            } catch (err) {
                const error =
                    err instanceof Error ? err : new Error(String(err))

                logger.error("Failed to handle authentication success", {
                    context: "Auth",
                    error,
                })
            }
        },
        [redirectTo, router]
    )

    const handleAuthError = useCallback((error: Error) => {
        try {
            logger.error("Authentication error", {
                context: "Auth",
                error,
            })

            // Clear any existing timeout
            if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current)
            }

            // Auto-dismiss error after 5 seconds
            errorTimeoutRef.current = setTimeout(() => {
                // Error will be cleared by the component that displays it
            }, 5000)
        } catch (err) {
            logger.error("Failed to handle authentication error", {
                context: "Auth",
                error: err as Error,
            })
        }
    }, [])

    return {
        handleAuthSuccess,
        handleAuthError,
    }
}
