"use client"

import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

interface DiscoverPlatform {
    username: string
    displayName: string
    profileImageUrl: string | null
    isLive: boolean
}

interface DiscoverUser {
    userId: string
    username: string
    displayName: string
    avatarUrl: string | null
    platforms: Record<string, DiscoverPlatform>
}

const PLATFORM_ICONS: Record<string, { label: string; color: string }> = {
    twitch: { label: "TW", color: "bg-purple-600" },
    kick: { label: "KC", color: "bg-emerald-600" },
    youtube: { label: "YT", color: "bg-red-600" },
    facebook: { label: "FB", color: "bg-blue-600" },
    instagram: { label: "IG", color: "bg-pink-600" },
    tiktok: { label: "TK", color: "bg-neutral-600" },
    linkedin: { label: "LI", color: "bg-blue-800" },
}

export default function DiscoverPage() {
    const t = useTranslations("dashboard.discover")
    const [users, setUsers] = useState<DiscoverUser[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchDiscover() {
            try {
                const res = await fetch("/api/discover")
                if (res.ok) {
                    const data = await res.json()
                    if (data.success) {
                        setUsers(data.data)
                    }
                }
            } catch {
                // silent
            } finally {
                setLoading(false)
            }
        }
        fetchDiscover()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-border border-t-blue-500"></div>
                    <p className="text-muted-foreground">{t("loading")}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
            </div>

            {users.length === 0 ? (
                <div className="rounded-lg border border-border bg-card p-8 text-center">
                    <p className="text-muted-foreground">{t("noUsers")}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {users.map(user => {
                        const platformEntries = Object.entries(user.platforms)
                        return (
                            <a
                                key={user.userId}
                                href={`/${window.location.pathname.split("/")[1]}/streamer/${user.username}`}
                                className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 hover:border-neutral-600 transition-colors block"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="h-10 w-10 rounded-full bg-neutral-700 flex items-center justify-center text-sm font-bold text-neutral-300 overflow-hidden">
                                        {user.avatarUrl ? (
                                            <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            user.displayName[0]?.toUpperCase() || "?"
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-neutral-100 truncate">{user.displayName}</p>
                                        <p className="text-[10px] text-neutral-400">@{user.username}</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {platformEntries.map(([platform, info]) => {
                                        const icon = PLATFORM_ICONS[platform]
                                        if (!icon) return null
                                        return (
                                            <span
                                                key={platform}
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold text-white ${icon.color}`}
                                            >
                                                {icon.label}
                                                <span className="text-white/70 text-[9px]">{info.username}</span>
                                            </span>
                                        )
                                    })}
                                </div>
                            </a>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
