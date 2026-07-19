/**
 * UnifiedChat Component
 * Displays combined chat feed from multiple platforms (Twitch + Kick)
 * Uses SSE backend for real-time messages.
 */

"use client"

import { useChatSSE } from "@/hooks/use-chat-sse"
import { useRelayChat } from "@/hooks/use-relay-chat"
import { createLogger } from "@/lib/logger"
import { useCallback, useRef, useEffect, useState, useMemo } from "react"

interface UnifiedChatProps {
    platforms: string[]
    activePlatform: string
}

const COMMANDS = [
    {
        name: "/timeout",
        description: "Timeout a user",
        usage: "/timeout &lt;username&gt; [duration] [reason]",
    },
    {
        name: "/ban",
        description: "Ban a user",
        usage: "/ban &lt;username&gt; [reason]",
    },
    {
        name: "/unban",
        description: "Unban a user",
        usage: "/unban &lt;username&gt;",
    },
    {
        name: "/me",
        description: "Send an action message",
        usage: "/me &lt;message&gt;",
    },
    {
        name: "/slow",
        description: "Slow mode on/off",
        usage: "/slow [seconds] | /slow on | /slow off | /slowon | /slowoff",
    },
    {
        name: "/subscribers",
        description: "Subscribers-only on/off",
        usage: "/subscribers | /subscribersoff | /subon | /suboff | /sub on | /sub off | /subonly | /subscribersonly | /subscriber on | /subscriber off",
    },
]

const logger = createLogger("UnifiedChat")

