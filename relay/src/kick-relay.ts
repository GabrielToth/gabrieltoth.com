import { EventEmitter } from "events"

const PUSHER_APP_KEY = "32cbd69e4b950bf97679"
const PUSHER_CLUSTER = "us2"
const PUSHER_URL = `wss://ws-${PUSHER_CLUSTER}.pusher.com/app/${PUSHER_APP_KEY}?protocol=7&client=js&version=8.4.0-rc2&flash=false`

export interface KickChatMessage {
    id: string
    channelId: string
    platform: "kick"
    user: {
        id: string
        username: string
        displayName: string
        platform: "kick"
        badges: Array<{ id: string; label: string; imageUrl: string }>
        isBroadcaster: boolean
        isModerator: boolean
        isSubscriber: boolean
        isVip: boolean
    }
    content: string
    type: "text" | "system"
    timestamp: number
    isAction?: boolean
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

interface KickMessageHandler {
    (message: KickChatMessage): void
}

interface KickErrorHandler {
    (error: Error): void
}

export class KickPusherRelay extends EventEmitter {
    readonly platform = "kick" as const
    private connections: Map<string, KickConnection> = new Map()
    private messageHandlers: Map<string, Set<KickMessageHandler>> = new Map()
    private errorHandlers: Set<KickErrorHandler> = new Set()
    private reconnectTimers: Map<string, ReturnType<typeof setTimeout>> = new Map()
    private reconnectAttempts: Map<string, number> = new Map()
    private readonly MAX_RECONNECT_ATTEMPTS = 5
    private readonly RECONNECT_DELAY_MS = 3000

    async getChatroomId(
        channelName: string,
        oauthToken?: string
    ): Promise<{ chatroomId: number; broadcasterUserId: string } | null> {
        try {
            const slug = channelName.toLowerCase()
            const headers: Record<string, string> = {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0",
                Accept: "application/json",
                Referer: "https://kick.com/",
            }
            if (oauthToken) {
                headers["Authorization"] = `Bearer ${oauthToken}`
            }
            const response = await fetch(
                `https://kick.com/api/v2/channels/${slug}`,
                { headers }
            )
            if (response.ok) {
                const text = await response.text()
                let data: any
                try { data = JSON.parse(text) } catch { return null }
                const chatroomId = data.chatroom?.id || null
                const broadcasterUserId = String(data.user?.id || data.id || "")
                if (chatroomId) {
                    return { chatroomId, broadcasterUserId }
                }
                console.error(`[KickRelay] getChatroomId: no chatroomId in response for ${slug}`, JSON.stringify(data).slice(0, 500))
            } else {
                const text = await response.text()
                console.error(`[KickRelay] getChatroomId: HTTP ${response.status} for ${slug}: ${text.slice(0, 200)}`)
            }
        } catch (err: any) {
            console.error(`[KickRelay] getChatroomId error for ${channelName}:`, err.message)
        }
        return null
    }

    async connect(roomId: string, token: string): Promise<void> {
        if (this.connections.has(roomId)) {
            const existing = this.connections.get(roomId)
            if (existing?.connected) return
        }

        const channelInfo = await this.getChatroomId(roomId, token)

        try {
            const chatroomId = channelInfo?.chatroomId || null
            const broadcasterUserId = channelInfo?.broadcasterUserId || ""

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

                        if (pusherEvent.event === "pusher:connection_established") {
                            connection.connected = true
                            this.emit("connected", roomId, chatroomId)
                            if (chatroomId) {
                                this.subscribeToChatroom(ws, chatroomId)
                                connection.pingInterval = setInterval(() => {
                                    ws.send(
                                        JSON.stringify({
                                            event: "pusher:ping",
                                            data: {},
                                        })
                                    )
                                }, 60000)
                            }
                            resolve()
                            return
                        }

                        if (pusherEvent.event === "pusher:ping") {
                            ws.send(
                                JSON.stringify({
                                    event: "pusher:pong",
                                    data: {},
                                })
                            )
                            return
                        }

                        if (pusherEvent.event === "pusher:error") {
                            return
                        }

                        if (
                            pusherEvent.event.startsWith("App\\Events\\") ||
                            pusherEvent.event === "ChatMessageEvent"
                        ) {
                            this.handlePusherData(roomId, pusherEvent)
                        }
                    } catch {
                        // non-JSON messages are ignored
                    }
                }

                ws.onerror = () => {
                    clearTimeout(timeout)
                    this.notifyError(new Error("Kick Pusher connection failed"))
                    reject(new Error("Kick Pusher connection failed"))
                }

                ws.onclose = () => {
                    connection.connected = false
                    if (connection.pingInterval) {
                        clearInterval(connection.pingInterval)
                    }
                    this.connections.delete(roomId)
                    this.emit("disconnected", roomId, "connection closed")
                    this.scheduleReconnect(roomId, token)
                }
            })
        } catch (error) {
            throw error
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
            const message: KickChatMessage = {
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
        } catch {
            // ignore parse errors
        }
    }

    disconnect(roomId: string): void {
        const reconnectTimer = this.reconnectTimers.get(roomId)
        if (reconnectTimer) {
            clearTimeout(reconnectTimer)
            this.reconnectTimers.delete(roomId)
        }
        this.reconnectAttempts.delete(roomId)

        const connection = this.connections.get(roomId)
        if (!connection) return

        if (connection.pingInterval) {
            clearInterval(connection.pingInterval)
        }

        try {
            connection.ws.close()
        } catch {}

        this.connections.delete(roomId)
        this.messageHandlers.delete(roomId)
        this.emit("disconnected", roomId, "manual disconnect")
    }

    onMessage(roomId: string, handler: KickMessageHandler): () => void {
        if (!this.messageHandlers.has(roomId)) {
            this.messageHandlers.set(roomId, new Set())
        }
        this.messageHandlers.get(roomId)!.add(handler)
        return () => {
            this.messageHandlers.get(roomId)?.delete(handler)
        }
    }

    onError(handler: KickErrorHandler): () => void {
        this.errorHandlers.add(handler)
        return () => {
            this.errorHandlers.delete(handler)
        }
    }

    private notifyMessageHandlers(roomId: string, message: KickChatMessage): void {
        const handlers = this.messageHandlers.get(roomId)
        if (handlers) {
            for (const handler of handlers) {
                try {
                    handler(message)
                } catch {}
            }
        }
    }

    private notifyError(error: Error): void {
        for (const handler of this.errorHandlers) {
            try {
                handler(error)
            } catch {}
        }
    }

    private scheduleReconnect(roomId: string, token: string): void {
        const attempts = this.reconnectAttempts.get(roomId) || 0
        if (attempts >= this.MAX_RECONNECT_ATTEMPTS) {
            this.reconnectAttempts.delete(roomId)
            return
        }
        this.reconnectAttempts.set(roomId, attempts + 1)
        const delay = this.RECONNECT_DELAY_MS * Math.pow(2, attempts)
        const timer = setTimeout(() => {
            this.reconnectTimers.delete(roomId)
            this.connect(roomId, token).catch(() => {})
        }, delay)
        this.reconnectTimers.set(roomId, timer)
    }
}