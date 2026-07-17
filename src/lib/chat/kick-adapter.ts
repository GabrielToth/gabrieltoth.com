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

const PUSHER_APP_KEY = "32cbd69e4b950bf97679"
const PUSHER_CLUSTER = "us2"
const PUSHER_URL = `wss://ws-${PUSHER_CLUSTER}.pusher.com/app/${PUSHER_APP_KEY}?protocol=7&client=js&version=8.4.0-rc2&flash=false`

interface KickMessageHandler {
    (message: ChatMessage): void
}

interface KickConnection {
    roomId: string
    ws: WebSocket
    connected: boolean
    channelName: string
    chatroomId: number | null
    broadcasterUserId: string | null
    oauthToken: string
    pingInterval: ReturnType<typeof setInterval> | null
}

interface PusherEvent {
    event: string
    channel?: string
    data?: string
}

async function getChatroomId(
    channelName: string
): Promise<{ chatroomId: number; broadcasterUserId: string } | null> {
    // Try internal JSON API first
    try {
        const response = await fetch(
            `https://kick.com/api/v2/channels/${channelName}`,
            {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0",
                    Accept: "application/json",
                    Referer: "https://kick.com/",
                },
            }
        )

        if (response.ok) {
            const data = await response.json()
            const chatroomId = data.chatroom?.id || null
            const broadcasterUserId = String(data.user?.id || data.id || "")
            if (chatroomId) {
                return { chatroomId, broadcasterUserId }
            }
        }
    } catch {
        // fall through to HTML scrape
    }

    // Fallback: scrape channel page for chatroom ID in embedded data
    try {
        const pageResponse = await fetch(
            `https://kick.com/${channelName}`,
            {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0",
                    Accept: "text/html,application/xhtml+xml",
                    "Accept-Language": "en-US,en;q=0.5",
                },
            }
        )

        if (!pageResponse.ok) {
            logger.warn("Kick channel page fetch failed", {
                status: pageResponse.status,
            })
            return null
        }

        const html = await pageResponse.text()

        // Try to find chatroom ID in embedded JSON data
        const chatroomMatch = html.match(
            /"chatroom"\s*:\s*\{\s*"id"\s*:\s*(\d+)/i
        )
        const userMatch = html.match(/"id"\s*:\s*(\d+)/)

        if (chatroomMatch) {
            return {
                chatroomId: parseInt(chatroomMatch[1], 10),
                broadcasterUserId: userMatch ? userMatch[1] : "",
            }
        }

        // Try alternative patterns
        const altMatch = html.match(
            /chatroom[_-]?id[^"]*["']?\s*[:=]\s*["']?(\d+)/i
        )
        if (altMatch) {
            return {
                chatroomId: parseInt(altMatch[1], 10),
                broadcasterUserId: "",
            }
        }

        return null
    } catch (error) {
        logger.warn("Failed to scrape Kick chatroom ID", { error })
        return null
    }
}

export class KickChatAdapter implements ChatAdapter {
    readonly platform = "kick" as const
    readonly config: ChatAdapterConfig = {
        platform: "kick",
        enabled: true,
        maxMessageLength: 500,
        commands: [],
    }

    private connections: Map<string, KickConnection> = new Map()
    private messageHandlers: Map<string, Set<KickMessageHandler>> = new Map()
    private errorHandlers: Set<(error: Error) => void> = new Set()
    private reconnectTimers: Map<string, ReturnType<typeof setTimeout>> =
        new Map()
    private reconnectAttempts: Map<string, number> = new Map()
    private readonly MAX_RECONNECT_ATTEMPTS = 5
    private readonly RECONNECT_DELAY_MS = 3000

    async connect(roomId: string, token: string): Promise<void> {
        if (this.connections.has(roomId)) {
            logger.debug("Already connected to Kick room", { roomId })
            return
        }

        try {
            const channelInfo = await getChatroomId(roomId)
            const chatroomId = channelInfo?.chatroomId || null
            const broadcasterUserId = channelInfo?.broadcasterUserId || ""

            if (!chatroomId) {
                logger.warn(
                    "No chatroom ID found, Kick receive will be unavailable",
                    { roomId }
                )
            }

            const ws = new WebSocket(PUSHER_URL)
            const connection: KickConnection = {
                roomId,
                ws,
                connected: false,
                channelName: roomId,
                chatroomId,
                broadcasterUserId,
                oauthToken: token,
                pingInterval: null,
            }

            this.connections.set(roomId, connection)

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    if (!connection.connected) {
                        ws.close()
                        this.connections.delete(roomId)
                        reject(new Error("Kick Pusher connection timeout"))
                    }
                }, 15000)

                ws.onopen = () => {
                    clearTimeout(timeout)
                }

