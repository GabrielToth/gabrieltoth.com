/**
 * Chat — Platform-Agnostic Types
 * Core interfaces for multi-platform chat. Every platform adapter
 * (Kick, Twitch, YouTube, etc.) must implement ChatAdapter.
 */

export type ChatPlatform =
    | "kick"
    | "twitch"
    | "youtube"
    | "instagram"
    | "twitter"
    | "tiktok"
    | "facebook"

export interface ChatUser {
    id: string
    username: string
    displayName: string
    platform: ChatPlatform
    badges: ChatBadge[]
    isBroadcaster?: boolean
    isModerator?: boolean
    isSubscriber?: boolean
    isVip?: boolean
}

export interface ChatBadge {
    id: string
    label: string
    imageUrl: string
}

export type ChatMessageType =
    "text" | "emote" | "system" | "announcement" | "subscription" | "raid"

export interface ChatMessage {
    id: string
    channelId: string
    platform: ChatPlatform
    user: ChatUser
    content: string
    type: ChatMessageType
    timestamp: number
    emotes?: ChatEmote[]
    replyTo?: string
    isAction?: boolean
}

export interface ChatEmote {
    id: string
    name: string
    imageUrl: string
    positions: { start: number; end: number }[]
}

export interface ChatRoom {
    id: string
    platform: ChatPlatform
    name: string
    title?: string
    isLive: boolean
    viewerCount?: number
}

export interface ChatAdapterConfig {
    platform: ChatPlatform
    enabled: boolean
    maxMessageLength: number
    commands: string[]
}

export interface SendMessageOptions {
    replyTo?: string
    isAction?: boolean
}

export interface ChatAdapter {
    readonly platform: ChatPlatform
    readonly config: ChatAdapterConfig

    connect(roomId: string, token: string): Promise<void>
    disconnect(roomId: string): Promise<void>
    sendMessage(
        roomId: string,
        message: string,
        options?: SendMessageOptions
    ): Promise<string>
    getRoom(roomId: string): Promise<ChatRoom | null>
    onMessage(roomId: string, callback: (message: ChatMessage) => void): () => void
    onError(callback: (error: Error) => void): () => void
    on?: (event: string, listener: (...args: unknown[]) => void) => this
    off?: (event: string, listener: (...args: unknown[]) => void) => this
}

// Custom Chat Commands Types
export type CommandType = "response" | "stream_update" | "moderation" | "system"
export type AllowedRole = "broadcaster" | "moderator" | "subscriber" | "viewer"

export interface CustomChatCommand {
    id?: string
    trigger: string
    type: CommandType
    responseTemplate?: string
    description?: string
    platforms?: string[]
    allowedRoles?: AllowedRole[]
    cooldownSeconds?: number
    enabled?: boolean
    createdAt?: string
    updatedAt?: string
    updateTitle?: boolean
    updateCategory?: string | null
}

export interface DefaultCommand extends CustomChatCommand {
    editable: boolean
    deletable: boolean
}

export interface CommandContext {
    username: string
    platform: string
    channelId: string
    userId: string
    isModerator: boolean
    isBroadcaster: boolean
    isSubscriber: boolean
}

export const DEFAULT_COMMANDS: DefaultCommand[] = [
    {
        id: "default:titleall",
        trigger: "!titleall",
        type: "stream_update",
        description: "Updates the stream title for all active platforms",
        platforms: ["twitch", "kick", "youtube"],
        allowedRoles: ["broadcaster"],
        cooldownSeconds: 30,
        enabled: true,
        editable: false,
        deletable: false,
    },
    {
        id: "default:categoryall",
        trigger: "!categoryall",
        type: "stream_update",
        description: "Updates the stream category/game for all active platforms",
        platforms: ["twitch", "kick"],
        allowedRoles: ["broadcaster"],
        cooldownSeconds: 30,
        enabled: true,
        editable: false,
        deletable: false,
    },
    {
        id: "default:discord",
        trigger: "!discord",
        type: "response",
        responseTemplate: "Join our Discord: https://discord.gg/gabrieltoth",
        description: "Share Discord server link",
        platforms: ["twitch", "kick", "youtube"],
        allowedRoles: ["viewer"],
        cooldownSeconds: 60,
        enabled: true,
        editable: true,
        deletable: true,
    },
    {
        id: "default:commands",
        trigger: "!commands",
        type: "response",
        responseTemplate: "Available commands: !title <title>, !category <category>, !discord, !commands",
        description: "List available commands",
        platforms: ["twitch", "kick", "youtube"],
        allowedRoles: ["viewer"],
        cooldownSeconds: 60,
        enabled: true,
        editable: true,
        deletable: true,
    },
]

export function parseCommandTrigger(message: string): string | null {
    if (!message || !message.trim().startsWith("!")) return null
    const parts = message.trim().split(/\s+/)
    return parts[0].toLowerCase()
}

export function interpolateResponse(
    template: string,
    context: CommandContext
): string {
    let result = template
    result = result.replace(/\{user\}/gi, context.username)
    result = result.replace(/\{platform\}/gi, context.platform)
    result = result.replace(/\{channel\}/gi, context.channelId)
    result = result.replace(/\{time\}/gi, new Date().toLocaleTimeString("en-US", { hour12: false }))
    result = result.replace(/\{date\}/gi, new Date().toLocaleDateString("en-US"))
    return result
}

export function isRoleAllowed(
    role: AllowedRole,
    allowedRoles: AllowedRole[] = ["viewer"]
): boolean {
    return allowedRoles.includes(role)
}

export function isPlatformSupported(
    platform: string,
    platforms: string[] = ["twitch", "kick", "youtube"]
): boolean {
    return platforms.length === 0 || platforms.includes(platform)
}