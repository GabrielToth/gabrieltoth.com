/**
 * Facebook Live Chat Adapter
 * HTTP polling-based chat adapter for Facebook Live using Facebook Graph API.
 * Implements the ChatAdapter interface for multi-platform unified chat.
 *
 * Note: Uses HTTP polling via fetch() — works in any runtime.
 * Reuses existing facebook/live.ts and facebook/comments.ts API functions.
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
import { getLiveVideos, getLiveComments } from "../facebook/live"
import { replyToComment } from "../facebook/comments"

const logger = createLogger("FacebookLiveChatAdapter")

interface FacebookMessageHandler {
    (message: ChatMessage): void
}

interface FacebookPollingState {
    roomId: string
    liveVideoId: string
    token: string
    intervalId: ReturnType<typeof setInterval> | null
    seenCommentIds: Set<string>
    connected: boolean
    pageId: string
}

export class FacebookLiveChatAdapter implements ChatAdapter {
    readonly platform = "facebook" as const
    readonly config: ChatAdapterConfig = {
        platform: "facebook",
        enabled: true,
        maxMessageLength: 500,
        commands: [],
    }

    private pollingStates: Map<string, FacebookPollingState> = new Map()
    private messageHandlers: Map<string, Set<FacebookMessageHandler>> =
        new Map()
    private errorHandlers: Set<(error: Error) => void> = new Set()
    private readonly POLLING_INTERVAL_MS = 5000

    /**
     * Connect to a Facebook Live chat room
     */
    async connect(roomId: string, token: string): Promise<void> {
        if (this.pollingStates.has(roomId)) {
            logger.debug("Already connected to Facebook live chat", { roomId })
            return
        }

        try {
            // roomId is the Facebook Page ID
            const pageId = roomId

            // Find active live video
            const liveVideos = await getLiveVideos(token, pageId, {
                limit: 10,
            })

            const activeVideo = liveVideos.data.find(
                video => video.status === "LIVE"
            )

            if (!activeVideo) {
                throw new Error(
                    "No active Facebook Live video found for this page"
                )
            }

            const state: FacebookPollingState = {
                roomId,
                liveVideoId: activeVideo.id,
                token,
                intervalId: null,
                seenCommentIds: new Set(),
                connected: true,
                pageId,
            }

            this.pollingStates.set(roomId, state)

            // Start polling
            await this.startPolling(state)

            logger.info("Connected to Facebook live chat", {
                roomId,
                liveVideoId: activeVideo.id,
            })
        } catch (error) {
            const err =
                error instanceof Error ? error : new Error(String(error))
            logger.error("Failed to connect to Facebook live chat", {
                roomId,
                error: err.message,
            })
            this.notifyError(err)
            throw err
        }
    }

    /**
     * Disconnect from a Facebook live chat room
     */
    async disconnect(roomId: string): Promise<void> {
        const state = this.pollingStates.get(roomId)
        if (!state) {
            logger.debug("Not connected to Facebook live chat", { roomId })
            return
        }

        this.stopPolling(state)
        this.pollingStates.delete(roomId)
        this.messageHandlers.delete(roomId)
        logger.info("Disconnected from Facebook live chat", { roomId })
    }

    /**
     * Send a message to Facebook live chat (replies to the live video)
     */
    async sendMessage(
        roomId: string,
        message: string,
        _options?: SendMessageOptions
    ): Promise<string> {
        const state = this.pollingStates.get(roomId)
        if (!state || !state.connected) {
            throw new Error(`Not connected to Facebook live chat: ${roomId}`)
        }

        if (message.length > this.config.maxMessageLength) {
            throw new Error(
                `Message exceeds Facebook max length of ${this.config.maxMessageLength}`
            )
        }

        // Post a comment to the live video
        const result = await replyToComment(
            state.token,
            state.liveVideoId,
            message
        )

        const messageId =
            result.id ||
            `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`

        logger.debug("Message sent to Facebook live chat", {
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
            platform: "facebook",
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
            logger.debug("Not connected to Facebook live chat", { roomId })
            return []
        }

        try {
            const comments = await getLiveComments(
                state.token,
                state.liveVideoId,
                {
                    limit: _limit || 50,
                }
            )

            return comments.data.map(comment =>
                this.toChatMessage(state.liveVideoId, comment)
            )
        } catch (error) {
            logger.warn("Failed to fetch Facebook live chat history", {
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
     * Start the polling cycle
     */
    private async startPolling(state: FacebookPollingState): Promise<void> {
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
    private stopPolling(state: FacebookPollingState): void {
        state.connected = false
        if (state.intervalId !== null) {
            clearInterval(state.intervalId)
            state.intervalId = null
        }
    }

    /**
     * Execute a single poll cycle
     */
    private async pollCycle(state: FacebookPollingState): Promise<void> {
        try {
            const comments = await getLiveComments(
                state.token,
                state.liveVideoId
            )

            for (const comment of comments.data) {
                if (state.seenCommentIds.has(comment.id)) continue
                state.seenCommentIds.add(comment.id)

                const chatMessage = this.toChatMessage(
                    state.liveVideoId,
                    comment
                )
                this.notifyMessageHandlers(state.roomId, chatMessage)
            }
        } catch (error) {
            const err =
                error instanceof Error ? error : new Error(String(error))
            logger.warn("Facebook live chat poll cycle error", {
                roomId: state.roomId,
                error: err.message,
            })
            this.notifyError(err)
        }
    }

    /**
     * Convert a Facebook comment to our ChatMessage format
     */
    private toChatMessage(
        channelId: string,
        comment: {
            id: string
            message: string
            from?: { name: string; id: string }
            created_time?: string
        }
    ): ChatMessage {
        const user: ChatUser = {
            id: comment.from?.id || "unknown",
            username: comment.from?.name?.toLowerCase() || "unknown",
            displayName: comment.from?.name || "Unknown",
            platform: "facebook",
            badges: [],
        }

        return {
            id: `facebook-${comment.id}`,
            channelId,
            platform: "facebook",
            user,
            content: comment.message || "",
            type: "text",
            timestamp: comment.created_time
                ? new Date(comment.created_time).getTime()
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
