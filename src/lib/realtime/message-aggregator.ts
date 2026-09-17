/**
 * Message Aggregator
 * Manages platform chat adapters for a user. On start(), connects to all
 * configured platforms (twitch, kick) and forwards normalized messages
 * to the user's SSE connections via connection-store broadcast.
 */

import { createLogger } from "@/lib/logger"
import { KickChatAdapter, TwitchChatAdapter, YouTubeLiveChatAdapter } from "@/lib/chat"
import type { ChatAdapter, ChatMessage } from "@/lib/chat/types"
import { sendEvent } from "./sse-manager"

const logger = createLogger("MessageAggregator")

type ChatPlatform = "twitch" | "kick" | "youtube"

type PlatformConnectInfo = Partial<
    Record<ChatPlatform, { channelName: string; token?: string }>
>

interface PlatformAdapterEntry {
    adapter: ChatAdapter
    cleanupFns: Array<() => void>
}

const ADAPTER_REGISTRY: Record<ChatPlatform, () => ChatAdapter> = {
    twitch: () => new TwitchChatAdapter(),
    kick: () => new KickChatAdapter(),
    youtube: () => new YouTubeLiveChatAdapter(),
}

export interface AggregatedMessage {
    id: string
    channelId: string
    platform: string
    user: {
        id: string
        username: string
        displayName: string
        isBroadcaster?: boolean
        isModerator?: boolean
        isSubscriber?: boolean
    }
    content: string
    type: string
    timestamp: number
    isAction?: boolean
}

export class MessageAggregator {
    private static instances = new Map<string, MessageAggregator>()

    private userId: string
    private platforms: ChatPlatform[]
    private platformConnect: PlatformConnectInfo
    private adapters: Map<ChatPlatform, PlatformAdapterEntry> = new Map()
    private started = false

    constructor(userId: string, platformConnect: PlatformConnectInfo) {
        const platforms = Object.keys(platformConnect) as ChatPlatform[]
        if (platforms.length === 0) {
            throw new Error("At least one platform must be configured")
        }
        this.userId = userId
        this.platforms = platforms
        this.platformConnect = platformConnect
    }

