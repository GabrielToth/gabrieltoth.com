/**
 * Twitch Chat Adapter
 * IRC-based chat adapter for Twitch (irc.chat.twitch.tv)
 * Implements the ChatAdapter interface for multi-platform unified chat.
 *
 * Note: Uses Node.js TCP sockets (net module) — only works in Node.js runtime.
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

const logger = createLogger("TwitchChatAdapter")

interface TwitchMessageHandler {
    (message: ChatMessage): void
}

interface TwitchConnection {
    roomId: string
    socket: import("net").Socket
    connected: boolean
    username: string
}

export class TwitchChatAdapter implements ChatAdapter {
    readonly platform = "twitch" as const
    readonly config: ChatAdapterConfig = {
        platform: "twitch",
        enabled: true,
        maxMessageLength: 500,
        commands: [
            "/me",
            "/timeout",
            "/ban",
            "/unban",
            "/slow",
            "/subscribers",
        ],
    }

    private connections: Map<string, TwitchConnection> = new Map()
    private messageHandlers: Map<string, Set<TwitchMessageHandler>> = new Map()
    private errorHandlers: Set<(error: Error) => void> = new Set()
    private isConnecting = false

    /**
     * Connect to a Twitch chat room using IRC
     */
    async connect(roomId: string, token: string): Promise<void> {
        if (this.connections.has(roomId)) {
            logger.debug("Already connected to Twitch room", { roomId })
            return
        }

        this.isConnecting = true

        try {
            const net = await import("net")

            const socket = new net.Socket()
            const username = roomId.toLowerCase() // channel name

            const connection: TwitchConnection = {
                roomId,
                socket,
                connected: false,
                username,
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
                    // IRC authentication
                    socket.write(`PASS oauth:${token}\r\n`)
                    socket.write(`NICK ${username}\r\n`)
                    socket.write(`CAP REQ :twitch.tv/tags\r\n`)
                    socket.write(`CAP REQ :twitch.tv/commands\r\n`)
                })

                socket.on("data", (data: Buffer) => {
                    const lines = data.toString().split("\r\n").filter(Boolean)

                    for (const line of lines) {
                        this.handleIrcMessage(roomId, line, connection)

                        // Respond to IRC PING
                        if (line.startsWith("PING")) {
                            socket.write(`PONG ${line.substring(5)}\r\n`)
                        }

                        // Connected successfully
                        if (
                            !connection.connected &&
                            line.includes(":Welcome, GLHF!")
                        ) {
                            connection.connected = true
                            clearTimeout(timeout)
                            // Join the channel
                            socket.write(`JOIN #${roomId}\r\n`)
                            logger.info("Connected to Twitch IRC", { roomId })
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
                    logger.info("Disconnected from Twitch IRC", { roomId })
                })
            })
        } catch (error) {
            this.isConnecting = false
            const err =
                error instanceof Error ? error : new Error(String(error))
            logger.error("Failed to connect to Twitch", {
                roomId,
                error: err.message,
            })
            throw err
        } finally {
            this.isConnecting = false
        }
    }

    /**
     * Wait for the JOIN to be acknowledged by the server (366 end-of-names)
     */
    async waitForJoin(roomId: string, timeoutMs: number = 5000): Promise<void> {
        const connection = this.connections.get(roomId)
        if (!connection || !connection.socket) return

        return new Promise(resolve => {
            const timer = setTimeout(() => {
                connection.socket.removeListener("data", onData)
                resolve()
            }, timeoutMs)

            const onData = (data: Buffer) => {
                const lines = data.toString().split("\r\n").filter(Boolean)
                for (const line of lines) {
                    if (
                        line.includes(
                            `366 ${connection.username} #${roomId}`
                        ) ||
                        (line.includes(`366 `) && line.includes(`#${roomId}`))
                    ) {
                        clearTimeout(timer)
                        connection.socket.removeListener("data", onData)
                        resolve()
                        return
                    }
                }
            }

            connection.socket.on("data", onData)
        })
    }

    /**
     * Disconnect from a Twitch chat room
     */
    async disconnect(roomId: string): Promise<void> {
        const connection = this.connections.get(roomId)
        if (!connection) {
            logger.debug("Not connected to Twitch room", { roomId })
            return
        }

        try {
            connection.socket.write(`PART #${roomId}\r\n`)
            connection.socket.end()
            connection.socket.destroy()
        } catch (error) {
            logger.warn("Error disconnecting from Twitch", {
                roomId,
                error: String(error),
            })
        }

        this.connections.delete(roomId)
        this.messageHandlers.delete(roomId)
        logger.info("Disconnected from Twitch room", { roomId })
    }

    /**
     * Send a message to a Twitch chat room
     */
    async sendMessage(
        roomId: string,
        message: string,
        options?: SendMessageOptions
    ): Promise<string> {
        const connection = this.connections.get(roomId)
        if (!connection || !connection.connected) {
            throw new Error(`Not connected to Twitch room: ${roomId}`)
        }

        if (message.length > this.config.maxMessageLength) {
            throw new Error(
                `Message exceeds Twitch max length of ${this.config.maxMessageLength}`
            )
        }

        const messageId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`

        let ircMessage: string
        if (message.startsWith("/")) {
            // Command (e.g., /timeout, /ban)
            ircMessage = `PRIVMSG #${roomId} :${message}\r\n`
        } else if (options?.isAction) {
            // /me action
            ircMessage = `PRIVMSG #${roomId} :\u0001ACTION ${message}\u0001\r\n`
        } else {
            ircMessage = `PRIVMSG #${roomId} :${message}\r\n`
        }

        connection.socket.write(ircMessage)

        logger.debug("Message sent to Twitch", {
            roomId,
            messageId,
            length: message.length,
        })

        return messageId
    }

    /**
     * Get room info (uses the stored connection state)
     */
    async getRoom(roomId: string): Promise<ChatRoom | null> {
        const connection = this.connections.get(roomId)
        if (!connection) return null

        return {
            id: roomId,
            platform: "twitch",
            name: connection.username,
            isLive: connection.connected,
        }
    }

    /**
     * Get message history (from stored messages)
     */
    async getHistory(_roomId: string, limit?: number): Promise<ChatMessage[]> {
        // In a real implementation, this would fetch from Twitch's chat history API
        // or local storage. For now, return empty.
        logger.debug("Twitch chat history requested (not yet implemented)", {
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
     * Handle an IRC message from Twitch
     */
    private handleIrcMessage(
        roomId: string,
        line: string,
        _connection: TwitchConnection
    ): void {
        try {
            // Parse IRC PRIVMSG
            const privmsgMatch = line.match(
                /@([^ ]+) :(\w+)!\w+@\w+\.tmi\.twitch\.tv PRIVMSG #(\w+) :(.+)/
            )
            if (privmsgMatch) {
                const [, tags, , channel, content] = privmsgMatch
                const parsedTags = this.parseIrcTags(tags)

                const message: ChatMessage = {
                    id: `twitch-${parsedTags["id"] || `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`}`,
                    channelId: channel,
                    platform: "twitch",
                    user: {
                        id: parsedTags["user-id"] || "unknown",
                        username:
                            parsedTags["display-name"]?.toLowerCase() ||
                            "unknown",
                        displayName: parsedTags["display-name"] || "Unknown",
                        platform: "twitch",
                        badges: this.parseBadges(parsedTags["badges"] || ""),
                        isBroadcaster:
                            parsedTags["badges"]?.includes("broadcaster") ||
                            false,
                        isModerator:
                            parsedTags["badges"]?.includes("moderator") ||
                            false,
                        isSubscriber:
                            parsedTags["badges"]?.includes("subscriber") ||
                            false,
                        isVip: parsedTags["badges"]?.includes("vip") || false,
                    },
                    content,
                    type: "text",
                    timestamp: Date.now(),
                    emotes: this.parseEmotes(parsedTags["emotes"], content),
                }

                this.notifyMessageHandlers(roomId, message)
                return
            }

            // Parse IRC USERNOTICE (subscriptions, raids, etc.)
            const usernoticeMatch = line.match(
                /@([^ ]+) :tmi\.twitch\.tv USERNOTICE #(\w+) :(.+)/
            )
            if (usernoticeMatch) {
                const [, tags, channel, content] = usernoticeMatch
                const parsedTags = this.parseIrcTags(tags)

                const message: ChatMessage = {
                    id: `twitch-sys-${Date.now()}`,
                    channelId: channel,
                    platform: "twitch",
                    user: {
                        id: "system",
                        username: "twitch",
                        displayName: "Twitch",
                        platform: "twitch",
                        badges: [],
                    },
                    content: content || parsedTags["system-msg"] || "",
                    type: "system",
                    timestamp: Date.now(),
                }

                this.notifyMessageHandlers(roomId, message)
                return
            }
        } catch (error) {
            logger.warn("Failed to parse Twitch IRC message", {
                line,
                error: String(error),
            })
        }
    }

    /**
     * Parse IRC tag string into key-value pairs
     */
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

    /**
     * Parse Twitch badges into ChatBadge format
     */
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

    /**
     * Parse Twitch emotes into ChatEmote format
     */
    private parseEmotes(
        emoteString: string | undefined,
        content: string
    ): Array<{
        id: string
        name: string
        imageUrl: string
        positions: { start: number; end: number }[]
    }> {
        if (!emoteString) return []

        return emoteString.split("/").map(emote => {
            const [id, positions] = emote.split(":")
            const ranges = (positions || "").split(",").map(range => {
                const [start, end] = range.split("-")
                const emoteName = content.substring(
                    parseInt(start),
                    parseInt(end) + 1
                )
                return {
                    start: parseInt(start),
                    end: parseInt(end),
                    ...(emoteName ? { name: emoteName } : {}),
                }
            })

            return {
                id,
                name: ranges[0]?.name || id,
                imageUrl: `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/1.0`,
                positions: ranges.map(r => ({
                    start: r.start,
                    end: r.end,
                })),
            }
        })
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
