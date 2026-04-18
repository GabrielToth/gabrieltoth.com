/**
 * GoogleLogoutButton Component
 * Displays a button to logout the current user
 *
 * Validates: Requirements 21.1, 21.2, 21.3, 21.4
 */

"use client"

import { logger } from "@/lib/logger"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface GoogleLogoutButtonProps {
    onSuccess?: () => void
    onError?: (error: Error) => void
    className?: string
}

/**
 * GoogleLogoutButton Component
 *
 * This component:
 * 1. Displays a button with text "Logout"
 * 2. Handles click event
 * 3. Sends POST request to /api/auth/logout
 * 4. Redirects to /auth/login on success
 * 5. Displays error message on failure
 *
 * Validates: Requirements 21.1, 21.2, 21.3, 21.4
 */
export function GoogleLogoutButton({
    onSuccess,
    onError,
    className = "",
}: GoogleLogoutButtonProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleLogout = async () => {
        try {
            setIsLoading(true)
            setError(null)

            // Send logout request to backend
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

            logger.info("User logged out successfully", {
                context: "Auth",
            })

            // Call success callback
            onSuccess?.()

            // Redirect to login page
            router.push("/auth/login")
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err))
            logger.error("Logout error", {
                context: "Auth",
                error,
            })
            setError(error.message)
            onError?.(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-2">
            <button
                onClick={handleLogout}
                disabled={isLoading}
                className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
            >
                {isLoading ? "Logging out..." : "Logout"}
            </button>
            {error && <div className="text-red-600 text-sm">{error}</div>}
        </div>
    )
}
