import { EventEmitter } from "events"

const LIVE_BROADCASTS_URL =
    "https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status&mine=true"
const LIVE_CHAT_MESSAGES_URL =
    "https://www.googleapis.com/youtube/v3/liveChat/messages"
const MAX_RECONNECT_DELAY = 60000

export interface YouTubeChatUser {
    id: string
    username: string
    displayName: string
    platform: "youtube"
    badges: Array<{ id: string; label: string; imageUrl: string }>
    isBroadcaster: boolean
    isModerator: boolean
    isSubscriber: boolean
    isVerified: boolean
}

export interface YouTubeMessage {
    id: string
    channelId: string
    platform: "youtube"
    user: YouTubeChatUser
    content: string
    type: "text" | "system" | "announcement" | "subscription"
    timestamp: number
}

export interface YouTubeRelayEvents {
    connected: (liveChatId: string) => void
    disconnected: (reason: string) => void
    message: (msg: YouTubeMessage) => void
    reconnecting: (attempt: number, delay: number) => void
    error: (error: Error) => void
}

export class YouTubeRelay extends EventEmitter {
    private token: string
    private liveChatId: string | null = null
    private nextPageToken: string | null = null
    private pollTimer: ReturnType<typeof setTimeout> | null = null
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null
    private started = false
    private destroyed = false
    private seenIds = new Set<string>()

    constructor(token: string) {
        super()
        this.token = token
    }

    async start(liveChatId?: string): Promise<string | null> {
        if (this.started) return this.liveChatId
        this.destroyed = false
        this.started = true

        try {
            if (!liveChatId) {
                this.liveChatId = await this.findLiveChatId()
                if (!this.liveChatId) {
                    throw new Error("No active YouTube live broadcast found")
                }
            } else {
                this.liveChatId = liveChatId
            }

            this.emit("connected", this.liveChatId)
            this.schedulePoll()
            return this.liveChatId
        } catch (error) {
            this.started = false
            throw error
        }
    }

    stop(): void {
        this.destroyed = true
        this.started = false
        if (this.pollTimer) {
            clearTimeout(this.pollTimer)
            this.pollTimer = null
        }
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }
        this.removeAllListeners()
    }

    private async findLiveChatId(): Promise<string | null> {
        const response = await fetch(LIVE_BROADCASTS_URL, {
            headers: { Authorization: `Bearer ${this.token}` },
        })

        if (!response.ok) {
            const body = await response.text()
            throw new Error(`YouTube API error (${response.status}): ${body}`)
        }

        const data = await response.json()
        if (!data.items || data.items.length === 0) return null

        for (const item of data.items) {
            const chatId = item.snippet?.liveChatId
            if (chatId) return chatId
        }

        return data.items[0]?.snippet?.liveChatId || null
    }

    private async pollMessages(): Promise<void> {
        if (this.destroyed || !this.liveChatId) return

        try {
            const params = new URLSearchParams({
                liveChatId: this.liveChatId,
                part: "snippet,authorDetails",
                maxResults: "200",
            })
            if (this.nextPageToken) {
                params.set("pageToken", this.nextPageToken)
            }

            const response = await fetch(
                `${LIVE_CHAT_MESSAGES_URL}?${params}`,
                {
                    headers: { Authorization: `Bearer ${this.token}` },
                }
            )

            if (!response.ok) {
                if (response.status === 403 || response.status === 404) {
                    this.emit(
                        "disconnected",
                        `YouTube API error: ${response.status}`
                    )
                    return
                }
                throw new Error(`YouTube API poll error (${response.status})`)
            }

            const data = await response.json()

            this.nextPageToken = data.nextPageToken || null

            const items = data.items || []
            for (const item of items) {
                if (this.seenIds.has(item.id)) continue
                this.seenIds.add(item.id)

                const chatMessage = this.toChatMessage(item)
                if (chatMessage) {
                    this.emit("message", chatMessage)
                }
            }

            const interval = data.pollingIntervalMillis || 5000
            this.schedulePoll(interval)
        } catch (error: any) {
            this.scheduleReconnect(error.message)
        }
    }

    private schedulePoll(intervalMs = 5000): void {
        if (this.destroyed) return
        this.pollTimer = setTimeout(() => this.pollMessages(), intervalMs)
    }

    private scheduleReconnect(reason: string): void {
        if (this.destroyed) return
        this.emit("disconnected", reason)
        this.emit("reconnecting", 1, MAX_RECONNECT_DELAY)
        this.reconnectTimer = setTimeout(async () => {
            if (this.destroyed) return
            try {
                await this.start(this.liveChatId || undefined)
            } catch (err: any) {
                this.reconnectAttempt++
                this.emit(
                    "reconnecting",
                    this.reconnectAttempt,
                    MAX_RECONNECT_DELAY
                )
                this.reconnectTimer = setTimeout(
                    () => this.scheduleReconnect(err.message),
                    MAX_RECONNECT_DELAY
                )
            }
        }, MAX_RECONNECT_DELAY)
    }

    private reconnectAttempt = 0

    private toChatMessage(raw: any): YouTubeMessage | null {
        const snippet = raw.snippet || {}
        const author = raw.authorDetails || {}

        const badges: Array<{ id: string; label: string; imageUrl: string }> =
            []

        if (author.isChatOwner)
            badges.push({ id: "owner", label: "Owner", imageUrl: "" })
        if (author.isChatModerator)
            badges.push({ id: "moderator", label: "Moderator", imageUrl: "" })
        if (author.isChatSponsor)
            badges.push({ id: "member", label: "Member", imageUrl: "" })
        if (author.isVerified)
            badges.push({ id: "verified", label: "Verified", imageUrl: "" })

        let content = snippet.textMessageDetails?.messageText || ""
        if (!content && snippet.displayMessage) content = snippet.displayMessage

        const rawType = snippet.type || "textMessageEvent"
        let messageType: "text" | "system" | "announcement" | "subscription" =
            "text"

        switch (rawType) {
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
                messageType = "announcement"
                break
            case "superStickerEvent":
                messageType = "announcement"
                break
        }

        return {
            id: `youtube-${raw.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`}`,
            channelId: this.liveChatId || "",
            platform: "youtube",
            user: {
                id: author.channelId || "unknown",
                username: author.displayName?.toLowerCase() || "unknown",
                displayName: author.displayName || "Unknown",
                platform: "youtube",
                badges,
                isBroadcaster: author.isChatOwner || false,
                isModerator: author.isChatModerator || false,
                isSubscriber: author.isChatSponsor || false,
                isVerified: author.isVerified || false,
            },
            content,
            type: messageType,
            timestamp: snippet.publishedAt
                ? new Date(snippet.publishedAt).getTime()
                : Date.now(),
        }
    }
}
