/**
 * UnifiedChat Component
 * Displays combined chat feed from multiple platforms (Twitch + Kick + YouTube)
 * Uses SSE backend for real-time messages.
 */

"use client"

import { useRelayChat } from "@/hooks/use-relay-chat"
import { createLogger } from "@/lib/logger"
import { useCallback, useRef, useEffect, useState, useMemo } from "react"
import { ChatMessageList, RenderableChatMessage } from "./chat-message-list"
import { ChatCommandPalette, CommandItem } from "./chat-command-palette"

interface UnifiedChatProps {
    platforms: string[]
    activePlatform?: string
}

const COMMANDS: CommandItem[] = [
    {
        name: "/timeout",
        description: "Timeout a user",
        usage: "/timeout <username> [duration] [reason]",
    },
    {
        name: "/ban",
        description: "Ban a user",
        usage: "/ban <username> [reason]",
    },
    {
        name: "/unban",
        description: "Unban a user",
        usage: "/unban <username>",
    },
    {
        name: "/me",
        description: "Send an action message",
        usage: "/me <message>",
    },
    {
        name: "/slow",
        description: "Slow mode on/off",
        usage: "/slow [seconds] | /slow on | /slow off",
    },
    {
        name: "/subscribers",
        description: "Subscribers-only on/off",
        usage: "/subscribers | /subscribersoff",
    },
]

const logger = createLogger("UnifiedChat")

export function UnifiedChat({ platforms }: UnifiedChatProps) {
    const relay = useRelayChat()

    const allMessages: RenderableChatMessage[] = useMemo(() => {
        return relay.messages.map(m => ({
            id: m.id,
            author: m.user?.displayName || m.user?.username || "Anonymous",
            content: m.content,
            platform: m.platform,
            timestamp: m.timestamp,
        }))
    }, [relay.messages])

    const statusText = relay.isConnected
        ? "Connected"
        : "Disconnected"

    const [input, setInput] = useState("")
    const [selectedPlatform, setSelectedPlatform] = useState(
        platforms[0] || "twitch"
    )
    const [historyIndex, setHistoryIndex] = useState(-1)
    const [showCommands, setShowCommands] = useState(false)
    const [selectedCmd, setSelectedCmd] = useState(0)
    const [sending, setSending] = useState(false)
    const historyRef = useRef<string[]>([])
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [allMessages])

    const filteredCommands = useMemo(() => {
        if (!input.startsWith("/")) return []
        const query = input.slice(1).toLowerCase()
        return COMMANDS.filter((cmd) =>
            cmd.name.slice(1).toLowerCase().startsWith(query)
        )
    }, [input])

    useEffect(() => {
        if (input.startsWith("/") && filteredCommands.length > 0) {
            setShowCommands(true)
            setSelectedCmd(0)
        } else {
            setShowCommands(false)
        }
    }, [input, filteredCommands.length])

    const handleSend = useCallback(async () => {
        const text = input.trim()
        if (!text || sending) return

        setSending(true)
        try {
            if (!historyRef.current.includes(text)) {
                historyRef.current.push(text)
            }
            setHistoryIndex(-1)

            await fetch("/api/live/chat/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    platform: selectedPlatform,
                    message: text,
                }),
            })

            setInput("")
            setShowCommands(false)
        } catch (err) {
            logger.error("Failed to send message", { error: err })
        } finally {
            setSending(false)
        }
    }, [input, sending, selectedPlatform])

    const getPlatformBadge = (platform: string) => {
        switch (platform.toLowerCase()) {
            case "twitch":
                return { label: "TW", bgClass: "bg-purple-600" }
            case "kick":
                return { label: "KC", bgClass: "bg-emerald-600" }
            case "youtube":
                return { label: "YT", bgClass: "bg-red-600" }
            default:
                return { label: platform.slice(0, 2).toUpperCase(), bgClass: "bg-neutral-600" }
        }
    }

    return (
        <div className="flex flex-col h-[500px]">
            <div className="flex items-center justify-between mb-3 border-b border-neutral-800 pb-2">
                <div className="flex gap-1">
                    {platforms.map((p) => {
                        const badge = getPlatformBadge(p)
                        return (
                            <button
                                key={p}
                                onClick={() => setSelectedPlatform(p)}
                                className={`px-2 py-1 rounded text-xs font-medium transition ${
                                    selectedPlatform === p
                                        ? `${badge.bgClass} text-white`
                                        : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                                }`}
                            >
                                {p.toUpperCase()}
                            </button>
                        )
                    })}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                    <span
                        className={`h-2 w-2 rounded-full ${
                            statusText === "Disconnected" ? "bg-red-500" : "bg-emerald-500"
                        }`}
                    />
                    {statusText}
                </div>
            </div>

            <ChatMessageList
                messages={allMessages}
                getPlatformBadge={getPlatformBadge}
                messagesEndRef={messagesEndRef}
            />

            <div className="relative mt-auto">
                {showCommands && (
                    <ChatCommandPalette
                        commands={filteredCommands}
                        selectedIndex={selectedCmd}
                        onSelect={(cmd) => {
                            setInput(cmd.name + " ")
                            setShowCommands(false)
                        }}
                    />
                )}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSend()
                        }}
                        placeholder={`Message #${selectedPlatform}...`}
                        className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
                    />
                    <button
                        onClick={handleSend}
                        disabled={sending || !input.trim()}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    )
}
