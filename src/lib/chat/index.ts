/**
 * Chat Module — Barrel Export
 * Re-exports chat types and adapters for multi-platform unified chat.
 */

export { TwitchChatAdapter } from "./twitch-adapter"
export { KickChatAdapter } from "./kick-adapter"
export type {
    ChatAdapter,
    ChatAdapterConfig,
    ChatBadge,
    ChatEmote,
    ChatMessage,
    ChatMessageType,
    ChatPlatform,
    ChatRoom,
    ChatUser,
    SendMessageOptions,
} from "./types"
