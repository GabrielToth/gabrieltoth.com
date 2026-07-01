"use client"

import { logger } from "@/lib/logger"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import React, { useState } from "react"
import { Sidebar } from "./Sidebar"

export interface DashboardLayoutProps {
    children: React.ReactNode
    activeTab: "publish" | "insights" | "channels" | "settings"
    onTabChange?: (tab: "publish" | "insights" | "channels" | "settings") => void
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

    const handleTabChange = (tab: "publish" | "insights" | "channels" | "settings") => {
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
        <div className="flex h-screen bg-white dark:bg-gray-950">
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
                {/* Mobile header with hamburger */}
                <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-3 sm:px-4 md:hidden">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-10 min-w-10"
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
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                        {t("dashboard")}
                    </span>
                </div>

                {/* Logout error message */}
                {logoutError && (
                    <div className="mx-3 mt-3 sm:mx-4 sm:mt-4 md:mx-6 md:mt-6 rounded-md bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-800 dark:text-red-400">
                        {logoutError}
                    </div>
                )}

                {/* Content */}
                <div className="p-3 sm:p-4 md:p-6">{children}</div>
            </main>
        </div>
    )
}
