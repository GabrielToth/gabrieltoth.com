/**
 * UnifiedChat Component
 * Displays combined chat feed from multiple platforms (Twitch + Kick)
 * Uses SSE backend for real-time messages.
 */

"use client"

import { useChatSSE } from "@/hooks/use-chat-sse"
import { createLogger } from "@/lib/logger"
import { useCallback, useRef, useEffect, useState } from "react"

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
        usage: "/slow [seconds] | /slow off",
    },
    {
        name: "/subscribers",
        description: "Subscribers-only on/off",
        usage: "/subscribers | /subscribersoff | /subon | /suboff | /sub on | /sub off | /subonly | /subscribersonly | /subscriber on | /subscriber off",
    },
]

const logger = createLogger("UnifiedChat")

export function UnifiedChat({ platforms }: UnifiedChatProps) {
    const { messages, isConnected, error, addMessage } = useChatSSE(platforms)
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
    }, [messages])

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
                    addMessage({
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

            const data = await res.json()

            // Only inject locally if the message was sent via temp connection
            // (no active aggregator to receive the Twitch echo via SSE).
            // When sentViaActive is true, the echo arrives via SSE.
            if (!data.sentViaActive) {
                addMessage({
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
            }

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
    }, [input, selectedPlatform, addMessage, sending])

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
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                        >
                            {badge.label}
                        </button>
                    )
                })}
            </div>

            {/* Connection status */}
            <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                <span
                    className={`inline-block h-2 w-2 rounded-full ${
                        isConnected ? "bg-green-500" : "bg-red-500"
                    }`}
                />
                {isConnected ? "Connected" : "Disconnected"}
                {error && (
                    <span className="text-red-500 ml-2">
                        {error.platform}: {error.error}
                    </span>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                {messages.map(msg => {
                    const badge = getPlatformBadge(msg.platform)
                    return (
                        <div
                            key={msg.id}
                            className="group flex items-start gap-2 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
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
                                        ? "text-purple-600"
                                        : msg.user.isModerator
                                          ? "text-green-600"
                                          : "text-gray-900 dark:text-white"
                                }`}
                            >
                                {msg.user.displayName}
                            </span>

                            {/* Message content */}
                            <span className="text-sm text-gray-700 dark:text-gray-300 break-words flex-1">
                                {msg.isAction ? (
                                    <em>{msg.content}</em>
                                ) : (
                                    msg.content
                                )}
                            </span>

                            {/* Time + actions */}
                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-xs text-gray-400">
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
                                            className="text-xs text-red-500 hover:text-red-700"
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
                    <div className="absolute bottom-0 left-0 w-full rounded-md border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 z-10">
                        {COMMANDS.map((cmd, i) => (
                            <button
                                key={cmd.name}
                                onClick={() => {
                                    setInput(cmd.name + " ")
                                    setShowCommands(false)
                                }}
                                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                    i === selectedCmd
                                        ? "bg-gray-100 dark:bg-gray-700"
                                        : ""
                                }`}
                            >
                                <div className="flex flex-col min-w-0">
                                    <span className="font-mono font-medium text-purple-600 dark:text-purple-400">
                                        {cmd.name}
                                    </span>
                                    <span className="text-[11px] text-gray-400 truncate">
                                        {cmd.usage
                                            .replace(/&lt;/g, "<")
                                            .replace(/&gt;/g, ">")}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-500 ml-auto shrink-0">
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
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    maxLength={500}
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Send
                </button>
            </div>

            {/* Quick commands */}
            <div className="flex gap-1 mt-2">
                <span className="text-xs text-gray-400 mr-1">Quick:</span>
                {COMMANDS.map(cmd => (
                    <button
                        key={cmd.name}
                        onClick={() => {
                            setInput(cmd.name + " ")
                            setShowCommands(true)
                        }}
                        className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                    >
                        {cmd.name}
                    </button>
                ))}
            </div>
        </div>
    )
}
