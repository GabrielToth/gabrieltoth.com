"use client"

import { useTranslations } from "next-intl"
import { useParams, useSearchParams } from "next/navigation"
import { useEffect, useState, useCallback } from "react"

interface StreamerPlatform {
    platform: string
    username: string
    displayName: string
    profileImageUrl: string | null
    isLive: boolean
    embedUrl?: string
}

interface StreamerData {
    userId: string
    username: string
    displayName: string
    avatarUrl: string | null
    defaultPlatform: string
    platforms: StreamerPlatform[]
}

const EMBED_BUILDERS: Record<string, (username: string) => string> = {
    twitch: u =>
        `https://player.twitch.tv/?channel=${u}&parent=gabrieltoth.com&autoplay=true`,
    youtube: u =>
        `https://www.youtube.com/embed/live_stream?channel=${u}&autoplay=1`,
}

const PLATFORM_COLORS: Record<string, string> = {
    twitch: "#9147ff",
    kick: "#00e676",
    youtube: "#ff0000",
    facebook: "#1877f2",
    instagram: "#e4405f",
    tiktok: "#000000",
    linkedin: "#0a66c2",
}

const OVERRIDE_KEY = "streamer_player_preferences"

function getSavedPreferences(): Record<string, string> {
    if (typeof window === "undefined") return {}
    try {
        return JSON.parse(localStorage.getItem(OVERRIDE_KEY) || "{}")
    } catch {
        return {}
    }
}

function savePreference(slug: string, platform: string): void {
    const prefs = getSavedPreferences()
    prefs[slug] = platform
    localStorage.setItem(OVERRIDE_KEY, JSON.stringify(prefs))
}

