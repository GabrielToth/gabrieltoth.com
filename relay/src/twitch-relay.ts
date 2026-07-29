import { EventEmitter } from "events"
import net from "node:net"

export interface TwitchChatMessage {
    id: string
    channelId: string
    platform: "twitch"
    user: {
        id: string
        username: string
        displayName: string
        platform: "twitch"
        badges: Array<{
            id: string
            label: string
            imageUrl: string
        }>
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

interface TwitchConnection {
    roomId: string
    socket: net.Socket
    connected: boolean
    username: string
    oauthToken: string
}

interface TwitchMessageHandler {
    (message: TwitchChatMessage): void
}

export class TwitchIrcRelay extends EventEmitter {
    readonly platform = "twitch" as const
    private connections: Map<string, TwitchConnection> = new Map()
    private messageHandlers: Map<string, Set<TwitchMessageHandler>> = new Map()
    private errorHandlers: Set<(error: Error) => void> = new Set()
    private reconnectTimers: Map<string, ReturnType<typeof setTimeout>> = new Map()
    private reconnectAttempts: Map<string, number> = new Map()
    private readonly MAX_RECONNECT_ATTEMPTS = 5
    private readonly RECONNECT_DELAY_MS = 3000

    async connect(roomId: string, token: string): Promise<void> {
        if (this.connections.has(roomId)) {
            const existing = this.connections.get(roomId)
            if (existing?.connected) return
        }

        const socket = new net.Socket()
        const username = roomId.toLowerCase()

        const connection: TwitchConnection = {
            roomId,
            socket,
            connected: false,
            username,
            oauthToken: token,
        }

        this.connections.set(roomId, connection)

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                if (!connection.connected) {
                    socket.destroy()
                    this.connections.delete(roomId)
                    reject(new Error("Twitch IRC connection timeout"))
                }
            }, 10000)

            socket.connect(6667, "irc.chat.twitch.tv", () => {
                socket.write(`PASS oauth:${token}\r\n`)
                socket.write(`NICK ${username}\r\n`)
                socket.write(`CAP REQ :twitch.tv/tags\r\n`)
                socket.write(`CAP REQ :twitch.tv/commands\r\n`)
            })

            socket.on("data", (data: Buffer) => {
                const lines = data.toString().split("\r\n").filter(Boolean)
                for (const line of lines) {
                    this.handleIrcMessage(roomId, line, connection)
                    if (line.startsWith("PING")) {
                        socket.write(`PONG ${line.substring(5)}\r\n`)
                    }
                    if (!connection.connected && line.includes(":Welcome, GLHF!")) {
                        connection.connected = true
                        clearTimeout(timeout)
                        socket.write(`JOIN #${roomId}\r\n`)
                        this.emit("connected", roomId)
                        resolve()
                    }
                }
            })

            socket.on("error", (err: Error) => {
                clearTimeout(timeout)
                this.connections.delete(roomId)
                this.notifyError(err)
                reject(err)
            })

            socket.on("close", () => {
                connection.connected = false
                this.connections.delete(roomId)
                this.emit("disconnected", roomId, "connection closed")
                this.scheduleReconnect(roomId, token)
            })
        })
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

        try {
            connection.socket.write(`PART #${roomId}\r\n`)
            connection.socket.end()
            connection.socket.destroy()
        } catch {}

        this.connections.delete(roomId)
        this.messageHandlers.delete(roomId)
        this.emit("disconnected", roomId, "manual disconnect")
    }

    private handleIrcMessage(
        roomId: string,
        line: string,
        _connection: TwitchConnection
    ): void {
        try {
            const privmsgMatch = line.match(
                /@([^ ]+) :(\w+)!\w+@\w+\.tmi\.twitch\.tv PRIVMSG #(\w+) :(.+)/
            )
            if (privmsgMatch) {
                const [, tags, , channel, content] = privmsgMatch
                const parsedTags = this.parseIrcTags(tags)
                const isAction = content.startsWith("\u0001ACTION ") && content.endsWith("\u0001")
                const message: TwitchChatMessage = {
                    id: `twitch-${parsedTags["id"] || `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`}`,
                    channelId: channel,
                    platform: "twitch",
                    user: {
                        id: parsedTags["user-id"] || "unknown",
                        username: parsedTags["display-name"]?.toLowerCase() || "unknown",
                        displayName: parsedTags["display-name"] || "Unknown",
                        platform: "twitch",
                        badges: this.parseBadges(parsedTags["badges"] || ""),
                        isBroadcaster: parsedTags["badges"]?.includes("broadcaster") || false,
                        isModerator: parsedTags["badges"]?.includes("moderator") || false,
                        isSubscriber: parsedTags["badges"]?.includes("subscriber") || false,
                        isVip: parsedTags["badges"]?.includes("vip") || false,
                    },
                    content: isAction ? content.slice(8, -1) : content,
                    type: "text",
                    timestamp: Date.now(),
                    isAction,
                }
                this.notifyMessageHandlers(roomId, message)
                return
            }

            const usernoticeMatch = line.match(
                /@([^ ]+) :tmi\.twitch\.tv USERNOTICE #(\w+) :(.+)/
            )
            if (usernoticeMatch) {
                const [, tags, channel, content] = usernoticeMatch
                const parsedTags = this.parseIrcTags(tags)
                const message: TwitchChatMessage = {
                    id: `twitch-sys-${Date.now()}`,
                    channelId: channel,
                    platform: "twitch",
                    user: {
                        id: "system",
                        username: "twitch",
                        displayName: "Twitch",
                        platform: "twitch",
                        badges: [],
                        isBroadcaster: false,
                        isModerator: false,
                        isSubscriber: false,
                        isVip: false,
                    },
                    content: content || parsedTags["system-msg"] || "",
                    type: "system",
                    timestamp: Date.now(),
                }
                this.notifyMessageHandlers(roomId, message)
            }
        } catch (error) {
            // ignore parse errors
        }
    }

    private parseIrcTags(tagString: string): Record<string, string> {
        const tags: Record<string, string> = {}
        for (const tag of tagString.split(";")) {
            const [key, value] = tag.split("=")
            if (key) {
                tags[key] = value ? value.replace(/\\s/g, " ") : ""
            }
        }
        return tags
    }

    private parseBadges(badgeString: string): Array<{
        id: string
        label: string
        imageUrl: string
    }> {
        if (!badgeString) return []
        return badgeString.split(",").map(badge => {
            const [id, version] = badge.split("/")
            return {
                id: id || badge,
                label: id || badge,
                imageUrl: `https://static-cdn.jtvnw.net/badges/v1/${version || "1"}/1`,
            }
        })
    }

    onMessage(roomId: string, handler: TwitchMessageHandler): () => void {
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

    private notifyMessageHandlers(roomId: string, message: TwitchChatMessage): void {
        const handlers = this.messageHandlers.get(roomId)
        if (handlers) {
            for (const handler of handlers) {
                try {
                    handler(message)
                } catch (error) {
                    // ignore handler errors
                }
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