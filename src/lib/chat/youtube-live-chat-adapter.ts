/**
 * YouTube Live Chat Adapter
 * HTTP polling-based chat adapter for YouTube Live using YouTube Data API v3.
 * Implements the ChatAdapter interface for multi-platform unified chat.
 *
 * Note: Uses HTTP polling via fetch() — works in any runtime (Node.js, browser, edge).
 * Requires OAuth scope: youtube.readonly and/or youtube.
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

const logger = createLogger("YouTubeLiveChatAdapter")

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"

interface YouTubeMessageHandler {
    (message: ChatMessage): void
}

interface YouTubePollingState {
    roomId: string
    liveChatId: string
    token: string
    pollingIntervalMs: number
    nextPageToken?: string
    intervalId: ReturnType<typeof setInterval> | null
    seenMessageIds: Set<string>
    connected: boolean
}

interface YouTubeLiveBroadcast {
    id: string
    snippet: {
        liveChatId: string
        title: string
        actualStartTime?: string
    }
    status: {
        lifeCycleStatus: string
        privacyStatus: string
    }
}

interface YouTubeLiveChatMessage {
    id: string
    snippet: {
        type: string
        publishedAt: string
        displayMessage: string
        textMessageDetails?: {
            messageText: string
        }
        authorChannelId: string
    }
    authorDetails: {
        channelId: string
        displayName: string
        profileImageUrl: string
        isChatModerator: boolean
        isChatOwner: boolean
        isChatSponsor: boolean
        isVerified: boolean
    }
}

export class YouTubeLiveChatAdapter implements ChatAdapter {
    readonly platform = "youtube" as const
    readonly config: ChatAdapterConfig = {
        platform: "youtube",
        enabled: true,
        maxMessageLength: 200,
        commands: [],
    }

    private pollingStates: Map<string, YouTubePollingState> = new Map()
    private messageHandlers: Map<string, Set<YouTubeMessageHandler>> = new Map()
    private errorHandlers: Set<(error: Error) => void> = new Set()
    private readonly DEFAULT_POLLING_INTERVAL_MS = 5000

    /**
     * Connect to a YouTube Live chat room
     */
    async connect(roomId: string, token: string): Promise<void> {
        if (this.pollingStates.has(roomId)) {
            logger.debug("Already connected to YouTube live chat", { roomId })
            return
        }

        try {
            // Step 1: Find the active live broadcast to get the liveChatId
            const liveChatId = await this.findLiveChatId(token)

            if (!liveChatId) {
                throw new Error(
                    "No active YouTube live broadcast found for this channel"
                )
            }

            // Step 2: Start polling
            const state: YouTubePollingState = {
                roomId,
                liveChatId,
                token,
                pollingIntervalMs: this.DEFAULT_POLLING_INTERVAL_MS,
                intervalId: null,
                seenMessageIds: new Set(),
                connected: true,
            }

            this.pollingStates.set(roomId, state)

            // Start the polling cycle
            await this.startPolling(state)

            logger.info("Connected to YouTube live chat", {
                roomId,
                liveChatId,
            })
        } catch (error) {
            const err =
                error instanceof Error ? error : new Error(String(error))
            logger.error("Failed to connect to YouTube live chat", {
                roomId,
                error: err.message,
            })
            this.notifyError(err)
            throw err
        }
    }

    /**
     * Disconnect from a YouTube live chat room
     */
    async disconnect(roomId: string): Promise<void> {
        const state = this.pollingStates.get(roomId)
        if (!state) {
            logger.debug("Not connected to YouTube live chat", { roomId })
            return
        }

        this.stopPolling(state)
        this.pollingStates.delete(roomId)
        this.messageHandlers.delete(roomId)
        logger.info("Disconnected from YouTube live chat", { roomId })
    }

    /**
     * Send a message to YouTube live chat
     */
    async sendMessage(
        roomId: string,
        message: string,
        _options?: SendMessageOptions
    ): Promise<string> {
        const state = this.pollingStates.get(roomId)
        if (!state || !state.connected) {
            throw new Error(`Not connected to YouTube live chat: ${roomId}`)
        }

        if (message.length > this.config.maxMessageLength) {
            throw new Error(
                `Message exceeds YouTube max length of ${this.config.maxMessageLength}`
            )
        }

        const messageId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`

        const url = `${YOUTUBE_API_BASE}/liveChat/messages?part=snippet`

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${state.token}`,
            },
            body: JSON.stringify({
                snippet: {
                    liveChatId: state.liveChatId,
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

    /**
     * Get room info
     */
    async getRoom(roomId: string): Promise<ChatRoom | null> {
        const state = this.pollingStates.get(roomId)
        if (!state) return null

        return {
            id: roomId,
            platform: "youtube",
            name: roomId,
            isLive: state.connected,
        }
    }

    /**
     * Get message history
     */
    async getHistory(roomId: string, limit?: number): Promise<ChatMessage[]> {
        const state = this.pollingStates.get(roomId)
        if (!state) {
            logger.debug("Not connected to YouTube live chat", { roomId })
            return []
        }

        try {
            const messages = await this.fetchLiveChatMessages(
                state.liveChatId,
                state.token,
                undefined,
                limit
            )
            return messages.map(msg =>
                this.toChatMessage(state.liveChatId, msg)
            )
        } catch (error) {
            logger.warn("Failed to fetch YouTube live chat history", {
                roomId,
                error: String(error),
            })
            return []
        }
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
     * Find the active live broadcast's liveChatId
     */
    private async findLiveChatId(token: string): Promise<string | null> {
        const url = `${YOUTUBE_API_BASE}/liveBroadcasts?part=snippet,status&mine=true`

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })

        if (!response.ok) {
            const errorBody = await response.text()
            throw new Error(
                `Failed to fetch YouTube live broadcasts: ${response.status} ${errorBody}`
            )
        }

        const data = await response.json()

        if (!data.items || data.items.length === 0) {
            return null
        }

        // Find the first active live broadcast
        const activeBroadcast = data.items.find(
            (item: YouTubeLiveBroadcast) =>
                item.status?.lifeCycleStatus === "live"
        )

        if (!activeBroadcast || !activeBroadcast.snippet?.liveChatId) {
            return null
        }

        // Use the pollingIntervalMillis from API if available
        if (data.pollingIntervalMillis) {
            const state = this.pollingStates.get(
                Array.from(this.pollingStates.keys()).pop() || ""
            )
            if (state) {
                state.pollingIntervalMs = Math.max(
                    data.pollingIntervalMillis,
                    2000
                )
            }
        }

        return activeBroadcast.snippet.liveChatId
    }

    /**
     * Fetch live chat messages from the YouTube API
     */
    private async fetchLiveChatMessages(
        liveChatId: string,
        token: string,
        pageToken?: string,
        maxResults?: number
    ): Promise<YouTubeLiveChatMessage[]> {
        const params = new URLSearchParams({
            liveChatId,
            part: "snippet,authorDetails",
        })

        if (pageToken) {
            params.set("pageToken", pageToken)
        }
        if (maxResults) {
            params.set("maxResults", String(Math.min(maxResults, 200)))
        }

        const url = `${YOUTUBE_API_BASE}/liveChat/messages?${params.toString()}`

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })

        if (!response.ok) {
            const errorBody = await response.text()
            throw new Error(
                `Failed to fetch YouTube live chat messages: ${response.status} ${errorBody}`
            )
        }

        const data = await response.json()

        // Update polling interval from API response
        if (data.pollingIntervalMillis) {
            this.updatePollingInterval(liveChatId, data.pollingIntervalMillis)
        }

        // Update nextPageToken
        if (data.nextPageToken) {
            this.updateNextPageToken(liveChatId, data.nextPageToken)
        }

        return data.items || []
    }

    /**
     * Start the polling cycle for a room
     */
    private async startPolling(state: YouTubePollingState): Promise<void> {
        // Do an initial fetch to get history — awaited so seenMessageIds is populated
        await this.pollCycle(state)

        // Start interval
        state.intervalId = setInterval(() => {
            this.pollCycle(state)
        }, state.pollingIntervalMs)
    }

    /**
     * Stop the polling cycle
     */
    private stopPolling(state: YouTubePollingState): void {
        state.connected = false
        if (state.intervalId !== null) {
            clearInterval(state.intervalId)
            state.intervalId = null
        }
    }

    /**
     * Execute a single poll cycle
     */
    private async pollCycle(state: YouTubePollingState): Promise<void> {
        try {
            const messages = await this.fetchLiveChatMessages(
                state.liveChatId,
                state.token,
                state.nextPageToken
            )

            for (const msg of messages) {
                if (state.seenMessageIds.has(msg.id)) continue
                state.seenMessageIds.add(msg.id)

                const chatMessage = this.toChatMessage(state.liveChatId, msg)
                this.notifyMessageHandlers(state.roomId, chatMessage)
            }
        } catch (error) {
            const err =
                error instanceof Error ? error : new Error(String(error))
            logger.warn("YouTube live chat poll cycle error", {
                roomId: state.roomId,
                error: err.message,
            })
            this.notifyError(err)
        }
    }

    /**
     * Convert a YouTube live chat message to our ChatMessage format
     */
    private toChatMessage(
        channelId: string,
        msg: YouTubeLiveChatMessage
    ): ChatMessage {
        const user: ChatUser = {
            id: msg.authorDetails?.channelId || "unknown",
            username:
                msg.authorDetails?.displayName?.toLowerCase() || "unknown",
            displayName: msg.authorDetails?.displayName || "Unknown",
            platform: "youtube",
            badges: [],
            isBroadcaster: msg.authorDetails?.isChatOwner || false,
            isModerator: msg.authorDetails?.isChatModerator || false,
            isSubscriber: msg.authorDetails?.isChatSponsor || false,
        }

        const content =
            msg.snippet?.textMessageDetails?.messageText ||
            msg.snippet?.displayMessage ||
            ""

        let messageType: "text" | "system" | "announcement" | "subscription" =
            "text"

        switch (msg.snippet?.type) {
            case "chatEndedEvent":
                messageType = "system"
                break
            case "newSponsorEvent":
                messageType = "subscription"
                break
            case "memberMilestoneEvent":
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
            id: `youtube-${msg.id}`,
            channelId,
            platform: "youtube",
            user,
            content,
            type: messageType,
            timestamp: msg.snippet?.publishedAt
                ? new Date(msg.snippet.publishedAt).getTime()
                : Date.now(),
        }
    }

    /**
     * Update the polling interval for a live chat
     */
    private updatePollingInterval(
        liveChatId: string,
        pollingIntervalMs: number
    ): void {
        const clampedInterval = Math.max(pollingIntervalMs, 2000)

        for (const state of this.pollingStates.values()) {
            if (state.liveChatId === liveChatId) {
                state.pollingIntervalMs = clampedInterval

                // Restart interval with new timing
                if (state.intervalId !== null) {
                    clearInterval(state.intervalId)
                    state.intervalId = setInterval(() => {
                        this.pollCycle(state)
                    }, clampedInterval)
                }
                break
            }
        }
    }

    /**
     * Update the next page token for a live chat
     */
    private updateNextPageToken(
        liveChatId: string,
        nextPageToken: string
    ): void {
        for (const state of this.pollingStates.values()) {
            if (state.liveChatId === liveChatId) {
                state.nextPageToken = nextPageToken
                break
            }
        }
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
