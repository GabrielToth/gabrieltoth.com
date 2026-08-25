"use client"

import { useRelayChat } from "@/hooks/use-relay-chat"
import { useChatSSE } from "@/hooks/use-chat-sse"
import { useLocalChat } from "@/hooks/use-local-chat"
import {
    ChatExecutionModeToggle,
    ChatExecutionMode,
} from "./chat-execution-mode-toggle"
import { createLogger } from "@/lib/logger"
import { useCallback, useRef, useEffect, useState, useMemo } from "react"
import { ChatMessageList, RenderableChatMessage } from "./chat-message-list"
import { ChatCommandPalette, CommandItem } from "./chat-command-palette"
import { UserCard } from "./user-card"

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
    { name: "/unban", description: "Unban a user", usage: "/unban <username>" },
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

const DUP_WINDOW_MS = 10000

function deduplicateAndGroup(
    all: RenderableChatMessage[]
): (RenderableChatMessage & { duplicateCount: number })[] {
    const groups: RenderableChatMessage[][] = []
    const used = new Set<string>()

    for (const msg of all) {
        if (used.has(msg.id)) continue
        const key = `${msg.author.toLowerCase()}|${msg.content.trim()}`
        const cluster: RenderableChatMessage[] = [msg]
        used.add(msg.id)

        for (const other of all) {
            if (used.has(other.id)) continue
            const otherKey = `${other.author.toLowerCase()}|${other.content.trim()}`
            if (
                key === otherKey &&
                Math.abs(other.timestamp - msg.timestamp) < DUP_WINDOW_MS
            ) {
                cluster.push(other)
                used.add(other.id)
            }
        }

        groups.push(cluster)
    }

    return groups
        .map(g => ({
            ...g[0],
            duplicateCount: g.length,
            platformIcons: [...new Set(g.map(m => m.platform))],
        }))
        .sort((a, b) => a.timestamp - b.timestamp)
}

const PLATFORM_COLORS: Record<string, string> = {
    twitch: "bg-purple-600",
    kick: "bg-emerald-600",
    youtube: "bg-red-600",
    facebook: "bg-blue-600",
    instagram: "bg-pink-600",
    tiktok: "bg-neutral-600",
    linkedin: "bg-blue-800",
}

