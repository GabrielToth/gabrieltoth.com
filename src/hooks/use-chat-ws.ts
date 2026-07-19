"use client"

import { createLogger } from "@/lib/logger"
import { useCallback, useEffect, useRef, useState } from "react"

const logger = createLogger("useChatWS")

export interface SSEProfileBadge {
    id: string
    label: string
    imageUrl: string
}

export interface SSEUser {
    id: string
    username: string
    displayName: string
    platform: string
    badges: SSEProfileBadge[]
    isBroadcaster?: boolean
    isModerator?: boolean
    isSubscriber?: boolean
    isVip?: boolean
}

export interface SSEChatMessage {
    id: string
    channelId: string
    platform: string
    user: SSEUser
    content: string
    type: string
    timestamp: number
    isAction?: boolean
}

export interface PlatformStatus {
    platform: string
    connected: boolean
}

export interface SSEError {
    platform: string
    error: string
}

interface UseChatWSReturn {
    messages: SSEChatMessage[]
    statuses: PlatformStatus[]
    isConnected: boolean
    error: SSEError | null
    addMessage: (message: SSEChatMessage) => void
}

const WS_URL = "wss://ws.gabrieltoth.com"
const MAX_RECONNECT_DELAY_MS = 30_000
const INITIAL_RECONNECT_DELAY_MS = 1_000
const DEDUP_WINDOW_MS = 3_000
const TOKEN_REFRESH_BEFORE_MS = 60_000

export function useChatWS(_platforms: string[]): UseChatWSReturn {
    const [messages, setMessages] = useState<SSEChatMessage[]>([])
    const [statuses, setStatuses] = useState<PlatformStatus[]>([])
    const [isConnected, setIsConnected] = useState(false)
    const [error, setError] = useState<SSEError | null>(null)

    const wsRef = useRef<WebSocket | null>(null)
    const tokenRef = useRef<string | null>(null)
    const reconnectAttemptRef = useRef(0)
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const tokenFetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const mountedRef = useRef(true)

    const fetchToken = useCallback(async (): Promise<string | null> => {
        try {
            const res = await fetch("/api/live/chat/ws-token", {
                method: "POST",
                credentials: "same-origin",
            })
            if (!res.ok) {
                logger.warn("Failed to fetch WS token", { status: res.status })
                return null
            }
            const data = await res.json()
            if (data?.token) {
                return data.token
            }
            return null
        } catch (err) {
            logger.warn("Failed to fetch WS token", { error: String(err) })
            return null
        }
    }, [])

    const connect = useCallback(async () => {
        if (!mountedRef.current) return

        if (wsRef.current) {
            wsRef.current.close()
            wsRef.current = null
        }

        let token = tokenRef.current
        if (!token) {
            token = await fetchToken()
            if (!token) {
                logger.warn("No WS token available, retrying...")
                reconnectTimerRef.current = setTimeout(() => {
                    reconnectAttemptRef.current++
                    connect()
                }, INITIAL_RECONNECT_DELAY_MS)
                return
            }
            tokenRef.current = token
        }

        const url = `${WS_URL}?token=${encodeURIComponent(token)}`
        const ws = new WebSocket(url)
        wsRef.current = ws

        ws.onopen = () => {
            if (!mountedRef.current) {
                ws.close()
                return
            }
            setIsConnected(true)
            setError(null)
            reconnectAttemptRef.current = 0
            logger.debug("WS connected")
        }

        ws.onmessage = (event: MessageEvent) => {
            if (!mountedRef.current) return
            try {
                const data = JSON.parse(event.data)
                if (!data.type) return

                switch (data.type) {
                    case "connected":
                        setIsConnected(true)
                        setError(null)
                        break

                    case "message": {
                        const msg: SSEChatMessage = {
                            id: data.id || `${data.platform}-${data.timestamp}-${Math.random().toString(36).slice(2, 8)}`,
                            channelId: data.channel || "",
                            platform: data.platform || "unknown",
                            user: {
                                id: data.user?.id || "",
                                username: data.user?.username || "unknown",
                                displayName: data.user?.displayName || data.user?.username || "Unknown",
                                platform: data.platform || "unknown",
                                badges: data.user?.badges || [],
                                isBroadcaster: data.user?.isBroadcaster || false,
                                isModerator: data.user?.isModerator || false,
                                isSubscriber: data.user?.isSubscriber || false,
                                isVip: data.user?.isVip || false,
                            },
                            content: data.content || "",
                            type: data.subtype || "chat",
                            timestamp: data.timestamp || Date.now(),
                            isAction: data.isAction || false,
                        }
                        setMessages(prev => {
                            if (prev.some(m => m.id === msg.id)) return prev
                            if (
                                prev.some(
                                    m =>
                                        m.user.id === msg.user.id &&
                                        m.content === msg.content &&
                                        m.channelId === msg.channelId &&
                                        Math.abs(m.timestamp - msg.timestamp) < DEDUP_WINDOW_MS
                                )
                            ) {
                                return prev
                            }
                            return [...prev, msg]
                        })
                        break
                    }

                    case "status": {
                        const status: PlatformStatus = {
                            platform: data.platform || "unknown",
                            connected: data.connected ?? false,
                        }
                        setStatuses(prev => {
                            const existing = prev.findIndex(s => s.platform === status.platform)
                            if (existing >= 0) {
                                const updated = [...prev]
                                updated[existing] = status
                                return updated
                            }
                            return [...prev, status]
                        })
                        break
                    }

                    case "error": {
                        setError({
                            platform: data.platform || "unknown",
                            error: data.error || data.message || "Unknown error",
                        })
                        break
                    }
                }
            } catch (parseError) {
                logger.warn("Failed to parse WS message", { error: String(parseError) })
            }
        }

        ws.onclose = () => {
            if (!mountedRef.current) return
            setIsConnected(false)
            tokenRef.current = null
            scheduleReconnect()
        }

        ws.onerror = () => {
            if (!mountedRef.current) return
        }
    }, [fetchToken])

    const scheduleReconnect = useCallback(() => {
        if (!mountedRef.current) return
        const attempt = reconnectAttemptRef.current
        const delay = Math.min(
            INITIAL_RECONNECT_DELAY_MS * Math.pow(2, attempt),
            MAX_RECONNECT_DELAY_MS
        )
        logger.debug("Scheduling WS reconnect", { attempt: attempt + 1, delay })
        reconnectTimerRef.current = setTimeout(() => {
            reconnectAttemptRef.current++
            connect()
        }, delay)
    }, [connect])

    useEffect(() => {
        mountedRef.current = true
        connect()

        return () => {
            mountedRef.current = false
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current)
                reconnectTimerRef.current = null
            }
            if (tokenFetchTimerRef.current) {
                clearTimeout(tokenFetchTimerRef.current)
                tokenFetchTimerRef.current = null
            }
            if (wsRef.current) {
                wsRef.current.close()
                wsRef.current = null
            }
            setIsConnected(false)
        }
    }, [connect])

    const addMessage = useCallback((message: SSEChatMessage) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
                JSON.stringify({
                    type: "send",
                    platform: message.platform,
                    channel: message.channelId,
                    text: message.content,
                })
            )
        }
        setMessages(prev => {
            if (prev.some(m => m.id === message.id)) return prev
            return [...prev, message]
        })
    }, [])

    return {
        messages,
        statuses,
        isConnected,
        error,
        addMessage,
    }
}
