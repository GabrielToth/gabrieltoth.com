/**
 * Kick Chat Adapter
 * WebSocket-based chat adapter for Kick (wss://ws.kick.com)
 * Implements the ChatAdapter interface for multi-platform unified chat.
 *
 * Note: Uses Node.js WebSocket — only works in Node.js runtime.
 */

import { createLogger } from "../logger"
import type {
    ChatAdapter,
    ChatAdapterConfig,
    ChatMessage,
    ChatRoom,
    ChatUser,
    SendMessageOptions,
} from "./types"

const logger = createLogger("KickChatAdapter")

interface KickMessageHandler {
    (message: ChatMessage): void
}

interface KickChatConnection {
    roomId: string
    ws: WebSocket
    connected: boolean
    channelId: string
}

interface KickWsMessage {
    event: string
    data?: Record<string, unknown>
}

export class KickChatAdapter implements ChatAdapter {
    readonly platform = "kick" as const
    readonly config: ChatAdapterConfig = {
        platform: "kick",
        enabled: true,
        maxMessageLength: 500,
        commands: ["/timeout", "/ban", "/unban", "/slow", "/followers"],
    }

    private connections: Map<string, KickChatConnection> = new Map()
    private messageHandlers: Map<string, Set<KickMessageHandler>> = new Map()
    private errorHandlers: Set<(error: Error) => void> = new Set()
    private reconnectTimers: Map<string, ReturnType<typeof setTimeout>> =
        new Map()
    private reconnectAttempts: Map<string, number> = new Map()
    private readonly MAX_RECONNECT_ATTEMPTS = 5
    private readonly RECONNECT_DELAY_MS = 3000

    /**
     * Connect to a Kick chat room
     */
    async connect(roomId: string, token: string): Promise<void> {
        if (this.connections.has(roomId)) {
            logger.debug("Already connected to Kick room", { roomId })
            return
        }

        try {
            const wsUrl = `wss://ws.kick.com?token=${token}`

            const ws = new WebSocket(wsUrl)

            const connection: KickChatConnection = {
                roomId,
                ws,
                connected: false,
                channelId: roomId,
            }

            this.connections.set(roomId, connection)

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    if (!connection.connected) {
                        ws.close()
                        this.connections.delete(roomId)
                        reject(new Error("Kick WebSocket connection timeout"))
                    }
                }, 10000)

                ws.onopen = () => {
                    clearTimeout(timeout)
                    connection.connected = true

                    // Subscribe to chat channel
                    this.sendWsMessage(ws, "join", {
                        channel: roomId,
                    })

                    logger.info("Connected to Kick chat", { roomId })
                    resolve()
                }

                ws.onmessage = (event: MessageEvent) => {
                    try {
                        const message: KickWsMessage = JSON.parse(event.data)
                        this.handleWsMessage(roomId, message)
                    } catch (parseError) {
                        logger.warn("Failed to parse Kick WS message", {
                            error: String(parseError),
                        })
                    }
                }

                ws.onerror = (error: Event) => {
                    clearTimeout(timeout)
                    const err = new Error(
                        `Kick WebSocket error: ${JSON.stringify(error)}`
                    )
                    this.notifyError(err)
                    reject(err)
                }

