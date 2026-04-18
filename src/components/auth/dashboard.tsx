"use client"

/**
 * Dashboard Component
 * Protected component for authenticated users
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { GoogleLogoutButton } from "@/components/auth/google-logout-button"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

/**
 * Dashboard Component
 *
 * This component:
 * 1. Uses useAuth hook to get user data
 * 2. Displays user name, email, and profile picture
 * 3. Displays GoogleLogoutButton
 * 4. Shows loading state while fetching user data
 * 5. Redirects to /auth/login if not authenticated
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */
export function Dashboard() {
    const { user, isLoading, isAuthenticated } = useAuth()
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

    if (!user) {
        return null
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="rounded-lg bg-white shadow">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Dashboard
                        </h1>
                    </div>

                    <div className="px-6 py-8">
                        <div className="mb-8 rounded-lg bg-blue-50 p-6">
                            <div className="flex items-center gap-4">
                                {user.google_picture && (
                                    <img
                                        src={user.google_picture}
                                        alt={user.google_name}
                                        className="w-16 h-16 rounded-full"
                                    />
                                )}
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Welcome, {user.google_name}!
                                    </h2>
                                    <p className="text-gray-700">
                                        {user.google_email}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Account Actions
                            </h3>
                            <GoogleLogoutButton />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
