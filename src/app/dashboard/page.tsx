"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

/**
 * Dashboard Root Page
 * Redirects to the Publish tab by default
 */
export default function DashboardPage() {
    const router = useRouter()

    useEffect(() => {
        // Redirect to publish tab on initial load
        router.push("/dashboard/publish")
    }, [router])

    return (
        <div className="flex h-screen items-center justify-center">
            <div className="text-center">
                <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"></div>
                <p className="text-gray-600">Redirecting to dashboard...</p>
            </div>
        </div>
    )
}