export default function StreamerPage() {
    const params = useParams()
    const _searchParams = useSearchParams()
    const slug = params.slug as string
    const locale = params.locale as string
    const _t = useTranslations("streamer")

    const [streamer, setStreamer] = useState<StreamerData | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedPlatform, setSelectedPlatform] = useState<string>("")
    const [chatInput, setChatInput] = useState("")
    const [chatSending, setChatSending] = useState(false)

    const savedPlatform = getSavedPreferences()[slug]

    useEffect(() => {
        async function fetchStreamer() {
            try {
                const res = await fetch(
                    `/api/discover?slug=${encodeURIComponent(slug)}`
                )
                if (res.ok) {
                    const data = await res.json()
                    if (data.success && data.data) {
                        const s = data.data as StreamerData
                        setStreamer(s)

                        const hasPlayers = s.platforms.filter(
                            p => EMBED_BUILDERS[p.platform]
                        )
                        const preferred = savedPlatform || s.defaultPlatform
                        const valid = hasPlayers.find(
                            p => p.platform === preferred
                        )
                        setSelectedPlatform(
                            valid?.platform || hasPlayers[0]?.platform || ""
                        )
                    }
                }
            } catch {
                // silent
            } finally {
                setLoading(false)
            }
        }
        fetchStreamer()
    }, [slug, savedPlatform])

    const handlePlatformChange = useCallback(
        (platform: string) => {
            setSelectedPlatform(platform)
            savePreference(slug, platform)
        },
        [slug]
    )

    const handleSendChat = useCallback(async () => {
        const text = chatInput.trim()
        if (!text || chatSending || !streamer) return
        setChatSending(true)
        try {
            const platforms = streamer.platforms.filter(p => p.isLive)
            await Promise.all(
                platforms.map(p =>
                    fetch("/api/live/chat/send", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            platform: p.platform,
                            message: text,
                            targetUserId: streamer.userId,
                        }),
                    })
                )
            )
            setChatInput("")
        } catch {
            // silent
        } finally {
            setChatSending(false)
        }
    }, [chatInput, chatSending, streamer])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-neutral-950">
                <div className="text-center">
                    <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-neutral-700 border-t-blue-500"></div>
                    <p className="text-neutral-400">Loading streamer...</p>
                </div>
            </div>
        )
    }

    if (!streamer) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-neutral-950">
                <div className="text-center">
                    <p className="text-neutral-400 text-lg">
                        Streamer not found
                    </p>
                    <a
                        href={`/${locale}`}
                        className="mt-4 inline-block text-sm text-indigo-400 hover:text-indigo-300"
                    >
                        Go home
                    </a>
                </div>
            </div>
        )
    }

    const hasPlayers = streamer.platforms.filter(
        p => EMBED_BUILDERS[p.platform]
    )
    const currentEmbed = selectedPlatform
        ? EMBED_BUILDERS[selectedPlatform]?.(
              streamer.platforms.find(p => p.platform === selectedPlatform)
                  ?.username || ""
          )
        : ""
    const livePlatforms = streamer.platforms.filter(p => p.isLive)

    return (
        <div className="min-h-screen bg-neutral-950 text-white">
            <div className="mx-auto max-w-7xl px-4 py-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-14 w-14 rounded-full bg-card flex items-center justify-center text-xl font-bold overflow-hidden">
                        {streamer.avatarUrl ? (
                            <img
                                src={streamer.avatarUrl}
                                alt=""
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            streamer.displayName[0]?.toUpperCase() || "?"
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">
                            {streamer.displayName}
                        </h1>
                        <p className="text-sm text-neutral-400">
                            @{streamer.username}
                        </p>
                    </div>
                    <div className="flex gap-2 ml-auto">
                        {livePlatforms.map(p => {
                            const color = PLATFORM_COLORS[p.platform] || "#666"
                            return (
                                <span
                                    key={p.platform}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                                    style={{ backgroundColor: color }}
                                >
                                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                    {p.platform.toUpperCase()}
                                </span>
                            )
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        {hasPlayers.length > 0 && (
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs text-neutral-500">
                                    Player:
                                </span>
                                {hasPlayers.map(p => {
                                    const color =
                                        PLATFORM_COLORS[p.platform] || "#666"
                                    return (
                                        <button
                                            key={p.platform}
                                            onClick={() =>
                                                handlePlatformChange(p.platform)
                                            }
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                                selectedPlatform === p.platform
                                                    ? "text-white ring-2 ring-offset-1 ring-offset-neutral-900"
                                                    : "text-neutral-400 hover:text-white bg-card"
                                            }`}
                                            style={{
                                                backgroundColor:
                                                    selectedPlatform ===
                                                    p.platform
                                                        ? color
                                                        : undefined,
                                            }}
                                        >
                                            {p.platform.toUpperCase()}
                                        </button>
                                    )
                                })}
                            </div>
                        )}

                        {currentEmbed ? (
                            <div className="aspect-video rounded-xl overflow-hidden bg-black">
                                <iframe
                                    title={`${streamer?.displayName || "Streamer"} live player`}
                                    src={currentEmbed}
                                    className="h-full w-full"
                                    allow="autoplay; encrypted-media"
                                    allowFullScreen
                                />
                            </div>
                        ) : (
                            <div className="aspect-video rounded-xl bg-background flex items-center justify-center">
                                <p className="text-neutral-500">
                                    No player available for this platform
                                </p>
                            </div>
                        )}

                        {livePlatforms.length > 0 && (
                            <div className="rounded-xl border border-neutral-800 bg-background p-4">
                                <h3 className="text-sm font-semibold text-neutral-200 mb-3">
                                    Other Platforms
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {livePlatforms.map(p => {
                                        const color =
                                            PLATFORM_COLORS[p.platform] ||
                                            "#666"
                                        return (
                                            <a
                                                key={p.platform}
                                                href={`https://${p.platform}.tv/${p.username}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white hover:opacity-80 transition-opacity"
                                                style={{
                                                    backgroundColor: color,
                                                }}
                                            >
                                                Watch on {p.platform}
                                            </a>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-xl border border-neutral-800 bg-background p-4">
                            <h3 className="text-sm font-semibold text-neutral-200 mb-3">
                                Chat
                            </h3>
                            <div className="space-y-3">
                                <p className="text-[11px] text-neutral-400">
                                    Messages will be sent to all platforms{" "}
                                    {streamer.displayName} is live on
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={e =>
                                            setChatInput(e.target.value)
                                        }
                                        onKeyDown={e => {
                                            if (e.key === "Enter")
                                                handleSendChat()
                                        }}
                                        placeholder="Type a message..."
                                        className="flex-1 rounded-lg border border-neutral-700 bg-card px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
                                    />
                                    <button
                                        onClick={handleSendChat}
                                        disabled={
                                            chatSending || !chatInput.trim()
                                        }
                                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-neutral-800 bg-background p-4">
                            <h3 className="text-sm font-semibold text-neutral-200 mb-3">
                                Connected Platforms
                            </h3>
                            <div className="space-y-2">
                                {streamer.platforms.map(p => {
                                    const _color =
                                        PLATFORM_COLORS[p.platform] || "#666"
                                    return (
                                        <div
                                            key={p.platform}
                                            className="flex items-center gap-2 text-xs"
                                        >
                                            <span
                                                className="h-2 w-2 rounded-full"
                                                style={{
                                                    backgroundColor: p.isLive
                                                        ? "#22c55e"
                                                        : "#555",
                                                }}
                                            />
                                            <span className="font-medium text-neutral-300 uppercase">
                                                {p.platform}
                                            </span>
                                            <span className="text-neutral-500">
                                                {p.username}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
