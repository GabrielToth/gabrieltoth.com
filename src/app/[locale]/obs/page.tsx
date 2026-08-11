"use client"

import { useRelayChat } from "@/hooks/use-relay-chat"
import { useMemo, useRef, useEffect } from "react"

const PLATFORM_LABELS: Record<string, string> = {
    twitch: "TW", kick: "KC", youtube: "YT",
    facebook: "FB", instagram: "IG", tiktok: "TK", linkedin: "LI",
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

const MAX_VISIBLE = 50

export default function ObsChatOverlay() {
    const relay = useRelayChat()
    const endRef = useRef<HTMLDivElement>(null)

    const messages = useMemo(() => {
        return relay.messages
            .slice(-MAX_VISIBLE)
            .map(m => ({
                id: m.id,
                author: m.user?.displayName || m.user?.username || "Anonymous",
                content: m.content,
                platform: m.platform,
                color: PLATFORM_COLORS[m.platform] || "#888",
                label: PLATFORM_LABELS[m.platform] || m.platform.slice(0, 2).toUpperCase(),
            }))
    }, [relay.messages])

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages.length])

    if (!relay.isConnected) {
        return (
            <div className="flex items-center justify-center h-screen bg-transparent">
                <p className="text-white/40 text-lg">Waiting for connection...</p>
            </div>
        )
    }

    if (messages.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen bg-transparent">
                <p className="text-white/30 text-xl">No messages yet</p>
            </div>
        )
    }

    return (
        <>
            <div className="h-screen w-screen overflow-y-auto bg-transparent p-4 space-y-2 font-sans">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className="flex items-start gap-2 obs-message"
                    >
                        <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase text-white shrink-0"
                            style={{ backgroundColor: msg.color }}
                        >
                            {msg.label}
                        </span>
                        <span className="font-bold text-white/90 text-sm shrink-0">
                            {msg.author}:
                        </span>
                        <span className="text-white/80 text-sm break-words leading-relaxed">
                            {msg.content}
                        </span>
                    </div>
                ))}
                <div ref={endRef} />
            </div>
            <style>{`
                .obs-message {
                    animation: obsFadeIn 0.3s ease-out;
                }
                @keyframes obsFadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </>
    )
}