                ws.onclose = () => {
                    connection.connected = false
                    this.connections.delete(roomId)
                    logger.info("Disconnected from Kick chat", { roomId })

                    // Attempt reconnection
                    this.scheduleReconnect(roomId, token)
                }
            })
        } catch (error) {
            const err =
                error instanceof Error ? error : new Error(String(error))
            logger.error("Failed to connect to Kick", {
                roomId,
                error: err.message,
            })
            throw err
        }
    }

    /**
     * Disconnect from a Kick chat room
     */
    async disconnect(roomId: string): Promise<void> {
        // Clear any pending reconnect
        const reconnectTimer = this.reconnectTimers.get(roomId)
        if (reconnectTimer) {
            clearTimeout(reconnectTimer)
            this.reconnectTimers.delete(roomId)
        }
        this.reconnectAttempts.delete(roomId)

        const connection = this.connections.get(roomId)
        if (!connection) {
            logger.debug("Not connected to Kick room", { roomId })
            return
        }

        try {
            this.sendWsMessage(connection.ws, "leave", {
                channel: roomId,
            })
            connection.ws.close()
        } catch (error) {
            logger.warn("Error disconnecting from Kick", {
                roomId,
                error: String(error),
            })
        }

        this.connections.delete(roomId)
        this.messageHandlers.delete(roomId)
        logger.info("Disconnected from Kick room", { roomId })
    }

    /**
     * Send a message to a Kick chat room
     */
    async sendMessage(
        roomId: string,
        message: string,
        _options?: SendMessageOptions
    ): Promise<string> {
        const connection = this.connections.get(roomId)
        if (!connection || !connection.connected) {
            throw new Error(`Not connected to Kick room: ${roomId}`)
        }

        if (message.length > this.config.maxMessageLength) {
            throw new Error(
                `Message exceeds Kick max length of ${this.config.maxMessageLength}`
            )
        }

        const messageId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`

        this.sendWsMessage(connection.ws, "send_message", {
            channel: roomId,
            content: message,
            id: messageId,
        })

        logger.debug("Message sent to Kick", {
            roomId,
            messageId,
            length: message.length,
        })

        return messageId
    }

    /**
     * Get room info
     */
    async getRoom(roomId: string): Promise<ChatRoom | null> {
        const connection = this.connections.get(roomId)
        if (!connection) return null

        return {
            id: roomId,
            platform: "kick",
            name: roomId,
            isLive: connection.connected,
        }
    }

    /**
     * Get message history
     */
    async getHistory(_roomId: string, limit?: number): Promise<ChatMessage[]> {
        logger.debug("Kick chat history requested (not yet implemented)", {
            limit,
        })
        return []
    }

    /**
     * Register a message handler for a room
     */
    onMessage(
        roomId: string,
        handler: (message: ChatMessage) => void
    ): () => void {
        if (!this.messageHandlers.has(roomId)) {
            this.messageHandlers.set(roomId, new Set())
        }

        this.messageHandlers.get(roomId)!.add(handler)

        return () => {
            this.messageHandlers.get(roomId)?.delete(handler)
        }
    }

    /**
     * Register an error handler
     */
    onError(handler: (error: Error) => void): () => void {
        this.errorHandlers.add(handler)
        return () => {
            this.errorHandlers.delete(handler)
        }
    }

    /**
     * Send a JSON message via WebSocket
     */
    private sendWsMessage(
        ws: WebSocket,
        event: string,
        data?: Record<string, unknown>
    ): void {
        if (ws.readyState !== WebSocket.OPEN) {
            logger.warn("Cannot send message, WebSocket not open", { event })
            return
        }

        const message: KickWsMessage = { event, data }
        ws.send(JSON.stringify(message))
    }

    /**
     * Handle an incoming WebSocket message
     */
    private handleWsMessage(roomId: string, wsMessage: KickWsMessage): void {
        try {
            switch (wsMessage.event) {
                case "message":
                    this.handleChatMessage(roomId, wsMessage.data)
                    break
                case "user_joined":
                    this.handleSystemEvent(roomId, wsMessage.data, "join")
                    break
                case "user_left":
                    this.handleSystemEvent(roomId, wsMessage.data, "leave")
                    break
                case "subscription":
                    this.handleSystemEvent(
                        roomId,
                        wsMessage.data,
                        "subscription"
                    )
                    break
                case "error":
                    logger.error("Kick WS error event", {
                        data: wsMessage.data,
                    })
                    break
                default:
                    logger.debug("Unhandled Kick WS event", {
                        event: wsMessage.event,
                    })
            }
        } catch (error) {
            logger.warn("Failed to handle Kick WS message", {
                error: String(error),
            })
        }
    }

    /**
     * Handle a chat message event
     */
    private handleChatMessage(
        roomId: string,
        data?: Record<string, unknown>
    ): void {
        if (!data) return

        const message: ChatMessage = {
            id: `kick-${(data.id as string) || `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`}`,
            channelId: roomId,
            platform: "kick",
            user: {
                id: (data.user_id as string) || "unknown",
                username:
                    ((data.sender as Record<string, unknown>)
                        ?.username as string) || "unknown",
                displayName:
                    ((data.sender as Record<string, unknown>)
                        ?.username as string) || "Unknown",
                platform: "kick",
                badges: [],
                isBroadcaster: (data.is_broadcaster as boolean) || false,
                isModerator: (data.is_moderator as boolean) || false,
                isSubscriber: (data.is_subscriber as boolean) || false,
                isVip: (data.is_vip as boolean) || false,
            },
            content: (data.content as string) || "",
            type: "text",
            timestamp: (data.created_at as number) || Date.now(),
        }

        this.notifyMessageHandlers(roomId, message)
    }

    /**
     * Handle a system event (join, leave, subscription)
     */
    private handleSystemEvent(
        roomId: string,
        data?: Record<string, unknown>,
        eventType?: string
    ): void {
        if (!data) return

        const username =
            (data.username as string) ||
            ((data.user as Record<string, unknown>)?.username as string) ||
            "Unknown"

        let content = ""
        switch (eventType) {
            case "join":
                content = `${username} joined the chat`
                break
            case "leave":
                content = `${username} left the chat`
                break
            case "subscription":
                content = `${username} subscribed!`
                break
        }

        const message: ChatMessage = {
            id: `kick-sys-${Date.now()}`,
            channelId: roomId,
            platform: "kick",
            user: {
                id: "system",
                username: "kick",
                displayName: "Kick",
                platform: "kick",
                badges: [],
            },
            content,
            type: "system",
            timestamp: Date.now(),
        }

        this.notifyMessageHandlers(roomId, message)
    }

    /**
     * Schedule reconnection on disconnect
     */
    private scheduleReconnect(roomId: string, token: string): void {
        const attempts = this.reconnectAttempts.get(roomId) || 0

        if (attempts >= this.MAX_RECONNECT_ATTEMPTS) {
            logger.warn("Max Kick reconnect attempts reached", { roomId })
            this.reconnectAttempts.delete(roomId)
            return
        }

        this.reconnectAttempts.set(roomId, attempts + 1)

        const delay = this.RECONNECT_DELAY_MS * Math.pow(2, attempts)

        logger.info("Scheduling Kick reconnect", {
            roomId,
            attempt: attempts + 1,
            delay,
        })

        const timer = setTimeout(() => {
            this.reconnectTimers.delete(roomId)
            this.connect(roomId, token).catch(err => {
                logger.error("Kick reconnect failed", {
                    roomId,
                    error: String(err),
                })
            })
        }, delay)

        this.reconnectTimers.set(roomId, timer)
    }

    /**
     * Notify all message handlers for a room
     */
    private notifyMessageHandlers(roomId: string, message: ChatMessage): void {
        const handlers = this.messageHandlers.get(roomId)
        if (handlers) {
            for (const handler of handlers) {
                try {
                    handler(message)
                } catch (error) {
                    logger.error("Message handler error", {
                        roomId,
                        error: String(error),
                    })
                }
            }
        }
    }

    /**
     * Notify all error handlers
     */
    private notifyError(error: Error): void {
        for (const handler of this.errorHandlers) {
            try {
                handler(error)
            } catch (handlerError) {
                logger.error("Error handler failed", {
                    error: String(handlerError),
                })
            }
        }
    }
}
