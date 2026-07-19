import { createLogger } from "../logger"
import type {
    ChatAdapter,
    ChatAdapterConfig,
    ChatMessage,
    ChatRoom,
    ChatUser,
    SendMessageOptions,
} from "./types"

const logger = createLogger("YouTubeRelayChatAdapter")

const RELAY_WS_URL =
    process.env.YOUTUBE_RELAY_WS_URL || "ws://192.168.1.100:3100"

const RECONNECT_DELAY_MS = 2_000
const MAX_RECONNECT_DELAY_MS = 30_000

interface YouTubeRelayMessageHandler {
    (message: ChatMessage): void
}

interface YouTubeRelayConnection {
    roomId: string
    ws: WebSocket | null
    state: "disconnected" | "connecting" | "connected"
    oauthToken: string
    cleanupFns: Array<() => void>
}

export class YouTubeRelayChatAdapter implements ChatAdapter {
    readonly platform = "youtube" as const
    readonly config: ChatAdapterConfig = {
        platform: "youtube",
        enabled: true,
        maxMessageLength: 200,
        commands: [],
    }

    private connections: Map<string, YouTubeRelayConnection> = new Map()
    private messageHandlers: Map<string, Set<YouTubeRelayMessageHandler>> =
        new Map()
    private errorHandlers: Set<(error: Error) => void> = new Set()

    async connect(roomId: string, token: string): Promise<void> {
        if (this.connections.has(roomId)) {
            logger.debug("Already connecting to YouTube relay", { roomId })
            return
        }

        const connection: YouTubeRelayConnection = {
            roomId,
            ws: null,
            state: "connecting",
            oauthToken: token,
            cleanupFns: [],
        }

        this.connections.set(roomId, connection)

        return this.connectToRelay(connection)
    }