export function UnifiedChat({ platforms }: UnifiedChatProps) {
    const sse = useChatSSE(platforms)
    const relay = useRelayChat()

    const allMessages = useMemo(() => {
        const seen = new Set<string>()
        const merged = [...sse.messages]
        for (const m of merged) seen.add(m.id)
        for (const m of relay.messages) {
            if (!seen.has(m.id)) {
                merged.push(m)
                seen.add(m.id)
            }
        }
        merged.sort((a, b) => a.timestamp - b.timestamp)
        return merged
    }, [sse.messages, relay.messages])

    const statusText = relay.isConnected
        ? sse.isConnected ? "Connected" : "Relay (YouTube)"
        : sse.isConnected ? "SSE (Twitch/Kick)" : "Disconnected"
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

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [allMessages])

    const handleSend = useCallback(async () => {
        const text = input.trim()
        if (!text || sending) return

        setSending(true)
        try {
            const res = await fetch("/api/live/chat/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    platform: selectedPlatform,
                    message: text,
                }),
            })

            if (!res.ok) {
                const err = await res.json()
                logger.error("Failed to send message", {
                    platform: selectedPlatform,
                    error: err.error,
                    message: err.message,
                })
                if (err.error === "MISSING_SCOPE") {
                    sse.addMessage({
                        id: `error-${Date.now()}`,
                        channelId: selectedPlatform,
                        platform: "system",
                        user: {
                            id: "system",
                            username: "system",
                            displayName: "System",
                            platform: "system",
                            badges: [],
                        },
                        content: `⚠️ ${err.message}`,
                        type: "system",
                        timestamp: Date.now(),
                    })
                }
                return
            }

            await res.json()

            // Always inject locally for instant feedback. The SSE echo arrives
            // asynchronously and is deduplicated by content+user in useChatSSE.
            sse.addMessage({
                id: `send-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
                channelId: selectedPlatform,
                platform: selectedPlatform,
                user: {
                    id: "self",
                    username: "ogabrieltoth",
                    displayName: "ogabrieltoth",
                    platform: selectedPlatform,
                    badges: [],
                    isBroadcaster: true,
                },
                content: text,
                type: "text",
                timestamp: Date.now(),
                isAction: text.startsWith("/me "),
            })

            historyRef.current.push(text)
            setInput("")
            setHistoryIndex(-1)
        } catch (error) {
            logger.error("Failed to send message", {
                platform: selectedPlatform,
                error: String(error),
            })
        } finally {
            setSending(false)
        }
    }, [input, selectedPlatform, sse, sending])

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                setShowCommands(false)
                handleSend()
                return
            }

            if (e.key === "ArrowUp") {
                e.preventDefault()
                const history = historyRef.current
                if (history.length === 0) return
                const newIndex =
                    historyIndex === -1
                        ? history.length - 1
                        : Math.max(0, historyIndex - 1)
                setHistoryIndex(newIndex)
                setInput(history[newIndex])
                return
            }

            if (e.key === "ArrowDown") {
                e.preventDefault()
                const history = historyRef.current
                if (historyIndex === -1) return
                const newIndex = historyIndex + 1
                if (newIndex >= history.length) {
                    setHistoryIndex(-1)
                    setInput("")
                } else {
                    setHistoryIndex(newIndex)
                    setInput(history[newIndex])
                }
                return
            }

            if (e.key === "Tab" && showCommands) {
                e.preventDefault()
                const cmd = COMMANDS[selectedCmd]
                setInput(cmd.name + " ")
                setShowCommands(false)
                return
            }

            if (e.key === "Escape") {
                setShowCommands(false)
                return
            }
        },
        [handleSend, historyIndex, showCommands, selectedCmd]
    )

    const handleInputChange = useCallback((value: string) => {
        setInput(value)
        setHistoryIndex(-1)

        if (value === "/") {
            setShowCommands(true)
            setSelectedCmd(0)
        } else if (value.startsWith("/") && !value.includes(" ")) {
            const match = COMMANDS.findIndex(c => c.name.startsWith(value))
            if (match >= 0) {
                setShowCommands(true)
                setSelectedCmd(match)
            } else {
                setShowCommands(false)
            }
        } else {
            setShowCommands(false)
        }
    }, [])

    const getPlatformBadge = (
        platform: string
    ): { color: string; label: string } => {
        switch (platform) {
            case "twitch":
                return { color: "#9146FF", label: "Twitch" }
            case "kick":
                return { color: "#53FC18", label: "Kick" }
            case "youtube":
                return { color: "#FF0000", label: "YouTube" }
            case "facebook":
                return { color: "#1877F2", label: "Facebook" }
            case "instagram":
                return { color: "#E4405F", label: "Instagram" }
            default:
                return { color: "#6B7280", label: platform }
        }
    }

    const formatTime = (timestamp: number): string => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    return (
        <div className="flex flex-col h-[500px]">
            {/* Platform selector */}
            <div className="flex gap-1 mb-3">
                {platforms.map(platform => {
                    const badge = getPlatformBadge(platform)
                    return (
                        <button
                            key={platform}
                            onClick={() => setSelectedPlatform(platform)}
                            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                                selectedPlatform === platform
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:bg-accent"
                            }`}
                        >
                            {badge.label}
                        </button>
                    )
                })}
            </div>

            {/* Connection status */}
            <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                <span
                    className={`inline-block h-2 w-2 rounded-full ${
                        relay.isConnected ? "bg-success" : sse.isConnected ? "bg-warning" : "bg-error"
                    }`}
                />
                {statusText}
                {(sse.error || relay.error) && (
                    <span className="text-error ml-2">
                        {relay.error || `${sse.error?.platform}: ${sse.error?.error}`}
                    </span>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-1 bg-muted dark:bg-card/50 rounded-lg p-3">
                {allMessages.map(msg => {
                    const badge = getPlatformBadge(msg.platform)
                    return (
                        <div
                            key={msg.id}
                            className="group flex items-start gap-2 px-2 py-1 rounded hover:bg-muted dark:hover:bg-accent"
                        >
                            {/* Platform indicator */}
                            <span
                                className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full"
                                style={{ backgroundColor: badge.color }}
                                title={badge.label}
                            />

                            {/* Badges */}
                            <div className="flex gap-0.5 shrink-0">
                                {msg.user.isBroadcaster && (
                                    <span
                                        className="text-xs"
                                        title="Broadcaster"
                                    >
                                        👑
                                    </span>
                                )}
                                {msg.user.isModerator && (
                                    <span className="text-xs" title="Moderator">
                                        🛡️
                                    </span>
                                )}
                            </div>

                            {/* Username */}
                            <span
                                className={`text-sm font-medium shrink-0 ${
                                    msg.user.isBroadcaster
                                        ? "text-primary"
                                        : msg.user.isModerator
                                          ? "text-success"
                                          : "text-foreground dark:text-foreground"
                                }`}
                            >
                                {msg.user.displayName}
                            </span>

                            {/* Message content */}
                            <span className="text-sm text-foreground dark:text-foreground break-words flex-1">
                                {msg.isAction ? (
                                    <em>{msg.content}</em>
                                ) : (
                                    msg.content
                                )}
                            </span>

                            {/* Time + actions */}
                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-xs text-muted-foreground">
                                    {formatTime(msg.timestamp)}
                                </span>
                                {msg.platform !== "system" &&
                                    msg.user.username !== "ogabrieltoth" && (
                                        <button
                                            onClick={() =>
                                                setInput(
                                                    `/timeout ${msg.user.username} 1 `
                                                )
                                            }
                                            className="text-xs text-error hover:text-error/80"
                                            title="Timeout 1s"
                                        >
                                            ⏱️
                                        </button>
                                    )}
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Command suggestions */}
            {showCommands && (
                <div className="relative mb-1">
                    <div className="absolute bottom-0 left-0 w-full rounded-md border border-border bg-card shadow-lg z-10">
                        {COMMANDS.map((cmd, i) => (
                            <button
                                key={cmd.name}
                                onClick={() => {
                                    setInput(cmd.name + " ")
                                    setShowCommands(false)
                                }}
                                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted dark:hover:bg-accent ${
                                    i === selectedCmd
                                        ? "bg-muted dark:bg-muted"
                                        : ""
                                }`}
                            >
                                <div className="flex flex-col min-w-0">
                                    <span className="font-mono font-medium text-primary">
                                        {cmd.name}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground truncate">
                                        {cmd.usage
                                            .replace(/&lt;/g, "<")
                                            .replace(/&gt;/g, ">")}
                                    </span>
                                </div>
                                <span className="text-xs text-muted-foreground ml-auto shrink-0">
                                    {cmd.description}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input area */}
            <div className="flex gap-2 mt-3 relative">
                <input
                    type="text"
                    value={input}
                    onChange={e => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Send message to ${selectedPlatform}...`}
                    className="flex-1 rounded-md border border-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
                    maxLength={500}
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Send
                </button>
            </div>

            {/* Quick commands */}
            <div className="flex gap-1 mt-2">
                <span className="text-xs text-muted-foreground mr-1">Quick:</span>
                {COMMANDS.map(cmd => (
                    <button
                        key={cmd.name}
                        onClick={() => {
                            setInput(cmd.name + " ")
                            setShowCommands(true)
                        }}
                        className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent"
                    >
                        {cmd.name}
                    </button>
                ))}
            </div>
        </div>
    )
}
