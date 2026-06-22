/**
 * Chat — Platform-Agnostic Types
 * Core interfaces for multi-platform chat. Every platform adapter
 * (Kick, Twitch, YouTube, etc.) must implement ChatAdapter.
 */

export type ChatPlatform = "kick" | "twitch" | "youtube" | "instagram" | "twitter" | "tiktok" | "facebook"

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

export type ChatMessageType = "text" | "emote" | "system" | "announcement" | "subscription" | "raid"

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
    sendMessage(roomId: string, message: string, options?: SendMessageOptions): Promise<string>
    getRoom(roomId: string): Promise<ChatRoom | null>
    getHistory(roomId: string, limit?: number): Promise<ChatMessage[]>
    onMessage(roomId: string, handler: (message: ChatMessage) => void): () => void
    onError(handler: (error: Error) => void): () => void
}
