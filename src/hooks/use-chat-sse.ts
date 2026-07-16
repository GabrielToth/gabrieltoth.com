/**
 * useChatSSE Hook
 * React hook for consuming the SSE chat stream.
 * Connects to /api/live/chat/stream and provides real-time messages.
 */

"use client"

import { createLogger } from "@/lib/logger"
import { useCallback, useEffect, useRef, useState } from "react"

const logger = createLogger("useChatSSE")

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

interface UseChatSSEReturn {
    messages: SSEChatMessage[]
    statuses: PlatformStatus[]
    isConnected: boolean
    error: SSEError | null
}

const MAX_RECONNECT_DELAY_MS = 30_000
const INITIAL_RECONNECT_DELAY_MS = 1_000

export function useChatSSE(_platforms: string[]): UseChatSSEReturn {
    const [messages, setMessages] = useState<SSEChatMessage[]>([])
    const [statuses, setStatuses] = useState<PlatformStatus[]>([])
    const [isConnected, setIsConnected] = useState(false)
    const [error, setError] = useState<SSEError | null>(null)

    const lastEventRef = useRef<EventSource | null>(null)
    const reconnectAttemptRef = useRef(0)
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const mountedRef = useRef(true)

    const connect = useCallback(() => {
        if (!mountedRef.current) return

        // Close existing connection
        if (lastEventRef.current) {
            lastEventRef.current.close()
        }

        const eventSource = new EventSource("/api/live/chat/stream")
        lastEventRef.current = eventSource

        eventSource.addEventListener("connected", (event: MessageEvent) => {
            if (!mountedRef.current) return
            setIsConnected(true)
            setError(null)
            reconnectAttemptRef.current = 0
            logger.debug("SSE connected", { data: event.data })
        })

        eventSource.addEventListener("message", (event: MessageEvent) => {
            if (!mountedRef.current) return
            try {
                const message: SSEChatMessage = JSON.parse(event.data)
                setMessages(prev => {
                    if (prev.some(m => m.id === message.id)) return prev
                    return [...prev, message]
                })
            } catch (parseError) {
                logger.warn("Failed to parse SSE message", {
                    error: String(parseError),
                })
            }
        })

        eventSource.addEventListener("status", (event: MessageEvent) => {
            if (!mountedRef.current) return
            try {
                const status: PlatformStatus = JSON.parse(event.data)
                setStatuses(prev => {
                    const existing = prev.findIndex(
                        s => s.platform === status.platform
                    )
                    if (existing >= 0) {
                        const updated = [...prev]
                        updated[existing] = status
                        return updated
                    }
                    return [...prev, status]
                })
            } catch (parseError) {
                logger.warn("Failed to parse SSE status", {
                    error: String(parseError),
                })
            }
        })

        eventSource.addEventListener("error", (event: MessageEvent) => {
            if (!mountedRef.current) return
            try {
                const err: SSEError = JSON.parse(event.data)
                setError(err)
            } catch {
                // The EventSource error event may fire without data
                // This indicates a connection issue
                setIsConnected(false)
                scheduleReconnect()
            }
        })

        eventSource.onerror = () => {
            if (!mountedRef.current) return
            setIsConnected(false)
            scheduleReconnect()
        }

        function scheduleReconnect(): void {
            if (!mountedRef.current) return

            const attempt = reconnectAttemptRef.current
            const delay = Math.min(
                INITIAL_RECONNECT_DELAY_MS * Math.pow(2, attempt),
                MAX_RECONNECT_DELAY_MS
            )

            logger.debug("Scheduling SSE reconnect", {
                attempt: attempt + 1,
                delay,
            })

            reconnectTimerRef.current = setTimeout(() => {
                reconnectAttemptRef.current++
                connect()
            }, delay)
        }
    }, [])

    useEffect(() => {
        mountedRef.current = true
        connect()

        return () => {
            mountedRef.current = false

            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current)
                reconnectTimerRef.current = null
            }

            if (lastEventRef.current) {
                lastEventRef.current.close()
                lastEventRef.current = null
            }

            setIsConnected(false)
        }
    }, [connect])

    return {
        messages,
        statuses,
        isConnected,
        error,
    }
}
