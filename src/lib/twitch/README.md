# Twitch Module

OAuth 2.0 authentication and Helix API integration for Twitch. Provides authorization URL generation, token management, and API calls for user, channel, and stream data.

## Overview

The Twitch module handles:

- **OAuth Flow**: Authorization URL generation, code exchange, token refresh, and token revocation
- **Helix API**: Fetch user info, channel info, stream status, top games, and modify channel settings
- **Configuration**: Centralized config with validation, singleton access pattern

## Architecture

```
src/lib/twitch/
├── config.ts          — Configuration interfaces, defaults, validation, singleton
├── oauth-service.ts   — OAuth flow + Helix API methods, singleton access
└── index.ts           — Barrel exports
```

### Files

| File | Responsibility |
|------|---------------|
| `config.ts` | `TwitchConfig` and `TwitchOAuthConfig` interfaces, default scopes, `createTwitchConfig()`, `getTwitchConfig()` singleton, `validateTwitchConfig()` |
| `oauth-service.ts` | `TwitchOAuthService` class — all OAuth and API operations, `getTwitchOAuthService()` singleton |
| `index.ts` | Barrel re-exports for convenient imports |

## Features

- ✅ Authorization URL generation with state parameter
- ✅ PKCE-style authorization code exchange
- ✅ Access token refresh using refresh token
- ✅ User info retrieval (`/users`)
- ✅ Channel info retrieval (`/channels`)
- ✅ Stream status retrieval (`/streams`)
- ✅ Channel modification (title, game, tags) (`PATCH /channels`)
- ✅ Top games / category search (`/games/top`, `/search/categories`)
- ✅ Token revocation
- ✅ Singleton service access pattern
- ✅ Configuration validation on startup

## Setup

### Environment Variables

```bash
TWITCH_CLIENT_ID=your_client_id
TWITCH_CLIENT_SECRET=your_client_secret
TWITCH_REDIRECT_URI=https://www.gabrieltoth.com/api/oauth/callback/twitch
```

> The redirect URI defaults to `http://localhost:3000/api/oauth/callback/twitch` when not set (local development).

### Default OAuth Scopes

```typescript
const DEFAULT_SCOPES = [
    "chat:read",                    // Read chat messages
    "chat:edit",                    // Send chat messages
    "moderation:read",              // Read moderation data
    "moderator:manage:banned_users", // Ban/unban users
    "moderator:manage:announcements", // Send announcements
    "moderator:manage:chat_messages", // Delete chat messages
    "channel:manage:broadcast",     // Manage stream metadata
    "channel:read:subscriptions",   // Read subscriber list
    "channel:moderate",             // Channel moderation
    "user:read:broadcast",          // Read user broadcast info
    "user:read:email",              // Read user email
    "whispers:read",                // Read whispers
    "whispers:edit",                // Send whispers
]
```

## Usage

### Generate Authorization URL

```typescript
import { getTwitchConfig, getTwitchOAuthService } from "@/lib/twitch"

const config = getTwitchConfig()
const service = getTwitchOAuthService(config)

const state = crypto.randomBytes(32).toString("hex")
const { authorizationUrl } = service.generateAuthorizationUrl(state)

// Redirect user to authorizationUrl
```

### Exchange Authorization Code for Token

```typescript
const tokenResponse = await service.exchangeCodeForToken(code)
// {
//   accessToken: "...",
//   refreshToken: "...",
//   expiresIn: 3600,
//   tokenType: "bearer",
//   scope: "chat:read chat:edit ..."
// }
```

### Get User Info

```typescript
const user = await service.getUser(accessToken)
// {
//   id: "12345",
//   login: "mytwitch",
//   displayName: "MyTwitch",
//   profileImageUrl: "https://...",
//   ...
// }
```

### Get Stream Status

```typescript
const stream = await service.getStream(accessToken, broadcasterId)
// {
//   id: "stream-123",
//   gameName: "Just Chatting",
//   viewerCount: 42,
//   title: "My stream title",
//   startedAt: "2026-01-01T00:00:00Z",
//   ...
// }
// Returns null if not live
```

### Modify Channel (Title, Game)

```typescript
const success = await service.modifyChannel(accessToken, broadcasterId, {
    title: "New stream title",
    game_id: "509658", // Just Chatting
})
```

### Get Top Games

```typescript
// Top games (no query)
const topGames = await service.getTopGames(accessToken, undefined, 20)

// Search categories
const searchResults = await service.getTopGames(accessToken, "Just Chatting", 10)
```

### Revoke Token

```typescript
await service.revokeToken(accessToken)
```

## Error Handling

All API methods handle errors gracefully:

- `exchangeCodeForToken` and `refreshAccessToken` throw `Error` on non-OK responses with status and error body
- `getUser`, `getChannel`, `getStream` return `null` on failure
- `modifyChannel` returns `false` on failure
- `getTopGames` returns empty array `[]` on failure
- `revokeToken` always returns `true` (logs warnings on non-OK)

Errors are logged via the project's structured logger (`createLogger("TwitchOAuthService")`).

## Singleton Access

```typescript
import { getTwitchConfig, getTwitchOAuthService, resetTwitchOAuthService } from "@/lib/twitch"

// First call creates the instance
const service = getTwitchOAuthService(getTwitchConfig())

// Subsequent calls return the same instance
const sameService = getTwitchOAuthService(getTwitchConfig())
// service === sameService

// Reset for testing or re-initialization
resetTwitchOAuthService()
```

## Scopes

The default scopes are defined in `config.ts` as `DEFAULT_SCOPES`. To customize:

```typescript
// Override before first getTwitchConfig() call
process.env.TWITCH_CLIENT_ID = "my-id"
process.env.TWITCH_CLIENT_SECRET = "my-secret"
// Scopes are built into createTwitchConfig(), modify DEFAULT_SCOPES if needed
```

## Rate Limits

Twitch Helix API rate limit is configured at 800 requests per minute. The module does not implement client-side rate limiting — it relies on Twitch's server-side enforcement.

## Testing

Refer to test files in `src/__tests__/` for Twitch module tests:

```bash
npm run test -- src/__tests__/lib/twitch/
```

## References

- [Twitch API Reference](https://dev.twitch.tv/docs/api/reference/)
- [Twitch OAuth Authorization Code Flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#authorization-code-grant-flow)
- [Twitch Scopes Reference](https://dev.twitch.tv/docs/authentication/scopes/)
