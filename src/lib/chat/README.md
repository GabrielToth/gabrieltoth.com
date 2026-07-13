# Chat Module

Multi-platform unified chat system using the adapter pattern. Provides a common interface (`ChatAdapter`) for connecting to, reading from, and writing to chat rooms across different streaming platforms.

## Overview

The chat module provides:

- **Unified Interface**: Single `ChatAdapter` interface for all chat platforms
- **Platform Adapters**: Concrete implementations for Twitch (IRC) and Kick (WebSocket)
- **Normalized Types**: Platform-agnostic `ChatMessage`, `ChatUser`, `ChatRoom` types
- **Extensible**: Add new platforms by implementing the `ChatAdapter` interface

## Architecture

```
src/lib/chat/
├── types.ts            — Core interfaces (ChatAdapter, ChatMessage, ChatUser, etc.)
├── twitch-adapter.ts   — Twitch IRC implementation
├── kick-adapter.ts     — Kick WebSocket implementation
└── index.ts            — Barrel exports
```

### Files

| File | Responsibility |
|------|---------------|
| `types.ts` | `ChatAdapter` interface, `ChatMessage`, `ChatUser`, `ChatRoom`, `ChatEmote`, `ChatBadge`, `ChatPlatform`, `ChatAdapterConfig`, `SendMessageOptions` |
| `twitch-adapter.ts` | `TwitchChatAdapter` — IRC-based chat via Node.js `net` socket to `irc.chat.twitch.tv` |
| `kick-adapter.ts` | `KickChatAdapter` — WebSocket-based chat to `wss://ws.kick.com` |
| `index.ts` | Barrel re-exports for convenient imports |

## Core Types

### ChatPlatform

```typescript
type ChatPlatform = "kick" | "twitch" | "youtube" | "instagram" | "twitter" | "tiktok" | "facebook"
```

### ChatMessage

```typescript
interface ChatMessage {
    id: string
    channelId: string
    platform: ChatPlatform
    user: ChatUser
    content: string
    type: ChatMessageType    // "text" | "emote" | "system" | "announcement" | "subscription" | "raid"
    timestamp: number
    emotes?: ChatEmote[]
    replyTo?: string
    isAction?: boolean
}
```

### ChatUser

```typescript
interface ChatUser {
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
```

### ChatRoom

```typescript
interface ChatRoom {
    id: string
    platform: ChatPlatform
    name: string
    title?: string
    isLive: boolean
    viewerCount?: number
}
```

## ChatAdapter Interface

```typescript
interface ChatAdapter {
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
```

| Method | Description |
|--------|-------------|
| `connect` | Connect to a chat room using an authentication token |
| `disconnect` | Disconnect from a chat room |
| `sendMessage` | Send a message to a chat room, returns message ID |
| `getRoom` | Get room metadata (name, live status, viewer count) |
| `getHistory` | Get recent message history |
| `onMessage` | Register a handler for incoming messages, returns unsubscribe function |
| `onError` | Register a handler for connection errors, returns unsubscribe function |

## Platform Adapters

### Twitch Chat Adapter (IRC)

File: `twitch-adapter.ts`

- Uses raw TCP sockets via Node.js `net` module
- Connects to `irc.chat.twitch.tv:6667`
- Implements IRC protocol (PASS, NICK, JOIN, PRIVMSG, PONG)
- Parses IRCv3 tags for badges, emotes, user info
- Supports /me actions, timeouts, bans
- Max message length: 500 characters
- Supported commands: `/me`, `/timeout`, `/ban`, `/unban`, `/slow`, `/subscribers`

**Note**: Uses Node.js `net` module — only works in Node.js runtime (not Edge/Deno).

### Kick Chat Adapter (WebSocket)

File: `kick-adapter.ts`

- Uses the WebSocket API to connect to `wss://ws.kick.com`
- JSON message protocol with event-based routing
- Supports automatic reconnection with exponential backoff (up to 5 attempts)
- Handles events: `message`, `user_joined`, `user_left`, `subscription`, `error`
- Max message length: 500 characters
- Supported commands: `/timeout`, `/ban`, `/unban`, `/slow`, `/followers`
- Reconnection strategy: 2^x exponential backoff starting at 3 seconds

**Note**: Uses Node.js WebSocket — only works in Node.js runtime.

## Adding a New Platform Adapter

To add support for a new chat platform (e.g., YouTube Live Chat):

1. **Create the adapter file** (`src/lib/chat/youtube-adapter.ts`):

```typescript
import { createLogger } from "../logger"
import type {
    ChatAdapter, ChatAdapterConfig, ChatMessage, ChatRoom, SendMessageOptions
} from "./types"

const logger = createLogger("YoutubeChatAdapter")

export class YoutubeChatAdapter implements ChatAdapter {
    readonly platform = "youtube" as const
    readonly config: ChatAdapterConfig = {
        platform: "youtube",
        enabled: true,
        maxMessageLength: 200,
        commands: [],
    }

    async connect(roomId: string, token: string): Promise<void> {
        // Implement platform-specific connection logic
    }

    async disconnect(roomId: string): Promise<void> {
        // Clean up connection
    }

    async sendMessage(roomId: string, message: string, options?: SendMessageOptions): Promise<string> {
        // Implement message sending
    }

    async getRoom(roomId: string): Promise<ChatRoom | null> {
        // Return room metadata
    }

    async getHistory(roomId: string, limit?: number): Promise<ChatMessage[]> {
        // Return recent messages
    }

    onMessage(roomId: string, handler: (message: ChatMessage) => void): () => void {
        // Register handler, return unsubscribe function
    }

    onError(handler: (error: Error) => void): () => void {
        // Register error handler, return unsubscribe function
    }
}
```

2. **Export from barrel** (`index.ts`):

```typescript
export { YoutubeChatAdapter } from "./youtube-adapter"
```

3. **Add platform to types** (if new):

```typescript
type ChatPlatform = "kick" | "twitch" | "youtube" | ...
```

## Message Normalization

Each adapter normalizes platform-specific messages into the unified `ChatMessage` format:

| Adapter | Source Format | Normalization |
|---------|--------------|---------------|
| Twitch | IRCv3 tags (`@badges=...;color=...`) | Parses IRC tags into `ChatUser.badges`, `ChatMessage.emotes` |
| Kick | JSON WebSocket (`{ event: "message", data: { ... } }`) | Maps `sender.username`, `content`, `user_id`, badges |

## Usage Example

```typescript
import { TwitchChatAdapter } from "@/lib/chat"

const adapter = new TwitchChatAdapter()

// Connect to a channel
await adapter.connect("channelname", "oauth:your_token")

// Listen for messages
const unsubscribe = adapter.onMessage("channelname", (message) => {
    console.log(`${message.user.displayName}: ${message.content}`)
})

// Send a message
await adapter.sendMessage("channelname", "Hello everyone!")

// Register error handler
const unsubscribeError = adapter.onError((error) => {
    console.error("Chat error:", error)
})

// Clean up
unsubscribe()
adapter.disconnect("channelname")
```

## Testing

Refer to test files in `src/__tests__/` for chat module tests:

```bash
npm run test -- src/__tests__/lib/chat/
```

## References

- [Twitch IRC Protocol](https://dev.twitch.tv/docs/irc)
- [Kick WebSocket API](https://docs.kick.com/)
