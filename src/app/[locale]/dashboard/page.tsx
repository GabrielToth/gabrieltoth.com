"use client"

import { useLocale, useTranslations } from "next-intl"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"

function DashboardRedirect() {
    const t = useTranslations("dashboard.common")
    const locale = useLocale()
    const router = useRouter()
    const searchParams = useSearchParams()
    const youtubeParam = searchParams.get("youtube")
    const tiktokParam = searchParams.get("tiktok")
    const tiktokReason = searchParams.get("reason")

    const [tiktokMsg, setTiktokMsg] = useState<string | null>(null)
    const [isError, setIsError] = useState(false)

    useEffect(() => {
        if (tiktokParam) {
            const msg = tiktokReason || "unknown"
            if (tiktokParam === "success") {
                console.log("TikTok OAuth success")
                setTiktokMsg("✅ TikTok conectado com sucesso!")
                setIsError(false)
                setTimeout(() => router.push(`/${locale}/dashboard/channels`), 1500)
            } else {
                console.log("TikTok OAuth error:", msg)
                setTiktokMsg(`❌ TikTok: ${decodeURIComponent(msg)}`)
                setIsError(true)
                setTimeout(() => router.push(`/${locale}/dashboard/publish`), 5000)
            }
            return
        }

        const target = youtubeParam
            ? `/${locale}/dashboard/publish?youtube=${encodeURIComponent(youtubeParam)}`
            : `/${locale}/dashboard/publish`
        router.push(target)
    }, [router, youtubeParam, locale, tiktokParam, tiktokReason])

    if (tiktokMsg) {
        return (
            <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", height: "60vh", padding: "2rem"
            }}>
                <div style={{
                    padding: "2rem", borderRadius: "8px", maxWidth: "600px",
                    background: isError ? "#fff0f0" : "#f0fff0",
                    border: `2px solid ${isError ? "#ff4444" : "#44bb44"}`
                }}>
                    <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", fontSize: "14px" }}>
                        {tiktokMsg}
                    </pre>
                </div>
            </div>
        )
    }

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
