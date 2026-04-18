/**
 * ProtectedRoute Component
 * Wrapper component to protect routes that require authentication
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */

"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface ProtectedRouteProps {
    children: React.ReactNode
}

/**
 * ProtectedRoute Component
 *
 * This component:
 * 1. Checks authentication status using useAuth hook
 * 2. Redirects to /auth/login if not authenticated
 * 3. Renders protected component if authenticated
 * 4. Shows loading state while checking authentication
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/auth/login")
        }
    }, [isAuthenticated, isLoading, router])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-600">Loading...</p>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    return <>{children}</>
}
