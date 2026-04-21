"use client"

import { DashboardLayout } from "@/components/dashboard/DashboardLayout"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

type DashboardTab = "publish" | "insights" | "settings"

/**
 * Dashboard Layout
 * Wraps all dashboard routes with the DashboardLayout component
 * Handles tab navigation and authentication checks
 */
export default function DashboardRootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const [activeTab, setActiveTab] = useState<DashboardTab>("publish")
    const [isLoading, setIsLoading] = useState(true)

    // Determine active tab based on current pathname
    useEffect(() => {
        if (pathname.includes("/dashboard/publish")) {
            setActiveTab("publish")
        } else if (pathname.includes("/dashboard/insights")) {
            setActiveTab("insights")
        } else if (pathname.includes("/dashboard/settings")) {
            setActiveTab("settings")
        } else {
            setActiveTab("publish")
        }
        setIsLoading(false)
    }, [pathname])

    // Handle tab changes with navigation
    const handleTabChange = (tab: DashboardTab) => {
        setActiveTab(tab)
        router.push(`/dashboard/${tab}`)
    }

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <div className="text-center">
                    <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <DashboardLayout activeTab={activeTab} onTabChange={handleTabChange}>
            {children}
        </DashboardLayout>
    )
}
