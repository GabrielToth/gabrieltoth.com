"use client"

import React, { useState } from "react"
import { Sidebar } from "./Sidebar"

export interface DashboardLayoutProps {
    children: React.ReactNode
    activeTab: "publish" | "insights" | "settings"
    onTabChange?: (tab: "publish" | "insights" | "settings") => void
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
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const handleTabChange = (tab: "publish" | "insights" | "settings") => {
        setSidebarOpen(false)
        onTabChange?.(tab)
    }

    return (
        <div className="flex h-screen bg-white">
            {/* Sidebar */}
            <Sidebar
                activeTab={activeTab}
                onTabChange={handleTabChange}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
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
                <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-3 py-3 sm:px-4 md:hidden">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-10 min-w-10"
                        aria-label="Toggle sidebar"
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
                    <span className="text-xs sm:text-sm font-medium text-gray-900">
                        Dashboard
                    </span>
                    <div className="w-10" />
                </div>

                {/* Content */}
                <div className="p-3 sm:p-4 md:p-6">{children}</div>
            </main>
        </div>
    )
}
