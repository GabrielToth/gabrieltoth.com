"use client"

import { useLocale, useTranslations } from "next-intl"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect } from "react"

function DashboardRedirect() {
    const t = useTranslations("dashboard.common")
    const locale = useLocale()
    const router = useRouter()
    const searchParams = useSearchParams()
    const youtubeParam = searchParams.get("youtube")

    useEffect(() => {
        const target = youtubeParam
            ? `/${locale}/dashboard/publish?youtube=${encodeURIComponent(youtubeParam)}`
            : `/${locale}/dashboard/publish`
        router.push(target)
    }, [router, youtubeParam, locale])

    return (
        <div className="flex h-screen items-center justify-center">
            <div className="text-center">
                <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"></div>
                <p className="text-gray-600">{t("redirecting")}</p>
            </div>
        </div>
    )
}

export default function DashboardPage() {
    return (
        <Suspense fallback={null}>
            <DashboardRedirect />
        </Suspense>
    )
}
