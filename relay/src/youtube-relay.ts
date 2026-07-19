import * as grpc from "@grpc/grpc-js"
import * as protoLoader from "@grpc/proto-loader"
import path from "path"
import { fileURLToPath } from "url"
import { EventEmitter } from "events"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROTO_PATH = path.join(__dirname, "stream-list.proto")

const YOUTUBE_API_ENDPOINT = "youtube.googleapis.com:443"
const LIVE_BROADCASTS_URL =
    "https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status&mine=true"

const RECONNECT_DELAY_MS = 5_000
const MAX_RECONNECT_DELAY_MS = 60_000
const INITIAL_PAGE_SIZE = 200

export interface YouTubeMessage {
    id: string
    channelId: string
    platform: "youtube"
    user: {
        id: string
        username: string
        displayName: string
        platform: "youtube"
        badges: Array<{ id: string; label: string; imageUrl: string }>
        isBroadcaster: boolean
        isModerator: boolean
        isSubscriber: boolean
        isVerified?: boolean
    }
    content: string
    type: "text" | "system" | "announcement" | "subscription"
    timestamp: number
}

export interface YouTubeRelayEvents {
    connected: (liveChatId: string) => void
    disconnected: (reason: string) => void
    message: (msg: YouTubeMessage) => void
    error: (error: Error) => void
    reconnecting: (attempt: number, delay: number) => void
}

export class YouTubeStreamListRelay extends EventEmitter {
    private token: string
    private liveChatId: string | null = null
    private client: any = null
    private call: any = null
    private reconnectAttempt = 0
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null
    private lastPageToken: string | null = null
    private started = false
    private destroyed = false
    private seenMessageIds = new Set<string>()

    constructor(token: string) {
        super()
        this.token = token
    }

    on<K extends keyof YouTubeRelayEvents>(
        event: K,
        listener: YouTubeRelayEvents[K]
    ): this {
        return super.on(event, listener)
    }

    emit<K extends keyof YouTubeRelayEvents>(
        event: K,
        ...args: Parameters<YouTubeRelayEvents[K]>
    ): boolean {
        return super.emit(event, ...args)
    }

    async start(): Promise<string | null> {
        if (this.started) return this.liveChatId
        this.destroyed = false
        this.started = true

        try {
            this.liveChatId = await this.findLiveChatId()
            if (!this.liveChatId) {
                throw new Error("No active YouTube live broadcast found")
            }

            await this.connectStream(this.liveChatId)
            return this.liveChatId
        } catch (error) {
            this.started = false
            throw error
        }
    }

