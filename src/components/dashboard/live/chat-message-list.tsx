"use client"

import { RefObject } from "react"

export interface RenderableChatMessage {
    id: string
    author: string
    content: string
    platform: string
    timestamp: number
    duplicateCount?: number
    platformIcons?: string[]
    userId?: string
    displayName?: string
    isBroadcaster?: boolean
    isModerator?: boolean
    isSubscriber?: boolean
    isVip?: boolean
}

interface ChatMessageListProps {
    messages: (RenderableChatMessage & { duplicateCount: number })[]
    getPlatformBadge: (platform: string) => { label: string; bgClass: string }
    messagesEndRef: RefObject<HTMLDivElement | null>
    onUserClick?: (
        msg: RenderableChatMessage & { duplicateCount: number }
    ) => void
}

const PLATFORM_MINIS: Record<string, { color: string; label: string }> = {
    twitch: { color: "#9147ff", label: "TW" },
    kick: { color: "#00e676", label: "KC" },
    youtube: { color: "#ff0000", label: "YT" },
    facebook: { color: "#1877f2", label: "FB" },
    instagram: { color: "#e4405f", label: "IG" },
    tiktok: { color: "#000000", label: "TK" },
    linkedin: { color: "#0a66c2", label: "LI" },
}

export function ChatMessageList({
    messages,
    getPlatformBadge,
    messagesEndRef,
    onUserClick,
}: ChatMessageListProps) {
    return (
        <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1 text-xs">
            {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-neutral-500">
                    <p>No chat messages yet</p>
                    <p className="text-[10px] text-neutral-600 mt-1">
                        Messages from connected platforms will appear here
                    </p>
                </div>
            ) : (
                messages.map(msg => {
                    const dupPlatforms =
                        msg.platformIcons && msg.platformIcons.length > 0
                            ? msg.platformIcons
                            : [msg.platform]
                    return (
                        <div
                            key={msg.id}
                            className="flex items-start gap-1.5 leading-relaxed"
                        >
                            <div className="flex items-center gap-1 shrink-0">
                                {dupPlatforms.map(p => {
                                    const b = getPlatformBadge(p)
                                    return (
                                        <span
                                            key={p}
                                            className={`text-[9px] px-1 rounded uppercase font-semibold text-white ${b.bgClass}`}
                                            title={p}
                                        >
                                            {b.label}
                                        </span>
                                    )
                                })}
                            </div>
                            <button
                                onClick={() => onUserClick?.(msg)}
                                className="font-semibold text-neutral-300 hover:text-indigo-400 transition-colors cursor-pointer"
                            >
                                {msg.author}:
                            </button>
                            <span className="text-neutral-200 break-words">
                                {msg.content}
                            </span>
                        </div>
                    )
                })
            )}
            <div ref={messagesEndRef} />
        </div>
    )
}