    async start(): Promise<void> {
        if (this.started) {
            logger.debug("Aggregator already started", { userId: this.userId })
            return
        }

        const existing = MessageAggregator.instances.get(this.userId)
        if (existing && existing !== this) {
            logger.info("Stopping previous aggregator for user", {
                userId: this.userId,
            })
            await existing.stop()
        }
        MessageAggregator.instances.set(this.userId, this)

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
                const connectInfo = this.platformConnect[platform]
                const entry: PlatformAdapterEntry = {
                    adapter,
                    cleanupFns: [],
                }

                if (!connectInfo) {
                    logger.warn("No connect info for platform", { platform })
                    continue
                }

                const channelName = connectInfo.channelName
                const token = connectInfo.token || ""

                const unsubMessage = adapter.onMessage(
                    channelName,
                    (message: ChatMessage) => {
                        this.handleMessage(message)
                    }
                )
                entry.cleanupFns.push(unsubMessage)

                const unsubError = adapter.onError((error: Error) => {
                    this.handleError(platform, error)
                })
                entry.cleanupFns.push(unsubError)

                this.adapters.set(platform, entry)

                await adapter.connect(channelName, token)
                logger.info("Connected to platform chat", {
                    userId: this.userId,
                    platform,
                })

                sendEvent(this.userId, "status", {
                    platform,
                    connected: true,
                })
            } catch (error) {
                const errorMsg =
                    error instanceof Error ? error.message : String(error)
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

    async stop(): Promise<void> {
        if (!this.started) return

        this.started = false
        logger.info("Stopping message aggregator", { userId: this.userId })

        for (const [platform, entry] of this.adapters.entries()) {
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

            try {
                const connectInfo = this.platformConnect[platform]
                if (!connectInfo) continue
                await entry.adapter.disconnect(connectInfo.channelName)
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

        if (MessageAggregator.instances.get(this.userId) === this) {
            MessageAggregator.instances.delete(this.userId)
        }

        logger.info("Message aggregator stopped", { userId: this.userId })
    }

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

        // Broadcaster chat commands: !titleall / !title / !categoryall / !category
        if (message.user.isBroadcaster) {
            this.handleBroadcastCommand(message.content).catch(err =>
                logger.error("Broadcast command failed", {
                    userId: this.userId,
                    error: err instanceof Error ? err.message : String(err),
                })
            )
        }

        // Custom chat commands handling for all users
        if (message.content.startsWith("!")) {
            this.handleCustomChatCommand(message).catch(err =>
                logger.error("Custom command handling failed", {
                    userId: this.userId,
                    error: err instanceof Error ? err.message : String(err),
                })
            )
        }
    }

    /**
     * Process general custom chat commands (!discord, !specs, etc.)
     */
    private async handleCustomChatCommand(message: AggregatedMessage): Promise<void> {
        try {
            const { parseCommandTrigger, interpolateResponse, isRoleAllowed, isPlatformSupported } = await import("@/lib/chat/types")
            const trigger = parseCommandTrigger(message.content)
            if (!trigger) return

            // Skip title/category commands as they are handled separately
            if (["!title", "!titleall", "!category", "!categoryall"].includes(trigger)) return

            const { getAdminClient } = await import("@/lib/supabase/server")
            const supabase = getAdminClient()

            // Fetch active command definitions for user
            const { data: dbCmds } = await supabase
                .from("custom_commands")
                .select("*")
                .eq("user_id", this.userId)
                .eq("enabled", true)

            const { DEFAULT_COMMANDS } = await import("@/lib/chat/types")
            
            // Combine DB commands and fallback defaults
            const customCmds = (dbCmds || []).map(row => ({
                trigger: row.trigger,
                responseTemplate: row.response_template,
                platforms: row.platforms || ["twitch", "kick", "youtube"],
                allowedRoles: row.allowed_roles || ["viewer"],
            }))

            const allCmds = [
                ...customCmds,
                ...DEFAULT_COMMANDS.map(d => ({
                    trigger: d.trigger,
                    responseTemplate: d.responseTemplate || "",
                    platforms: d.platforms || ["twitch", "kick", "youtube"],
                    allowedRoles: d.allowedRoles || ["viewer"],
                }))
            ]

            const matchedCmd = allCmds.find(c => c.trigger.toLowerCase() === trigger)
            if (!matchedCmd || !matchedCmd.responseTemplate) return

            // Permission check: check platform and user role
            const userRole = message.user.isBroadcaster
                ? "broadcaster"
                : message.user.isModerator
                ? "moderator"
                : message.user.isSubscriber
                ? "subscriber"
                : "viewer"

            if (!isPlatformSupported(message.platform, matchedCmd.platforms)) return
            if (!isRoleAllowed(userRole, matchedCmd.allowedRoles)) return

            const response = interpolateResponse(matchedCmd.responseTemplate, {
                username: message.user.displayName || message.user.username,
                platform: message.platform,
                channelId: message.channelId,
                userId: message.user.id,
                isModerator: !!message.user.isModerator,
                isBroadcaster: !!message.user.isBroadcaster,
                isSubscriber: !!message.user.isSubscriber,
            })

            // Broadcast command response event via SSE
            sendEvent(this.userId, "command_response", {
                trigger,
                response,
                user: message.user.username,
                platform: message.platform,
            })
        } catch (err) {
            logger.warn("Failed to process custom chat command", { error: String(err) })
        }
    }

    /**
     * Parse and execute broadcaster & custom chat commands.
     * Supports !title, !titleall, !category, !categoryall, plus user DB custom commands.
     */
    private async handleBroadcastCommand(content: string): Promise<void> {
        const trimmed = content.trim()
        let payload: { title?: string; category?: string } | null = null

        // Support both !titleall / !title and !categoryall / !category
        if (trimmed.startsWith("!titleall ")) {
            payload = { title: trimmed.slice("!titleall ".length).trim() }
        } else if (trimmed.startsWith("!title ")) {
            payload = { title: trimmed.slice("!title ".length).trim() }
        } else if (trimmed.startsWith("!categoryall ")) {
            payload = {
                category: trimmed.slice("!categoryall ".length).trim(),
            }
        } else if (trimmed.startsWith("!category ")) {
            payload = {
                category: trimmed.slice("!category ".length).trim(),
            }
        }

        if (!payload) return

        const { updateUserStreams } = await import("@/lib/live/stream-updater")
        const results = await updateUserStreams(this.userId, payload)

        logger.info("Broadcast command executed", {
            userId: this.userId,
            payload,
            results,
        })

        sendEvent(this.userId, "broadcast_command", {
            command: payload.title ? "titleall" : "categoryall",
            results,
        })

        // Send confirmation chat response back to active chat platforms
        const successfulPlatforms = results.filter(r => r.success).map(r => r.platform)
        const failedPlatforms = results.filter(r => !r.success).map(r => `${r.platform} (${r.error || "error"})`)

        let replyMessage = ""
        if (payload.title) {
            replyMessage = successfulPlatforms.length > 0
                ? `[Bot] Updated title to "${payload.title}" on ${successfulPlatforms.join(", ")}.`
                : `[Bot] Failed to update title.`
        } else if (payload.category) {
            replyMessage = successfulPlatforms.length > 0
                ? `[Bot] Updated category to "${payload.category}" on ${successfulPlatforms.join(", ")}.`
                : `[Bot] Failed to update category.`
        }

        if (failedPlatforms.length > 0 && successfulPlatforms.length > 0) {
            replyMessage += ` (Failed: ${failedPlatforms.join(", ")})`
        }

        if (replyMessage) {
            for (const [platform, entry] of this.adapters.entries()) {
                const connectInfo = this.platformConnect[platform]
                if (connectInfo?.channelName && entry.adapter) {
                    entry.adapter.sendMessage(connectInfo.channelName, replyMessage).catch(err => {
                        logger.warn("Failed to send command feedback to chat", { platform, error: String(err) })
                    })
                }
            }
        }
    }

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

    static async sendMessage(
        userId: string,
        platform: ChatPlatform,
        channelName: string,
        message: string,
        token: string
    ): Promise<boolean> {
        const aggregator = MessageAggregator.instances.get(userId)
        if (aggregator?.started) {
            const entry = aggregator.adapters.get(platform)
            if (entry && entry.adapter) {
                await entry.adapter.sendMessage(channelName, message)
                return true
            }
        }

        const factory = ADAPTER_REGISTRY[platform]
        if (!factory) {
            logger.error("No adapter factory for platform", { platform })
            return false
        }
        const adapter = factory()

        try {
            await adapter.connect(channelName, token)
            if (platform === "twitch") {
                const twitchAdapter = adapter as TwitchChatAdapter
                await twitchAdapter.waitForJoin(channelName)
            }
            await adapter.sendMessage(channelName, message)
            return true
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error))
            logger.error("Failed to send message on platform", { platform, error: err.message })
            return false
        } finally {
            await adapter.disconnect(channelName)
        }
    }

    isRunning(): boolean {
        return this.started
    }

    getConnectedPlatforms(): ChatPlatform[] {
        return Array.from(this.adapters.keys())
    }
}
