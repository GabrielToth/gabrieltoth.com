/**
 * Message Aggregator
 * Manages platform chat adapters for a user. On start(), connects to all
 * configured platforms (twitch, kick) and forwards normalized messages
 * to the user's SSE connections via connection-store broadcast.
 */

import { createLogger } from "@/lib/logger"
import { KickChatAdapter, TwitchChatAdapter } from "@/lib/chat"
import type { ChatAdapter, ChatMessage } from "@/lib/chat/types"
import { sendEvent } from "./sse-manager"

const logger = createLogger("MessageAggregator")

type ChatPlatform = "twitch" | "kick"

interface PlatformAdapterEntry {
    adapter: ChatAdapter
    cleanupFns: Array<() => void>
}

const ADAPTER_REGISTRY: Record<ChatPlatform, () => ChatAdapter> = {
    twitch: () => new TwitchChatAdapter(),
    kick: () => new KickChatAdapter(),
}

export class MessageAggregator {
    private userId: string
    private platforms: ChatPlatform[]
    private adapters: Map<ChatPlatform, PlatformAdapterEntry> = new Map()
    private started = false
    private roomId: string

    constructor(userId: string, platforms: ChatPlatform[]) {
        if (platforms.length === 0) {
            throw new Error("At least one platform must be configured")
        }
        this.userId = userId
        this.platforms = platforms
        this.roomId = userId // Use userId as the chat room identifier
    }

    /**
     * Start listening on all configured platform adapters
     */
    async start(): Promise<void> {
        if (this.started) {
            logger.debug("Aggregator already started", { userId: this.userId })
            return
        }

        this.started = true
        logger.info("Starting message aggregator", {
            userId: this.userId,
            platforms: this.platforms,
        })

        const errors: Array<{ platform: string; error: string }> = []

        for (const platform of this.platforms) {
            try {
                const factory = ADAPTER_REGISTRY[platform]
                if (!factory) {
                    logger.warn("No adapter factory for platform", { platform })
                    continue
                }

                const adapter = factory()
                const entry: PlatformAdapterEntry = {
                    adapter,
                    cleanupFns: [],
                }

                // Register message handler
                const unsubMessage = adapter.onMessage(
                    this.roomId,
                    (message: ChatMessage) => {
                        this.handleMessage(message)
                    }
                )
                entry.cleanupFns.push(unsubMessage)

                // Register error handler
                const unsubError = adapter.onError((error: Error) => {
                    this.handleError(platform, error)
                })
                entry.cleanupFns.push(unsubError)

                this.adapters.set(platform, entry)

                // Connect to the platform chat
                await adapter.connect(this.roomId, "")
                logger.info("Connected to platform chat", {
                    userId: this.userId,
                    platform,
                })

                // Send status update
                sendEvent(this.userId, "status", {
                    platform,
                    connected: true,
                })
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error)
                logger.error("Failed to start platform adapter", {
                    userId: this.userId,
                    platform,
                    error: errorMsg,
                })

                sendEvent(this.userId, "error", {
                    platform,
                    error: errorMsg,
                })

                errors.push({ platform, error: errorMsg })
            }
        }

        if (errors.length > 0) {
            logger.warn("Some platforms failed to connect", {
                userId: this.userId,
                errors,
            })
        }
    }

    /**
     * Stop all platform adapters and clean up
     */
    async stop(): Promise<void> {
        if (!this.started) return

        this.started = false
        logger.info("Stopping message aggregator", { userId: this.userId })

        for (const [platform, entry] of this.adapters.entries()) {
            // Run cleanup functions (unsubscribe handlers)
            for (const cleanup of entry.cleanupFns) {
                try {
                    cleanup()
                } catch (error) {
                    logger.warn("Cleanup function failed", {
                        platform,
                        error: String(error),
                    })
                }
            }

            // Disconnect adapter
            try {
                await entry.adapter.disconnect(this.roomId)
            } catch (error) {
                logger.warn("Failed to disconnect adapter", {
                    platform,
                    error: String(error),
                })
            }

            sendEvent(this.userId, "status", {
                platform,
                connected: false,
            })
        }

        this.adapters.clear()
        logger.info("Message aggregator stopped", { userId: this.userId })
    }

    /**
     * Handle an incoming chat message from any platform
     */
    private handleMessage(message: ChatMessage): void {
        sendEvent(this.userId, "message", {
            id: message.id,
            channelId: message.channelId,
            platform: message.platform,
            user: {
                id: message.user.id,
                username: message.user.username,
                displayName: message.user.displayName,
                platform: message.user.platform,
                badges: message.user.badges.map(b => ({
                    id: b.id,
                    label: b.label,
                    imageUrl: b.imageUrl,
                })),
                isBroadcaster: message.user.isBroadcaster,
                isModerator: message.user.isModerator,
                isSubscriber: message.user.isSubscriber,
                isVip: message.user.isVip,
            },
            content: message.content,
            type: message.type,
            timestamp: message.timestamp,
            isAction: message.isAction,
        })
    }

    /**
     * Handle an error from a platform adapter
     */
    private handleError(platform: ChatPlatform, error: Error): void {
        logger.error("Platform adapter error", {
            userId: this.userId,
            platform,
            error: error.message,
        })

        sendEvent(this.userId, "error", {
            platform,
            error: error.message,
        })
    }

    /**
     * Check if the aggregator is currently running
     */
    isRunning(): boolean {
        return this.started
    }

    /**
     * Get the list of connected platforms
     */
    getConnectedPlatforms(): ChatPlatform[] {
        return Array.from(this.adapters.keys())
    }
}