export function UnifiedChat({ platforms }: UnifiedChatProps) {
    const [executionMode, setExecutionMode] =
        useState<ChatExecutionMode>("cloud")
    const relay = useRelayChat()
    const sse = useChatSSE(platforms)
    const local = useLocalChat(platforms, executionMode === "local")
    const [enabledPlatforms, setEnabledPlatforms] = useState<Set<string>>(
        new Set(platforms)
    )
    const [sendMode, setSendMode] = useState<string>(platforms[0] || "twitch")
    const [selectedUser, setSelectedUser] = useState<
        (RenderableChatMessage & { duplicateCount: number }) | null
    >(null)

    useEffect(() => {
        const saved = localStorage.getItem(
            "chat_execution_mode"
        ) as ChatExecutionMode
        if (saved === "cloud" || saved === "local") {
            setExecutionMode(saved)
        }
    }, [])

    const handleModeChange = (mode: ChatExecutionMode) => {
        setExecutionMode(mode)
        localStorage.setItem("chat_execution_mode", mode)
    }

    useEffect(() => {
        setEnabledPlatforms(new Set(platforms))
        if (!platforms.includes(sendMode) && sendMode !== "all") {
            setSendMode(platforms[0] || "twitch")
        }
    }, [platforms, sendMode])

    const allMessages: RenderableChatMessage[] = useMemo(() => {
        if (executionMode === "local") {
            return local.messages.map(m => ({
                id: m.id,
                author: m.user?.displayName || m.user?.username || "Anonymous",
                content: m.content,
                platform: m.platform,
                timestamp: m.timestamp,
                userId: m.user?.id,
                displayName: m.user?.displayName,
            }))
        }

        const relayMsgs: RenderableChatMessage[] = relay.messages.map(m => ({
            id: m.id,
            author: m.user?.displayName || m.user?.username || "Anonymous",
            content: m.content,
            platform: m.platform,
            timestamp: m.timestamp,
            userId: m.user?.id,
            displayName: m.user?.displayName,
            isBroadcaster: m.user?.isBroadcaster,
            isModerator: m.user?.isModerator,
            isSubscriber: m.user?.isSubscriber,
            isVip: (m.user as { isVip?: boolean })?.isVip,
        }))

        const sseMsgs: RenderableChatMessage[] = sse.messages.map(m => ({
            id: m.id,
            author: m.user?.displayName || m.user?.username || "Anonymous",
            content: m.content,
            platform: m.platform,
            timestamp: m.timestamp,
            userId: m.user?.id,
            displayName: m.user?.displayName,
            isBroadcaster: m.user?.isBroadcaster,
            isModerator: m.user?.isModerator,
            isSubscriber: m.user?.isSubscriber,
            isVip: m.user?.isVip,
        }))

        return [...relayMsgs, ...sseMsgs]
    }, [executionMode, local.messages, relay.messages, sse.messages])

    const groupedMessages = useMemo(() => {
        const filtered = allMessages.filter(m =>
            enabledPlatforms.has(m.platform)
        )
        return deduplicateAndGroup(filtered)
    }, [allMessages, enabledPlatforms])

    const platformCounts = useMemo(() => {
        const counts: Record<string, number> = {}
        for (const m of allMessages) {
            counts[m.platform] = (counts[m.platform] || 0) + 1
        }
        return counts
    }, [allMessages])

    const statusText = relay.isConnected ? "Connected" : "Disconnected"

    const [input, setInput] = useState("")
    const [_historyIndex, setHistoryIndex] = useState(-1)
    const [showCommands, setShowCommands] = useState(false)
    const [selectedCmd, setSelectedCmd] = useState(0)
    const [sending, setSending] = useState(false)
    const historyRef = useRef<string[]>([])
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!selectedUser) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
        }
    }, [groupedMessages, selectedUser])

    const filteredCommands = useMemo(() => {
        if (!input.startsWith("/")) return []
        const query = input.slice(1).toLowerCase()
        return COMMANDS.filter(cmd =>
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

    const togglePlatform = useCallback((p: string) => {
        setEnabledPlatforms(prev => {
            const next = new Set(prev)
            if (next.has(p)) {
                if (next.size > 1) next.delete(p)
            } else next.add(p)
            return next
        })
    }, [])

    const handleSend = useCallback(async () => {
        const text = input.trim()
        if (!text || sending) return
        setSending(true)
        try {
            if (!historyRef.current.includes(text)) {
                historyRef.current.push(text)
            }
            setHistoryIndex(-1)

            const targetPlatforms = sendMode === "all" ? platforms : [sendMode]

            await Promise.all(
                targetPlatforms.map(p =>
                    fetch("/api/live/chat/send", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ platform: p, message: text }),
                    })
                )
            )

            setInput("")
            setShowCommands(false)
        } catch (err) {
            logger.error("Failed to send message", { error: err })
        } finally {
            setSending(false)
        }
    }, [input, sending, sendMode, platforms])

    const handleModerate = useCallback(
        (action: string, duration?: number) => {
            if (!selectedUser) return
            relay.sendModeration(
                action,
                selectedUser.userId || selectedUser.author,
                selectedUser.author,
                selectedUser.platform,
                duration
            )
        },
        [selectedUser, relay]
    )

    const getPlatformBadge = (platform: string) => {
        const lower = platform.toLowerCase()
        const labels: Record<string, string> = {
            twitch: "TW",
            kick: "KC",
            youtube: "YT",
            facebook: "FB",
            instagram: "IG",
            tiktok: "TK",
            linkedin: "LI",
        }
        return {
            label: labels[lower] || lower.slice(0, 2).toUpperCase(),
            bgClass: PLATFORM_COLORS[lower] || "bg-neutral-600",
        }
    }

    return (
        <div className="flex flex-col h-[500px]">
            <div className="flex items-center justify-between mb-2 border-b border-neutral-800 pb-2 flex-wrap gap-2">
                <div className="flex gap-1 flex-wrap items-center">
                    {platforms.map(p => {
                        const badge = getPlatformBadge(p)
                        const isEnabled = enabledPlatforms.has(p)
                        return (
                            <button
                                key={p}
                                onClick={() => togglePlatform(p)}
                                className={`px-2 py-1 rounded text-xs font-medium transition flex items-center gap-1 ${
                                    isEnabled
                                        ? `${badge.bgClass} text-white`
                                        : "bg-neutral-800 text-neutral-500 line-through"
                                }`}
                                title={`${isEnabled ? "Click to hide" : "Click to show"} ${p}`}
                            >
                                {p.toUpperCase()}
                                {platformCounts[p]
                                    ? ` (${platformCounts[p]})`
                                    : ""}
                            </button>
                        )
                    })}
                </div>
                <div className="flex items-center gap-2">
                    <ChatExecutionModeToggle
                        mode={executionMode}
                        onChange={handleModeChange}
                    />
                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 shrink-0">
                        <span
                            className={`h-2 w-2 rounded-full ${statusText === "Disconnected" ? "bg-red-500" : "bg-emerald-500"}`}
                        />
                        {statusText}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex gap-3 min-h-0 relative">
                <div className="flex-1 flex flex-col min-w-0">
                    <ChatMessageList
                        messages={groupedMessages}
                        getPlatformBadge={getPlatformBadge}
                        messagesEndRef={messagesEndRef}
                        onUserClick={msg => setSelectedUser(msg)}
                    />
                </div>

                {selectedUser && (
                    <div className="w-60 shrink-0">
                        <UserCard
                            username={selectedUser.author}
                            displayName={
                                selectedUser.displayName || selectedUser.author
                            }
                            platform={selectedUser.platform}
                            userId={selectedUser.userId || selectedUser.author}
                            platformBadge={getPlatformBadge(
                                selectedUser.platform
                            )}
                            isBroadcaster={selectedUser.isBroadcaster}
                            isModerator={selectedUser.isModerator}
                            isSubscriber={selectedUser.isSubscriber}
                            isVip={selectedUser.isVip}
                            onClose={() => setSelectedUser(null)}
                            onModerate={handleModerate}
                        />
                    </div>
                )}
            </div>

            <div className="relative mt-auto">
                {showCommands && (
                    <ChatCommandPalette
                        commands={filteredCommands}
                        selectedIndex={selectedCmd}
                        onSelect={cmd => {
                            setInput(cmd.name + " ")
                            setShowCommands(false)
                        }}
                    />
                )}
                <div className="flex gap-2">
                    <select
                        value={sendMode}
                        onChange={e => setSendMode(e.target.value)}
                        className="rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-2 text-xs text-neutral-100 focus:border-neutral-500 focus:outline-none"
                    >
                        {platforms.map(p => (
                            <option key={p} value={p}>
                                {p.toUpperCase()}
                            </option>
                        ))}
                        {platforms.length > 1 && (
                            <option value="all">ALL</option>
                        )}
                    </select>
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === "Enter") handleSend()
                        }}
                        placeholder={
                            sendMode === "all"
                                ? "Message all platforms..."
                                : `Message #${sendMode}...`
                        }
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
