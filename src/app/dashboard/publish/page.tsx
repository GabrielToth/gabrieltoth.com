"use client"

import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"

function YoutubeLinkBanner() {
    const searchParams = useSearchParams()
    const t = useTranslations("dashboard.youtube")
    const [visible, setVisible] = useState(true)

    const youtubeStatus = searchParams.get("youtube")

    useEffect(() => {
        if (youtubeStatus) {
            const timer = setTimeout(() => setVisible(false), 8000)
            return () => clearTimeout(timer)
        }
    }, [youtubeStatus])

    if (!youtubeStatus || !visible) return null

    const bannerConfig: Record<string, { variant: string; message: string }> = {
        success: {
            variant: "bg-green-50 border-green-200 text-green-800",
            message: t("linkSuccess"),
        },
        error: {
            variant: "bg-red-50 border-red-200 text-red-800",
            message: t("linkError"),
        },
        partial: {
            variant: "bg-yellow-50 border-yellow-200 text-yellow-800",
            message: t("linkPartial"),
        },
    }

    const config = bannerConfig[youtubeStatus]
    if (!config) return null

    return (
        <div
            className={`rounded-lg border p-4 ${config.variant}`}
            role="alert"
        >
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{config.message}</p>
                <button
                    onClick={() => setVisible(false)}
                    className="ml-4 rounded-md p-1 hover:opacity-70"
                    aria-label="Dismiss"
                >
                    <svg
                        className="h-4 w-4"
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
        </div>
    )
}

export default function PublishPage() {
    return (
        <div className="space-y-6">
            <Suspense fallback={null}>
                <YoutubeLinkBanner />
            </Suspense>

            <div>
                <h1 className="text-3xl font-bold text-gray-900">Publish</h1>
                <p className="mt-2 text-gray-600">
                    Manage your scheduled and published posts across all social
                    channels.
                </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
                <p className="text-gray-500">
                    Publish content management coming soon...
                </p>
            </div>
        </div>
    )
}
