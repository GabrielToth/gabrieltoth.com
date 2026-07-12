/**
 * Instagram Live Chat Adapter
 * HTTP polling-based chat adapter for Instagram Live using Instagram Graph API.
 * Implements the ChatAdapter interface for multi-platform unified chat.
 *
 * Note: Uses HTTP polling via fetch() — works in any runtime.
 * Reuses existing instagram/comments.ts API functions.
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
import { getComments, replyToComment } from "../instagram/comments"

const logger = createLogger("InstagramLiveChatAdapter")

interface InstagramMessageHandler {
    (message: ChatMessage): void
}

interface InstagramPollingState {
    roomId: string
    mediaId: string
    igUserId: string
    token: string
    intervalId: ReturnType<typeof setInterval> | null
    seenCommentIds: Set<string>
    connected: boolean
}

const GRAPH_API_BASE = "https://graph.facebook.com"
const API_VERSION = "v25.0"

export class InstagramLiveChatAdapter implements ChatAdapter {
    readonly platform = "instagram" as const
    readonly config: ChatAdapterConfig = {
        platform: "instagram",
        enabled: true,
        maxMessageLength: 500,
        commands: [],
    }

    private pollingStates: Map<string, InstagramPollingState> = new Map()
    private messageHandlers: Map<string, Set<InstagramMessageHandler>> =
        new Map()
    private errorHandlers: Set<(error: Error) => void> = new Set()
    private readonly POLLING_INTERVAL_MS = 5000

    /**
     * Connect to an Instagram Live chat room
     */
    async connect(roomId: string, token: string): Promise<void> {
        if (this.pollingStates.has(roomId)) {
            logger.debug("Already connected to Instagram live chat", {
                roomId,
            })
            return
        }

        try {
            // roomId is the Instagram Business Account ID
            const igUserId = roomId

            // Find active LIVE media
            const mediaId = await this.findLiveMedia(token, igUserId)

            if (!mediaId) {
                throw new Error(
                    "No active Instagram Live media found for this account"
                )
            }

            const state: InstagramPollingState = {
                roomId,
                mediaId,
                igUserId,
                token,
                intervalId: null,
                seenCommentIds: new Set(),
                connected: true,
            }

            this.pollingStates.set(roomId, state)

            // Start polling
            await this.startPolling(state)

            logger.info("Connected to Instagram live chat", {
                roomId,
                mediaId,
            })
        } catch (error) {
            const err =
                error instanceof Error ? error : new Error(String(error))
            logger.error("Failed to connect to Instagram live chat", {
                roomId,
                error: err.message,
            })
            this.notifyError(err)
            throw err
        }
    }

    /**
     * Disconnect from an Instagram live chat room
     */
    async disconnect(roomId: string): Promise<void> {
        const state = this.pollingStates.get(roomId)
        if (!state) {
            logger.debug("Not connected to Instagram live chat", { roomId })
            return
        }

        this.stopPolling(state)
        this.pollingStates.delete(roomId)
        this.messageHandlers.delete(roomId)
        logger.info("Disconnected from Instagram live chat", { roomId })
    }

    /**
     * Send a message to Instagram live chat (replies to the live media)
     */
    async sendMessage(
        roomId: string,
        message: string,
        _options?: SendMessageOptions
    ): Promise<string> {
        const state = this.pollingStates.get(roomId)
        if (!state || !state.connected) {
            throw new Error(`Not connected to Instagram live chat: ${roomId}`)
        }

        if (message.length > this.config.maxMessageLength) {
            throw new Error(
                `Message exceeds Instagram max length of ${this.config.maxMessageLength}`
            )
        }

        // Reply to the live media (post a comment)
        const result = await replyToComment(
            state.token,
            state.igUserId,
            state.mediaId,
            message
        )

        const messageId =
            result.id ||
            `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`

        logger.debug("Message sent to Instagram live chat", {
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
            platform: "instagram",
            name: roomId,
            isLive: state.connected,
        }
    }

    /**
     * Get message history
     */
    async getHistory(roomId: string, _limit?: number): Promise<ChatMessage[]> {
        const state = this.pollingStates.get(roomId)
        if (!state) {
            logger.debug("Not connected to Instagram live chat", { roomId })
            return []
        }

        try {
            const comments = await getComments(
                state.token,
                state.igUserId,
                state.mediaId,
                { limit: _limit || 50 }
            )

            return comments.data.map(comment =>
                this.toChatMessage(state.mediaId, comment)
            )
        } catch (error) {
            logger.warn("Failed to fetch Instagram live chat history", {
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
     * Find active LIVE media for the Instagram account
     */
    private async findLiveMedia(
        token: string,
        igUserId: string
    ): Promise<string | null> {
        const params = new URLSearchParams({
            access_token: token,
            fields: "media_type,media_product_type,permalink",
        })

        const url = `${GRAPH_API_BASE}/${API_VERSION}/${igUserId}/media?${params.toString()}`

        const response = await fetch(url)

        if (!response.ok) {
            const error = await response.json()
            throw new Error(
                error.error?.message || "Failed to fetch Instagram media"
            )
        }

        const data = await response.json()

        if (!data.data || data.data.length === 0) {
            return null
        }

        // Find the first LIVE media item
        const liveMedia = data.data.find(
            (item: {
                media_type?: string
                media_product_type?: string
                id: string
            }) =>
                item.media_type === "LIVE" || item.media_product_type === "LIVE"
        )

        return liveMedia?.id || null
    }

    /**
     * Start the polling cycle
     */
    private async startPolling(state: InstagramPollingState): Promise<void> {
        // Initial fetch — awaited so the first batch of messages populates seenCommentIds
        await this.pollCycle(state)

        // Start interval
        state.intervalId = setInterval(() => {
            this.pollCycle(state)
        }, this.POLLING_INTERVAL_MS)
    }

    /**
     * Stop the polling cycle
     */
    private stopPolling(state: InstagramPollingState): void {
        state.connected = false
        if (state.intervalId !== null) {
            clearInterval(state.intervalId)
            state.intervalId = null
        }
    }

    /**
     * Execute a single poll cycle
     */
    private async pollCycle(state: InstagramPollingState): Promise<void> {
        try {
            const comments = await getComments(
                state.token,
                state.igUserId,
                state.mediaId
            )

            for (const comment of comments.data) {
                if (state.seenCommentIds.has(comment.id)) continue
                state.seenCommentIds.add(comment.id)

                const chatMessage = this.toChatMessage(state.mediaId, comment)
                this.notifyMessageHandlers(state.roomId, chatMessage)
            }
        } catch (error) {
            const err =
                error instanceof Error ? error : new Error(String(error))
            logger.warn("Instagram live chat poll cycle error", {
                roomId: state.roomId,
                error: err.message,
            })
            this.notifyError(err)
        }
    }

    /**
     * Convert an Instagram comment to our ChatMessage format
     */
    private toChatMessage(
        channelId: string,
        comment: {
            id: string
            text: string
            timestamp?: string
            username?: string
        }
    ): ChatMessage {
        const user: ChatUser = {
            id: comment.id,
            username: comment.username?.toLowerCase() || "unknown",
            displayName: comment.username || "Unknown",
            platform: "instagram",
            badges: [],
        }

        return {
            id: `instagram-${comment.id}`,
            channelId,
            platform: "instagram",
            user,
            content: comment.text || "",
            type: "text",
            timestamp: comment.timestamp
                ? new Date(comment.timestamp).getTime()
                : Date.now(),
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
