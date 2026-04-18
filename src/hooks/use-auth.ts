/**
 * useAuth Hook
 * Custom React hook for accessing authenticated user data
 *
 * Validates: Requirements 22.1, 22.2, 22.3, 22.4, 22.5
 */

"use client"

import { logger } from "@/lib/logger"
import { useEffect, useState } from "react"

interface AuthUser {
    id: string
    google_email: string
    google_name: string
    google_picture?: string
}

interface UseAuthReturn {
    user: AuthUser | null
    isAuthenticated: boolean
    isLoading: boolean
    error: Error | null
    logout: () => Promise<void>
}

/**
 * useAuth Hook
 *
 * This hook:
 * 1. Fetches user data from GET /api/auth/me on component mount
 * 2. Returns object with: user, isAuthenticated, isLoading, logout function
 * 3. Handles loading state during fetch
 * 4. Handles error state if fetch fails
 * 5. Provides logout function that calls POST /api/auth/logout
 *
 * Validates: Requirements 22.1, 22.2, 22.3, 22.4, 22.5
 */
export function useAuth(): UseAuthReturn {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    // Fetch user data on component mount
    useEffect(() => {
        const fetchUser = async () => {
            try {
                setIsLoading(true)
                setError(null)

                const response = await fetch("/api/auth/me", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                })

                if (!response.ok) {
                    if (response.status === 401) {
                        // User not authenticated
                        setUser(null)
                        setIsLoading(false)
                        return
                    }

                    const data = await response.json()
                    throw new Error(data.error || "Failed to fetch user data")
                }

                const data = await response.json()
                if (data.success && data.data) {
                    setUser(data.data)
                } else {
                    setUser(null)
                }
            } catch (err) {
                const error =
                    err instanceof Error ? err : new Error(String(err))
                logger.error("Failed to fetch user data", {
                    context: "Auth",
                    error,
                })
                setError(error)
                setUser(null)
            } finally {
                setIsLoading(false)
            }
        }

        fetchUser()
    }, [])

    // Logout function
    const logout = async () => {
        try {
            const response = await fetch("/api/auth/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Logout failed")
            }

            setUser(null)
            logger.info("User logged out successfully", {
                context: "Auth",
            })
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err))
            logger.error("Logout error", {
                context: "Auth",
                error,
            })
            throw error
        }
    }

    return {
        user,
        isAuthenticated: user !== null,
        isLoading,
        error,
        logout,
    }
}
