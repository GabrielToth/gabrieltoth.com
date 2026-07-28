/**
 * ChatMessageList Component
 * Renders list of live chat messages from multiple platforms
 */

"use client"

import { RefObject } from "react"

export interface RenderableChatMessage {
    id: string
    author: string
    content: string
    platform: string
    timestamp: number
}

interface ChatMessageListProps {
    messages: RenderableChatMessage[]
    getPlatformBadge: (platform: string) => { label: string; bgClass: string }
    messagesEndRef: RefObject<HTMLDivElement | null>
}

export function ChatMessageList({
    messages,
    getPlatformBadge,
    messagesEndRef,
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
                messages.map((msg) => {
                    const badge = getPlatformBadge(msg.platform)
                    return (
                        <div key={msg.id} className="flex items-start gap-1.5 leading-relaxed">
                            <span
                                className={`text-[9px] px-1 rounded uppercase font-semibold text-white ${badge.bgClass}`}
                            >
                                {badge.label}
                            </span>
                            <span className="font-semibold text-neutral-300">
                                {msg.author}:
                            </span>
                            <span className="text-neutral-200 break-words">{msg.content}</span>
                        </div>
                    )
                })
            )}
            <div ref={messagesEndRef} />
        </div>
    )
}
