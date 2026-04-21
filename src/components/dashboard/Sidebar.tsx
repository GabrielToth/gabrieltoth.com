"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import React from "react"

export interface SidebarProps {
    activeTab: "publish" | "insights" | "settings"
    onTabChange: (tab: "publish" | "insights" | "settings") => void
    isOpen?: boolean
    onClose?: () => void
    organization?: {
        name: string
        plan: "free" | "pro" | "enterprise"
    }
    onLogout?: () => void
}

/**
 * Sidebar Component
 * Navigation and organization info sidebar
 * Features:
 * - Logo (40x40)
 * - Navigation Menu (Publish, Insights, Settings)
 * - Connect Channels section
 * - Organization Info
 * - Logout Button
 * - Responsive: 240px on desktop, hamburger on mobile (<768px)
 * - Touch-friendly buttons (44x44px minimum)
 * - Readable text sizes (16px minimum on mobile)
 */
export const Sidebar: React.FC<SidebarProps> = ({
    activeTab,
    onTabChange,
    isOpen = false,
    onClose,
    organization = {
        name: "My Organization",
        plan: "pro",
    },
    onLogout,
}) => {
    const navItems = [
        { id: "publish", label: "Publish", icon: "📝" },
        { id: "insights", label: "Insights", icon: "📊" },
        { id: "settings", label: "Settings", icon: "⚙️" },
    ] as const

    const channels = [
        { id: "facebook", name: "Facebook", icon: "f" },
        { id: "instagram", name: "Instagram", icon: "📷" },
        { id: "twitter", name: "Twitter/X", icon: "𝕏" },
        { id: "tiktok", name: "TikTok", icon: "♪" },
        { id: "linkedin", name: "LinkedIn", icon: "in" },
    ]

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "hidden w-60 flex-col border-r border-gray-200 bg-white md:flex",
                    "overflow-y-auto"
                )}
            >
                {/* Logo Section */}
                <div className="flex items-center justify-center border-b border-gray-200 px-6 py-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
                        D
                    </div>
                    <span className="ml-3 text-lg font-semibold text-gray-900">
                        Dashboard
                    </span>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 space-y-1 px-3 py-6">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={cn(
                                "w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors min-h-11",
                                activeTab === item.id
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-gray-700 hover:bg-gray-50"
                            )}
                            aria-current={
                                activeTab === item.id ? "page" : undefined
                            }
                        >
                            <span className="mr-3">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* Connect Channels Section */}
                <div className="border-t border-gray-200 px-6 py-4">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Connect Channels
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                        {channels.map(channel => (
                            <button
                                key={channel.id}
                                className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-colors min-h-11 min-w-11"
                                title={channel.name}
                                aria-label={`Connect ${channel.name}`}
                            >
                                {channel.icon}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Organization Info */}
                <div className="border-t border-gray-200 px-6 py-4">
                    <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs font-semibold text-gray-600">
                            Organization
                        </p>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                            {organization.name}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 capitalize">
                            {organization.plan} Plan
                        </p>
                    </div>
                </div>

                {/* Logout Button */}
                <div className="border-t border-gray-200 px-3 py-4">
                    <Button
                        onClick={onLogout}
                        variant="ghost"
                        className="w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900 min-h-11"
                    >
                        <span className="mr-2">🚪</span>
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Mobile Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-40 w-60 flex-col border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out md:hidden",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Close Button */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
                            D
                        </div>
                        <span className="ml-3 text-lg font-semibold text-gray-900">
                            Dashboard
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-md p-2 text-gray-600 hover:bg-gray-100 min-h-11 min-w-11"
                        aria-label="Close sidebar"
                    >
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 space-y-1 px-3 py-6">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={cn(
                                "w-full rounded-lg px-4 py-3 text-left text-base font-medium transition-colors min-h-11",
                                activeTab === item.id
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-gray-700 hover:bg-gray-50"
                            )}
                            aria-current={
                                activeTab === item.id ? "page" : undefined
                            }
                        >
                            <span className="mr-3">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* Connect Channels Section */}
                <div className="border-t border-gray-200 px-6 py-4">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Connect Channels
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                        {channels.map(channel => (
                            <button
                                key={channel.id}
                                className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-colors min-h-11 min-w-11"
                                title={channel.name}
                                aria-label={`Connect ${channel.name}`}
                            >
                                {channel.icon}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Organization Info */}
                <div className="border-t border-gray-200 px-6 py-4">
                    <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs font-semibold text-gray-600">
                            Organization
                        </p>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                            {organization.name}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 capitalize">
                            {organization.plan} Plan
                        </p>
                    </div>
                </div>

                {/* Logout Button */}
                <div className="border-t border-gray-200 px-3 py-4">
                    <Button
                        onClick={onLogout}
                        variant="ghost"
                        className="w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900 min-h-11"
                    >
                        <span className="mr-2">🚪</span>
                        Logout
                    </Button>
                </div>
            </aside>
        </>
    )
}