                ws.onmessage = (event: MessageEvent) => {
                    try {
                        const pusherEvent: PusherEvent = JSON.parse(event.data)

                        switch (pusherEvent.event) {
                            case "pusher:connection_established":
                                connection.connected = true
                                if (chatroomId) {
                                    this.subscribeToChatroom(ws, chatroomId)
                                    connection.pingInterval = setInterval(
                                        () => {
                                            ws.send(
                                                JSON.stringify({
                                                    event: "pusher:ping",
                                                    data: {},
                                                })
                                            )
                                        },
                                        60000
                                    )
                                }
                                logger.info("Connected to Kick Pusher", {
                                    roomId,
                                })
                                resolve()
                                break

                            case "pusher:ping":
                                ws.send(
                                    JSON.stringify({
                                        event: "pusher:pong",
                                        data: {},
                                    })
                                )
                                break

                            case "pusher:error":
                                logger.error("Kick Pusher error", {
                                    data: pusherEvent.data,
                                })
                                break

                            default:
                                if (
                                    pusherEvent.event.startsWith(
                                        "App\\Events\\"
                                    ) ||
                                    pusherEvent.event === "ChatMessageEvent"
                                ) {
                                    this.handlePusherData(roomId, pusherEvent)
                                }
                        }
                    } catch {
                        // non-JSON messages are ignored
                    }
                }

                ws.onerror = () => {
                    clearTimeout(timeout)
                    const err = new Error("Kick Pusher connection failed")
                    this.notifyError(err)
                    reject(err)
                }

                ws.onclose = () => {
                    connection.connected = false
                    if (connection.pingInterval) {
                        clearInterval(connection.pingInterval)
                    }
                    this.connections.delete(roomId)
                    logger.info("Disconnected from Kick Pusher", { roomId })
                    this.scheduleReconnect(roomId, token)
                }
            })
        } catch (error) {
            const err =
                error instanceof Error ? error : new Error(String(error))
            logger.error("Failed to connect to Kick Pusher", {
                roomId,
                error: err.message,
            })
            throw err
        }
    }

    private subscribeToChatroom(ws: WebSocket, chatroomId: number): void {
        ws.send(
            JSON.stringify({
                event: "pusher:subscribe",
                data: {
                    auth: "",
                    channel: `chatrooms.${chatroomId}.v2`,
                },
            })
        )
        logger.debug("Subscribed to Kick chatroom", { chatroomId })
    }

    private handlePusherData(roomId: string, event: PusherEvent): void {
        if (!event.data) return

        try {
            const payload =
                typeof event.data === "string"
                    ? JSON.parse(event.data)
                    : event.data

            if (!payload || payload.type === "system_message") return

            const sender = payload.sender || payload.user || {}
            const message: ChatMessage = {
                id: `kick-${payload.id || `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`}`,
                channelId: roomId,
                platform: "kick",
                user: {
                    id: String(sender.id || payload.user_id || "unknown"),
                    username: String(
                        sender.username || payload.username || "unknown"
                    ).toLowerCase(),
                    displayName: String(
                        sender.username ||
                            payload.username ||
                            sender.name ||
                            "Unknown"
                    ),
                    platform: "kick",
                    badges: [],
                    isBroadcaster:
                        sender.is_broadcaster === true ||
                        payload.is_broadcaster === true,
                    isModerator:
                        sender.is_moderator === true ||
                        payload.is_moderator === true,
                    isSubscriber:
                        sender.is_subscriber === true ||
                        payload.is_subscriber === true,
                    isVip: sender.is_vip === true || payload.is_vip === true,
                },
                content: String(payload.content || payload.message || ""),
                type: "text",
                timestamp: payload.created_at
                    ? new Date(payload.created_at).getTime()
                    : Date.now(),
            }

            this.notifyMessageHandlers(roomId, message)
        } catch (error) {
            logger.warn("Failed to parse Kick Pusher message", {
                error: String(error),
            })
        }
    }

    async disconnect(roomId: string): Promise<void> {
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

        if (connection.pingInterval) {
            clearInterval(connection.pingInterval)
        }

        try {
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

    async sendMessage(
        roomId: string,
        message: string,
        _options?: SendMessageOptions
    ): Promise<string> {
        const connection = this.connections.get(roomId)
        if (!connection) {
            throw new Error(`Not connected to Kick room: ${roomId}`)
        }

        if (message.length > this.config.maxMessageLength) {
            throw new Error(
                `Message exceeds Kick max length of ${this.config.maxMessageLength}`
            )
        }

        const messageId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`

        if (!connection.oauthToken) {
            throw new Error(
                "No OAuth token available for sending Kick messages"
            )
        }

        const body: Record<string, unknown> = {
            content: message,
        }

        if (connection.broadcasterUserId) {
            body.broadcaster_user_id = connection.broadcasterUserId
        }

        try {
            const response = await fetch(
                "https://api.kick.com/public/v1/chat",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${connection.oauthToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(body),
                }
            )

            if (!response.ok) {
                const errorBody = await response.text()
                logger.error("Kick send message failed", {
                    status: response.status,
                    body: errorBody,
                })
                throw new Error(
                    `Kick API error (${response.status}): ${errorBody}`
                )
            }

            logger.debug("Message sent to Kick", {
                roomId,
                messageId,
                length: message.length,
            })

            return messageId
        } catch (error) {
            const err =
                error instanceof Error ? error : new Error(String(error))
            logger.error("Failed to send Kick message", {
                roomId,
                error: err.message,
            })
            throw err
        }
    }

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

    async getHistory(_roomId: string, limit?: number): Promise<ChatMessage[]> {
        logger.debug("Kick chat history requested (not yet implemented)", {
            limit,
        })
        return []
    }

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

    onError(handler: (error: Error) => void): () => void {
        this.errorHandlers.add(handler)
        return () => {
            this.errorHandlers.delete(handler)
        }
    }

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
