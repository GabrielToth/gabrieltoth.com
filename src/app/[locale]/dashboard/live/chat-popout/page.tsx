"use client"

import { useTranslations } from "next-intl"
import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { UnifiedChat } from "@/components/dashboard/live/unified-chat"
import { logger } from "@/lib/logger"

/**
 * OBS / popout-friendly standalone chat page.
 * Open as a browser source or popup window to overlay chat on streams.
 * URL: /dashboard/live/chat-popout?platform=twitch
 */
function ChatPopoutInner() {
    const t = useTranslations("dashboard")
    const searchParams = useSearchParams()
    const requested = searchParams.get("platform")
    const [platforms, setPlatforms] = useState<string[]>([])

    useEffect(() => {
        let cancelled = false
        async function loadPlatforms() {
            try {
                const res = await fetch("/api/user/channels")
                if (!res.ok) {
                    // Fall back to the requested platform even when unauthenticated
                    if (requested && !cancelled) {
                        setPlatforms([requested])
                    }
                    return
                }
                const data = await res.json()
                const connected: string[] = (data.channels || [])
                    .filter((c: { isConnected?: boolean }) => c.isConnected)
                    .map((c: { platform: string }) => c.platform)

                if (requested) {
                    // Only show the requested (single) platform for a clean OBS overlay
                    if (connected.includes(requested)) {
                        if (!cancelled) setPlatforms([requested])
                    } else if (!cancelled) {
                        setPlatforms([requested])
                    }
                } else {
                    if (!cancelled)
                        setPlatforms(connected.length ? connected : ["twitch"])
                }
            } catch {
                if (!cancelled)
                    setPlatforms(requested ? [requested] : ["twitch"])
            }
        }
        loadPlatforms()
        return () => {
            cancelled = true
        }
    }, [requested])

    return (
        <div className="flex h-screen w-screen flex-col bg-[#0b0b0e] text-neutral-200 overflow-hidden">
            {/* Thin header with copy-to-clipboard URL hint (invisible-friendly) */}
            <div className="flex items-center justify-between px-3 py-1.5 text-[10px] text-neutral-500 bg-black/50 border-b border-neutral-800/60">
                <span>{t("chatPopout.title")}</span>
                {platforms.length > 0 && (
                    <button
                        type="button"
                        onClick={() => {
                            try {
                                navigator.clipboard.writeText(
                                    window.location.href
                                )
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                ;(window as any).__copied = true
                            } catch {
                                // ignore
                            }
                        }}
                        className="underline decoration-dotted hover:text-neutral-300"
                        title={t("chatPopout.copyUrlTooltip")}
                    >
                        {t("chatPopout.copyUrl")}
                    </button>
                )}
            </div>
            <div className="flex-1 min-h-0">
                <UnifiedChat
                    platforms={platforms.length ? platforms : ["twitch"]}
                    activePlatform={platforms[0] || undefined}
                    hidePopout
                />
            </div>
        </div>
    )
}

export default function ChatPopoutPage() {
    // Only render the chat client-side to avoid SSR fetch/layout flash.
    useEffect(() => {
        logger.debug("Chat popout mounted")
    }, [])

    return (
        <Suspense fallback={<div className="h-screen bg-[#0b0b0e]" />}>
            <ChatPopoutInner />
        </Suspense>
    )
}