    stop(): void {
        this.destroyed = true
        this.started = false
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }
        this.cancelStream()
        this.removeAllListeners()
    }

    getLiveChatId(): string | null {
        return this.liveChatId
    }

    isConnected(): boolean {
        return this.call !== null && !this.destroyed
    }

    private async findLiveChatId(): Promise<string | null> {
        const response = await fetch(LIVE_BROADCASTS_URL, {
            headers: { Authorization: `Bearer ${this.token}` },
        })

        if (!response.ok) {
            const body = await response.text()
            throw new Error(
                `YouTube API error (${response.status}): ${body}`
            )
        }

        const data = await response.json()
        if (!data.items || data.items.length === 0) return null

        const active = data.items.find(
            (item: any) => item.status?.lifeCycleStatus === "live"
        )

        return active?.snippet?.liveChatId || null
    }

    private async connectStream(liveChatId: string): Promise<void> {
        const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
            keepCase: false,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
            includeDirs: [path.dirname(PROTO_PATH)],
        })

        const proto = grpc.loadPackageDefinition(
            packageDefinition
        ) as any

        const channelCredentials = grpc.ChannelCredentials.createSsl()

        this.client =
            new proto.youtube.api.v3.V3DataLiveChatMessageService(
                YOUTUBE_API_ENDPOINT,
                channelCredentials
            )

        const metadata = new grpc.Metadata()
        metadata.add("authorization", `Bearer ${this.token}`)
        metadata.add("x-goog-api-client", "grpc-node/1.0")

        const request = {
            live_chat_id: liveChatId,
            part: ["snippet", "authorDetails"],
            max_results: INITIAL_PAGE_SIZE,
            ...(this.lastPageToken
                ? { page_token: this.lastPageToken }
                : {}),
        }

        this.call = this.client.StreamList(request, metadata)

        this.call.on("data", (response: any) => {
            if (response.next_page_token) {
                this.lastPageToken = response.next_page_token
            }

            if (response.offline_at) {
                this.emit(
                    "disconnected",
                    "Stream went offline at " + response.offline_at
                )
                return
            }

            const items = response.items || []
            for (const item of items) {
                if (this.seenMessageIds.has(item.id)) continue
                this.seenMessageIds.add(item.id)
                const chatMessage = this.toChatMessage(liveChatId, item)
                this.emit("message", chatMessage)
            }
        })

        this.call.on("end", () => {
            this.call = null
            this.emit("disconnected", "gRPC stream ended")
            if (!this.destroyed) this.scheduleReconnect(liveChatId)
        })

        this.call.on("error", (error: grpc.ServiceError) => {
            this.call = null
            const errMsg = error.details || error.message || "Unknown gRPC error"
            const isTerminal =
                error.code === grpc.status.PERMISSION_DENIED ||
                error.code === grpc.status.NOT_FOUND ||
                error.code === grpc.status.UNIMPLEMENTED

            if (isTerminal) {
                this.emit("error", new Error(errMsg))
                this.emit("disconnected", "Terminal error: " + errMsg)
                return
            }

            this.emit("disconnected", errMsg)
            if (!this.destroyed) this.scheduleReconnect(liveChatId)
        })

        this.call.on("status", (status: grpc.StatusObject) => {
            if (status.code === grpc.status.OK) return
        })

        this.emit("connected", liveChatId)
    }

    private scheduleReconnect(liveChatId: string): void {
        if (this.destroyed) return

        const delay = Math.min(
            RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempt),
            MAX_RECONNECT_DELAY_MS
        )
        this.reconnectAttempt++

        this.emit("reconnecting", this.reconnectAttempt, delay)

        this.reconnectTimer = setTimeout(async () => {
            if (this.destroyed) return
            try {
                this.liveChatId = await this.findLiveChatId()
                if (this.liveChatId) {
                    await this.connectStream(this.liveChatId)
                    this.reconnectAttempt = 0
                }
            } catch (error) {
                this.emit(
                    "error",
                    error instanceof Error
                        ? error
                        : new Error(String(error))
                )
                if (!this.destroyed) this.scheduleReconnect(liveChatId)
            }
        }, delay)
    }

    private cancelStream(): void {
        if (this.call) {
            try {
                this.call.cancel()
            } catch {}
            this.call = null
        }
        if (this.client) {
            try {
                this.client.close()
            } catch {}
            this.client = null
        }
    }

    private toChatMessage(
        channelId: string,
        raw: any
    ): YouTubeMessage {
        const snippet = raw.snippet || {}
        const author = raw.author_details || {}

        const badges: Array<{
            id: string
            label: string
            imageUrl: string
        }> = []

        if (author.is_chat_owner)
            badges.push({
                id: "owner",
                label: "Owner",
                imageUrl: "",
            })
        if (author.is_chat_moderator)
            badges.push({
                id: "moderator",
                label: "Moderator",
                imageUrl: "",
            })
        if (author.is_chat_sponsor)
            badges.push({
                id: "member",
                label: "Member",
                imageUrl: "",
            })
        if (author.is_verified)
            badges.push({
                id: "verified",
                label: "Verified",
                imageUrl: "",
            })

        let content = snippet.text_message_details?.message_text || ""
        if (!content && snippet.display_message) {
            content = snippet.display_message
        }

        const msgType = snippet.type || "textMessageEvent"
        let messageType: "text" | "system" | "announcement" | "subscription" =
            "text"

        switch (msgType) {
            case "chatEndedEvent":
                messageType = "system"
                break
            case "newSponsorEvent":
                messageType = "subscription"
                break
            case "memberMilestoneChatEvent":
                messageType = "subscription"
                break
            case "superChatEvent":
            case "superStickerEvent":
                messageType = "announcement"
                break
            default:
                messageType = "text"
        }

        return {
            id: `youtube-${raw.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`}`,
            channelId,
            platform: "youtube",
            user: {
                id: author.channel_id || "unknown",
                username:
                    author.display_name?.toLowerCase() || "unknown",
                displayName: author.display_name || "Unknown",
                platform: "youtube",
                badges,
                isBroadcaster: author.is_chat_owner || false,
                isModerator: author.is_chat_moderator || false,
                isSubscriber: author.is_chat_sponsor || false,
                isVerified: author.is_verified || false,
            },
            content,
            type: messageType,
            timestamp: snippet.published_at
                ? new Date(snippet.published_at).getTime()
                : Date.now(),
        }
    }
}
