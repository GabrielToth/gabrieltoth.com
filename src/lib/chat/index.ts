/**
 * Chat Module — Barrel Export
 * Re-exports chat types and adapters for multi-platform unified chat.
 */

export { TwitchChatAdapter } from "./twitch-adapter"
export { KickChatAdapter } from "./kick-adapter"
export { YouTubeLiveChatAdapter } from "./youtube-live-chat-adapter"
export { YouTubeRelayChatAdapter } from "./youtube-relay-adapter"
export { FacebookLiveChatAdapter } from "./facebook-live-chat-adapter"
export { InstagramLiveChatAdapter } from "./instagram-live-chat-adapter"
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
