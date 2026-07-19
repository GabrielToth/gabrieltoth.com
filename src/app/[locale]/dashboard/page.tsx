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
    const twitchParam = searchParams.get("twitch")
    const kickParam = searchParams.get("kick")

    const [oauthMsg, setOauthMsg] = useState<{
        text: string
        isError: boolean
    } | null>(null)

    useEffect(() => {
        // TikTok OAuth response
        if (tiktokParam) {
            const msg = tiktokReason || "unknown"
            if (tiktokParam === "success") {
                console.log("TikTok OAuth success")
                setOauthMsg({
                    text: "✅ TikTok connected successfully!",
                    isError: false,
                })
                setTimeout(
                    () => router.push(`/${locale}/dashboard/channels`),
                    1500
                )
            } else {
                console.log("TikTok OAuth error:", msg)
                setOauthMsg({
                    text: `❌ TikTok: ${decodeURIComponent(msg)}`,
                    isError: true,
                })
                setTimeout(
                    () => router.push(`/${locale}/dashboard/publish`),
                    5000
                )
            }
            return
        }

        // Twitch OAuth response
        if (twitchParam) {
            if (twitchParam === "success") {
                setOauthMsg({
                    text: "✅ Twitch connected successfully!",
                    isError: false,
                })
                setTimeout(() => router.push(`/${locale}/dashboard/live`), 1500)
            } else {
                const msg = searchParams.get("error") || "unknown"
                setOauthMsg({
                    text: `❌ Twitch: ${decodeURIComponent(msg)}`,
                    isError: true,
                })
                setTimeout(() => router.push(`/${locale}/dashboard/live`), 5000)
            }
            return
        }

        // Kick OAuth response
        if (kickParam) {
            if (kickParam === "success") {
                setOauthMsg({
                    text: "✅ Kick connected successfully!",
                    isError: false,
                })
                setTimeout(() => router.push(`/${locale}/dashboard/live`), 1500)
            } else {
                const msg =
                    searchParams.get("reason") ||
                    searchParams.get("error") ||
                    "unknown"
                setOauthMsg({
                    text: `❌ Kick: ${decodeURIComponent(msg)}`,
                    isError: true,
                })
                setTimeout(
                    () => router.push(`/${locale}/dashboard/publish`),
                    5000
                )
            }
            return
        }

        const target = youtubeParam
            ? `/${locale}/dashboard/publish?youtube=${encodeURIComponent(youtubeParam)}`
            : `/${locale}/dashboard/publish`
        router.push(target)
    }, [
        router,
        youtubeParam,
        locale,
        tiktokParam,
        tiktokReason,
        twitchParam,
        kickParam,
        searchParams,
    ])

    if (oauthMsg) {
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "60vh",
                    padding: "2rem",
                }}
            >
                <div
                    style={{
                        padding: "2rem",
                        borderRadius: "8px",
                        maxWidth: "600px",
                        background: oauthMsg.isError ? "#fff0f0" : "#f0fff0",
                        border: `2px solid ${oauthMsg.isError ? "#ff4444" : "#44bb44"}`,
                    }}
                >
                    <pre
                        style={{
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-all",
                            fontSize: "14px",
                        }}
                    >
                        {oauthMsg.text}
                    </pre>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen items-center justify-center">
            <div className="text-center">
                <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-border border-t-blue-500"></div>
                <p className="text-muted-foreground">{t("redirecting")}</p>
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
