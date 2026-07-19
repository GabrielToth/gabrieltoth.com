"use client"

import { createLogger } from "@/lib/logger"
import { useCallback, useEffect, useRef, useState } from "react"

const logger = createLogger("useRelayChat")

export interface RelayChatMessage {
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
    }
    content: string
    type: string
    timestamp: number
    isAction?: boolean
}

interface RelayPlatformStatus {
    platform: string
    connected: boolean
    liveChatId?: string
}

interface UseRelayChatReturn {
    messages: RelayChatMessage[]
    statuses: RelayPlatformStatus[]
    isConnected: boolean
    error: string | null
}

const INITIAL_RECONNECT_DELAY = 1_000
const MAX_RECONNECT_DELAY = 30_000
const TOKEN_REFRESH_INTERVAL = 4 * 60 * 1000

export function useRelayChat(): UseRelayChatReturn {
    const [messages, setMessages] = useState<RelayChatMessage[]>([])
    const [statuses, setStatuses] = useState<RelayPlatformStatus[]>([])
    const [isConnected, setIsConnected] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const wsRef = useRef<WebSocket | null>(null)
    const reconnectAttemptRef = useRef(0)
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const mountedRef = useRef(true)
    const tokenRef = useRef<string>("")
    const platformsRef = useRef<Record<string, { channelName: string; accessToken?: string }>>({})
    const tokenTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const connectRef = useRef<() => void>(() => {})

    const relayUrl = process.env.NEXT_PUBLIC_RELAY_WS_URL || ""

    const fetchCredentials = useCallback(async () => {
        try {
            const res = await fetch("/api/auth/relay-token")
            if (!res.ok) {
                throw new Error(`Failed to fetch relay credentials: ${res.status}`)
            }
            const data = await res.json()
            if (!data.success) {
                throw new Error(data.error || "Failed to fetch relay credentials")
            }
            tokenRef.current = data.token
            platformsRef.current = data.platforms || {}
            return true
        } catch (err) {
            logger.error("Failed to fetch relay credentials", { error: String(err) })
            return false
        }
    }, [])

    const sendConnectMessage = useCallback((ws: WebSocket) => {
        for (const [platform, info] of Object.entries(platformsRef.current)) {
            if (info.accessToken) {
                ws.send(JSON.stringify({
                    type: "connect",
                    platform,
                    token: info.accessToken,
                }))
                logger.debug("Sent relay connect", { platform })
            }
        }
    }, [])

    const scheduleReconnect = useCallback(() => {
        if (!mountedRef.current) return

        const attempt = reconnectAttemptRef.current
        const delay = Math.min(
            INITIAL_RECONNECT_DELAY * Math.pow(2, attempt),
            MAX_RECONNECT_DELAY
        )
        reconnectAttemptRef.current = attempt + 1

        reconnectTimerRef.current = setTimeout(() => {
            if (mountedRef.current) {
                connectRef.current?.()
            }
        }, delay)
    }, [])

    const connect = useCallback(async () => {
        if (!mountedRef.current) return
        if (!relayUrl) return

        wsRef.current?.close()
        wsRef.current = null

        const hasCredentials = await fetchCredentials()
        if (!hasCredentials) {
            setError("Failed to get relay credentials")
            scheduleReconnect()
            return
        }

        if (!tokenRef.current) {
            setError("No relay token available")
            scheduleReconnect()
            return
        }

        try {
            const url = `${relayUrl}?token=${encodeURIComponent(tokenRef.current)}`
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
                sendConnectMessage(ws)
                logger.info("Relay WebSocket connected")
            }

            ws.onmessage = (event: MessageEvent) => {
                if (!mountedRef.current) return
                try {
                    const data = JSON.parse(event.data as string)

                    if (data.type === "connected") {
                        logger.info("Relay connection established", { userId: data.data?.userId })
                        return
                    }

                    if (data.type === "status") {
                        setStatuses(prev => {
                            const existing = prev.findIndex(s => s.platform === data.platform)
                            const entry: RelayPlatformStatus = {
                                platform: data.platform,
                                connected: data.connected,
                                liveChatId: data.liveChatId,
                            }
                            if (existing >= 0) {
                                const updated = [...prev]
                                updated[existing] = entry
                                return updated
                            }
                            return [...prev, entry]
                        })
                        return
                    }

                    if (data.type === "error") {
                        setError(data.error || "Relay error")
                        return
                    }

                    if (data.event === "youtube:message") {
                        const message: RelayChatMessage = {
                            id: data.id,
                            channelId: data.channelId,
                            platform: "youtube",
                            user: data.user,
                            content: data.content,
                            type: data.msgType || "text",
                            timestamp: data.timestamp,
                        }
                        setMessages(prev => {
                            if (prev.some(m => m.id === message.id)) return prev
                            return [...prev, message]
                        })
                        return
                    }
                } catch {
                    // ignore unparseable messages
                }
            }

            ws.onerror = () => {
                if (!mountedRef.current) return
                setError("Relay WebSocket connection failed")
            }

            ws.onclose = () => {
                if (!mountedRef.current) return
                setIsConnected(false)
                wsRef.current = null
                scheduleReconnect()
            }
        } catch (err) {
            logger.error("Relay WebSocket connect error", { error: String(err) })
            setError(String(err))
            scheduleReconnect()
        }
    }, [relayUrl, fetchCredentials, sendConnectMessage, scheduleReconnect])

    useEffect(() => {
        mountedRef.current = true
        connectRef.current = connect

        if (relayUrl) {
            connect()

            tokenTimerRef.current = setInterval(() => {
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    fetchCredentials()
                }
            }, TOKEN_REFRESH_INTERVAL)
        }

        return () => {
            mountedRef.current = false

            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current)
                reconnectTimerRef.current = null
            }

            if (tokenTimerRef.current) {
                clearInterval(tokenTimerRef.current)
                tokenTimerRef.current = null
            }

            if (wsRef.current) {
                wsRef.current.close()
                wsRef.current = null
            }

            setIsConnected(false)
        }
    }, [relayUrl, connect, fetchCredentials])

    return { messages, statuses, isConnected, error }
}