    private connectToRelay(
        connection: YouTubeRelayConnection
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                if (connection.state !== "connected") {
                    connection.state = "disconnected"
                    this.connections.delete(connection.roomId)
                    reject(new Error("YouTube relay connection timeout"))
                }
            }, 10000)

            try {
                const ws = new WebSocket(RELAY_WS_URL)
                connection.ws = ws

                ws.onopen = () => {
                    clearTimeout(timeout)
                    ws.send(
                        JSON.stringify({
                            type: "connect",
                            platform: "youtube",
                            token: connection.oauthToken,
                        })
                    )
                }

                ws.onmessage = (event: MessageEvent) => {
                    try {
                        const data = JSON.parse(event.data as string)

                        if (data.type === "connected") {
                            connection.state = "connected"
                            logger.info("YouTube relay connection established", {
                                roomId: connection.roomId,
                            })
                            resolve()
                            return
                        }

                        if (
                            data.type === "status" &&
                            data.platform === "youtube"
                        ) {
                            connection.state = data.connected
                                ? "connected"
                                : "disconnected"
                            if (!data.connected) {
                                this.notifyError(
                                    new Error(
                                        data.reason || "YouTube relay disconnected"
                                    )
                                )
                            }
                            return
                        }

                        if (data.event === "youtube:message") {
                            const message = this.toChatMessage(connection.roomId, data)
                            this.notifyMessageHandlers(connection.roomId, message)
                            return
                        }

                        if (
                            data.type === "error" &&
                            data.platform === "youtube"
                        ) {
                            this.notifyError(new Error(data.error))
                            return
                        }

                        if (data.type === "reconnecting") {
                            logger.info("YouTube relay reconnecting", {
                                attempt: data.attempt,
                                delay: data.delay,
                            })
                            return
                        }
                    } catch {
                        // ignore unparseable messages
                    }
                }

                ws.onerror = () => {
                    clearTimeout(timeout)
                    connection.state = "disconnected"
                    const err = new Error(
                        "YouTube relay WebSocket connection failed"
                    )
                    this.notifyError(err)
                    reject(err)
                }

                ws.onclose = () => {
                    connection.state = "disconnected"
                    connection.ws = null
                    this.connections.delete(connection.roomId)
                    logger.info("YouTube relay WebSocket closed", {
                        roomId: connection.roomId,
                    })
                    this.scheduleReconnect(connection)
                }
            } catch (error) {
                clearTimeout(timeout)
                connection.state = "disconnected"
                this.connections.delete(connection.roomId)
                const err =
                    error instanceof Error
                        ? error
                        : new Error(String(error))
                this.notifyError(err)
                reject(err)
            }
        })
    }

    private reconnectAttempts = new Map<string, number>()

    private scheduleReconnect(connection: YouTubeRelayConnection): void {
        const attempts = this.reconnectAttempts.get(connection.roomId) || 0
        const delay = Math.min(
            RECONNECT_DELAY_MS * Math.pow(2, attempts),
            MAX_RECONNECT_DELAY_MS
        )
        this.reconnectAttempts.set(connection.roomId, attempts + 1)

        logger.info("Scheduling YouTube relay reconnect", {
            roomId: connection.roomId,
            attempt: attempts + 1,
            delay,
        })

        setTimeout(() => {
            if (this.connections.has(connection.roomId)) {
                this.connectToRelay(connection).catch((err) => {
                    logger.error("YouTube relay reconnect failed", {
                        error: String(err),
                    })
                })
            }
        }, delay)
    }

    async disconnect(roomId: string): Promise<void> {
        this.reconnectAttempts.delete(roomId)
        const connection = this.connections.get(roomId)
        if (!connection) return

        connection.state = "disconnected"
        if (connection.ws) {
            try {
                connection.ws.send(
                    JSON.stringify({
                        type: "disconnect",
                        platform: "youtube",
                    })
                )
                connection.ws.close()
            } catch {}
        }
        this.connections.delete(roomId)
        this.messageHandlers.delete(roomId)
        logger.info("Disconnected from YouTube relay", { roomId })
    }

    async sendMessage(
        roomId: string,
        message: string,
        _options?: SendMessageOptions
    ): Promise<string> {
        const connection = this.connections.get(roomId)
        if (!connection || connection.state !== "connected") {
            throw new Error(`Not connected to YouTube relay: ${roomId}`)
        }

        if (message.length > this.config.maxMessageLength) {
            throw new Error(
                `Message exceeds YouTube max length of ${this.config.maxMessageLength}`
            )
        }

        const messageId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`

        const url = "https://www.googleapis.com/youtube/v3/liveChat/messages?part=snippet"

        const liveChatResponse = await fetch(
            "https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status&mine=true",
            {
                headers: {
                    Authorization: `Bearer ${connection.oauthToken}`,
                },
            }
        )

        if (!liveChatResponse.ok) {
            throw new Error(
                `Failed to find YouTube live broadcast: ${liveChatResponse.status}`
            )
        }

        const broadcastData = await liveChatResponse.json()
        const activeBroadcast = broadcastData.items?.find(
            (item: { status?: { lifeCycleStatus?: string } }) =>
                item.status?.lifeCycleStatus === "live"
        )
        const liveChatId = activeBroadcast?.snippet?.liveChatId

        if (!liveChatId) {
            throw new Error("No active YouTube live broadcast found for sending")
        }

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${connection.oauthToken}`,
            },
            body: JSON.stringify({
                snippet: {
                    liveChatId,
                    type: "textMessageEvent",
                    textMessageDetails: {
                        messageText: message,
                    },
                },
            }),
        })

        if (!response.ok) {
            const errorBody = await response.text()
            throw new Error(
                `Failed to send YouTube live chat message: ${response.status} ${errorBody}`
            )
        }

        logger.debug("Message sent to YouTube live chat", {
            roomId,
            messageId,
            length: message.length,
        })

        return messageId
    }

    async getRoom(roomId: string): Promise<ChatRoom | null> {
        const connection = this.connections.get(roomId)
        if (!connection) return null

        return {
            id: roomId,
            platform: "youtube",
            name: roomId,
            isLive: connection.state === "connected",
        }
    }

    async getHistory(
        _roomId: string,
        _limit?: number
    ): Promise<ChatMessage[]> {
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

    private toChatMessage(
        channelId: string,
        data: any
    ): ChatMessage {
        const user: ChatUser = {
            id: data.user?.id || "unknown",
            username: data.user?.username || "unknown",
            displayName: data.user?.displayName || "Unknown",
            platform: "youtube",
            badges: data.user?.badges || [],
            isBroadcaster: data.user?.isBroadcaster || false,
            isModerator: data.user?.isModerator || false,
            isSubscriber: data.user?.isSubscriber || false,
        }

        if (data.user?.isVerified) {
            user.badges = [
                ...user.badges,
                {
                    id: "verified",
                    label: "Verified",
                    imageUrl: "",
                },
            ]
        }

        return {
            id: data.id || `youtube-${Date.now()}`,
            channelId,
            platform: "youtube",
            user,
            content: data.content || "",
            type: data.msgType || data.type || "text",
            timestamp: data.timestamp || Date.now(),
            isAction: data.isAction || false,
        }
    }

    private notifyMessageHandlers(
        roomId: string,
        message: ChatMessage
    ): void {
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
