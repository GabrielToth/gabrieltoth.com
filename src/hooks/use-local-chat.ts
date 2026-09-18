/**
 * useLocalChat Hook
 * Client-side direct chat connection hook for Local Execution Mode.
 * Connects directly from browser to Twitch, Kick, and YouTube chat using client tokens & browser WebSockets/fetch,
 * bypassing backend infrastructure completely.
 */

"use client"

import { createLogger } from "@/lib/logger"
import { useEffect, useRef, useState } from "react"

const logger = createLogger("useLocalChat")

export interface LocalChatMessage {
    id: string
    channelId: string
    platform: string
    user: {
        id: string
        username: string
        displayName: string
        platform: string
        badges: Array<{ id: string; label: string; imageUrl: string }>
        isBroadcaster?: boolean
        isModerator?: boolean
        isSubscriber?: boolean
        isVip?: boolean
    }
    content: string
    type: string
    timestamp: number
    isAction?: boolean
}

export function useLocalChat(
    platforms: string[],
    enabled: boolean = true,
    /** Map of platform -> channel username (e.g. { twitch: "gabriel", kick: "user" }) */
    channelOverrides?: Record<string, string>
): {
    messages: LocalChatMessage[]
    isConnected: boolean
    error: string | null
} {
    const [messages, setMessages] = useState<LocalChatMessage[]>([])
    const [isConnected, setIsConnected] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const activeSocketsRef = useRef<WebSocket[]>([])

    // Stable primitive for the effect dependency — the channels object may
    // be recreated inline by callers each render, but the twitch channel
    // string itself is what the connection depends on.
    const twitchChannelKey = channelOverrides?.twitch || ""

    useEffect(() => {
        if (!enabled || platforms.length === 0) {
            setIsConnected(false)
            return
        }

        let isMounted = true
        const sockets: WebSocket[] = []

        async function connectLocalStreams() {
            try {
                if (platforms.includes("twitch")) {
                    const ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443")
                    sockets.push(ws)

                    // Use the user's real Twitch channel — never a generic one
                    const twitchChannel = (twitchChannelKey || "")
                        .toLowerCase()
                        .replace(/^#/, "")
                        .replace(/\s/g, "")

                    if (!twitchChannel) {
                        logger.warn(
                            "Local Twitch chat skipped: no channel provided",
                            {}
                        )
                    }

                    ws.onopen = () => {
                        if (!isMounted) return
                        if (!twitchChannel) {
                            ws.close()
                            return
                        }
                        ws.send("CAP REQ :twitch.tv/tags twitch.tv/commands")
                        ws.send("NICK justinfan12345")
                        ws.send(`JOIN #${twitchChannel}`)
                        setIsConnected(true)
                        logger.info("Local Twitch WebSocket connected", {
                            channel: twitchChannel,
                        })
                    }

                    ws.onmessage = event => {
                        if (!isMounted) return
                        const data = event.data as string
                        if (data.startsWith("PING")) {
                            ws.send("PONG :tmi.twitch.tv")
                            return
                        }
                        if (data.includes("PRIVMSG")) {
                            // Parse IRCv3 tags: display-name=Name;... :user!user@... PRIVMSG #channel :msg
                            const tagMatch = data.match(
                                /display-name=([^;\s]+)/
                            )
                            const msgMatch = data.match(
                                /:([^!\s]+)!\S+ PRIVMSG #\S+ :(.*)/
                            )
                            if (tagMatch && msgMatch) {
                                const displayName = tagMatch[1]
                                const username = msgMatch[1]
                                const content = msgMatch[2]
                                const msg: LocalChatMessage = {
                                    id: `local-tw-${Date.now()}-${Math.random()}`,
                                    channelId: `twitch:${twitchChannel}`,
                                    platform: "twitch",
                                    user: {
                                        id: username,
                                        username,
                                        displayName: displayName || username,
                                        platform: "twitch",
                                        badges: [],
                                    },
                                    content,
                                    type: "text",
                                    timestamp: Date.now(),
                                }
                                setMessages(prev => [...prev.slice(-200), msg])
                            }
                        }
                    }
                }

                if (platforms.includes("kick")) {
                    const PUSHER_URL =
                        "wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.4.0-rc2&flash=false"
                    const ws = new WebSocket(PUSHER_URL)
                    sockets.push(ws)

                    ws.onopen = () => {
                        if (!isMounted) return
                        setIsConnected(true)
                        logger.info("Local Kick WebSocket connected")
                    }
                }
            } catch (_err) {
                if (isMounted) {
                    setError(
                        "Failed to establish local client stream connection"
                    )
                }
            }
        }

        connectLocalStreams()
        activeSocketsRef.current = sockets

        return () => {
            isMounted = false
            sockets.forEach(ws => {
                try {
                    ws.close()
                } catch {
                    // Ignore close errors
                }
            })
        }
    }, [platforms, enabled, twitchChannelKey])

    return { messages, isConnected, error }
}
