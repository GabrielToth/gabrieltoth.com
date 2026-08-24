"use client"

import { logger } from "@/lib/logger"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"

type DashboardTab =
    | "publish"
    | "insights"
    | "channels"
    | "settings"
    | "live"
    | "discover"
    | "repost"
    | "cloner"
import React, { useState } from "react"
import { Sidebar } from "./Sidebar"
import { StreamHealthHeader } from "@/components/dashboard/live/stream-health-header"
import { CreditBadge } from "@/components/credits/CreditBadge"

export interface DashboardLayoutProps {
    children: React.ReactNode
    activeTab: DashboardTab
    onTabChange?: (tab: DashboardTab) => void
}

/**
 * DashboardLayout Component
 * Main layout wrapper for authenticated dashboard
 * Combines Sidebar navigation with main content area
 * Responsive: Sidebar collapses to hamburger on mobile (<768px)
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    children,
    activeTab,
    onTabChange,
}) => {
    const t = useTranslations("dashboard.layout")
    const locale = useLocale()
    const router = useRouter()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [logoutError, setLogoutError] = useState<string | null>(null)

    const handleTabChange = (tab: DashboardTab) => {
        setSidebarOpen(false)
        onTabChange?.(tab)
    }

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true)
            setLogoutError(null)

            const csrfRes = await fetch("/api/auth/csrf")
            if (!csrfRes.ok) {
                throw new Error("Failed to get CSRF token")
            }
            const csrfData = await csrfRes.json()
            const csrfToken = csrfData.data?.csrfToken
            if (!csrfToken) {
                throw new Error("No CSRF token returned")
            }

            const response = await fetch("/api/auth/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                },
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Logout failed")
            }

            logger.info("User logged out successfully", {
                context: "Dashboard",
            })

            router.push(`/${locale}/login`)
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err))
            logger.error("Logout error", {
                context: "Dashboard",
                error,
            })
            setLogoutError(error.message)
        } finally {
            setIsLoggingOut(false)
        }
    }

    return (
        <div className="flex h-screen bg-card dark:bg-background">
            {/* Sidebar */}
            <Sidebar
                activeTab={activeTab}
                onTabChange={handleTabChange}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={handleLogout}
            />

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Main content area */}
            <main className="flex-1 overflow-auto">
                {/* Dashboard Header Bar with Stream Health */}
                <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card px-4 py-2.5">
                    <div className="flex items-center space-x-3 md:hidden">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary min-h-10 min-w-10 md:hidden"
                            aria-label={t("toggleSidebar")}
                            aria-expanded={sidebarOpen}
                        >
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                        </button>
                        <span className="text-sm font-semibold text-foreground">
                            {t("dashboard")}
                        </span>
                    </div>

                    <div className="flex items-center space-x-3">
                        <CreditBadge />
                        <StreamHealthHeader />
                    </div>
                </div>

                {/* Logout error message */}
                {logoutError && (
                    <div className="mx-3 mt-3 sm:mx-4 sm:mt-4 md:mx-6 md:mt-6 rounded-md bg-error-bg p-3 text-sm text-error">
                        {logoutError}
                    </div>
                )}

                {/* Content */}
                <div className="p-3 sm:p-4 md:p-6">{children}</div>
            </main>
        </div>
    )
}
