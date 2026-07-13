# Kick Module

OAuth 2.1 authentication with PKCE (Proof Key for Code Exchange) for the Kick API. Provides authorization URL generation, token management, and API calls for user and channel data.

## Overview

The Kick module handles:

- **PKCE OAuth Flow**: Authorization URL generation with `code_verifier` / `code_challenge`, code exchange, token refresh, and token revocation
- **User API**: Fetch authenticated user info
- **Channel API**: Fetch channel info including live status and follower count
- **Configuration**: Centralized config with validation, singleton access pattern, rate limiting for linking attempts

## Architecture

```
src/lib/kick/
├── config.ts          — Configuration interfaces, defaults, validation, singleton
└── oauth-service.ts   — OAuth flow + API methods, singleton access
```

### Files

| File | Responsibility |
|------|---------------|
| `config.ts` | `KickConfig` and `KickOAuthConfig` interfaces, default scopes, `createKickConfig()`, `getKickConfig()` singleton, `validateKickConfig()` |
| `oauth-service.ts` | `KickOAuthService` class extending `BaseService` — PKCE OAuth and API operations, `getKickOAuthService()` singleton |

## Features

- ✅ PKCE authorization URL with `code_verifier` / `code_challenge` (OAuth 2.1)
- ✅ State parameter for CSRF protection
- ✅ Authorization code exchange with optional `code_verifier`
- ✅ Access token refresh
- ✅ User info retrieval (`/api/v2/users`)
- ✅ Channel info retrieval (`/api/v2/channels`)
- ✅ Token revocation
- ✅ Rate-limited linking attempts (5 per hour)
- ✅ Singleton service access pattern
- ✅ Configuration validation on startup
- ✅ Error handling via `BaseService.handleError()`

## Setup

### Environment Variables

```bash
KICK_CLIENT_ID=your_client_id
KICK_CLIENT_SECRET=your_client_secret
KICK_REDIRECT_URI=https://www.gabrieltoth.com/api/oauth/callback/kick
```

> The redirect URI defaults to `https://www.gabrieltoth.com/api/oauth/callback/kick` when not set.

### Default OAuth Scopes

```typescript
const DEFAULT_SCOPES = [
    "user:read",              // Read user profile
    "channel:read",           // Read channel info
    "channel:write",          // Write channel settings
    "streamkey:read",         // Read stream key
    "chat:write",             // Send chat messages
    "events:subscribe",       // Subscribe to events
    "moderation:read",        // Read moderation data
    "moderation:write",       // Perform moderation actions
    "channel_points:read",    // Read channel points
    "channel_points:write",   // Redeem channel points
    "kick:read",              // Read Kick platform data
]
```

## Usage

### Generate PKCE Authorization URL

```typescript
import { getKickConfig, getKickOAuthService } from "@/lib/kick"

const config = getKickConfig()
const service = getKickOAuthService(config)

const { authorizationUrl, state, codeVerifier, codeChallenge } =
    service.generateAuthorizationUrl(userId)

// Store state and codeVerifier in session/cache
// Redirect user to authorizationUrl
// On callback, use codeVerifier to exchange the code
```

> Kick requires PKCE (OAuth 2.1). The module automatically generates a `code_verifier` (32 random bytes, base64url-encoded) and its SHA-256 `code_challenge`. The `code_verifier` must be stored server-side and provided during token exchange.

### Exchange Authorization Code for Token

```typescript
const tokenResponse = await service.exchangeCodeForToken(code, codeVerifier)
// {
//   accessToken: "...",
//   refreshToken: "...",
//   expiresIn: 3600,
//   tokenType: "bearer"
// }
```

### Refresh Access Token

```typescript
const newToken = await service.refreshAccessToken(refreshToken)
```

### Get User Info

```typescript
const user = await service.getUser(accessToken)
// {
//   userId: "12345",
//   username: "mykick",
//   email: "user@example.com",
//   profilePictureUrl: "https://..."
// }
```

### Get Channel Info

```typescript
const channel = await service.getChannel(accessToken)
// {
//   id: "12345",
//   name: "My Kick Channel",
//   slug: "mykick",
//   followersCount: 1500,
//   isLive: true
// }
```

### Revoke Token

```typescript
const success = await service.revokeToken(accessToken)
// Returns true if revocation succeeded, false otherwise
```

## Error Handling

The Kick service extends `BaseService` and uses structured `ServiceError` propagation:

- `generateAuthorizationUrl` wraps errors via `handleError()` with context
- `exchangeCodeForToken` throws `ServiceError` with `TOKEN_EXCHANGE_FAILED` code on failure
- `refreshAccessToken` throws `ServiceError` with `TOKEN_REFRESH_FAILED` code on failure
- `getUser` and `getChannel` return `null` on failure (log warnings)
- `revokeToken` returns `false` on failure

All methods call `this.assertReady()` before executing to ensure the service is properly initialized.

## Rate Limiting

Kick account linking is rate-limited to **5 attempts per hour** per configuration. This is enforced by the `rateLimit.linkingAttemptsPerHour` config value. The module validates this value must be at least 1 during config validation.

```typescript
export interface KickConfig {
    rateLimit: {
        linkingAttemptsPerHour: number  // Default: 5
    }
}
```

## Singleton Access

```typescript
import { getKickConfig, getKickOAuthService, resetKickOAuthService } from "@/lib/kick"

// First call creates the instance
const service = getKickOAuthService(getKickConfig())

// Subsequent calls return the same instance
const sameService = getKickOAuthService(getKickConfig())
// service === sameService

// Reset for testing or re-initialization
resetKickOAuthService()
```

## Configuration Validation

The module validates configuration on startup:

```typescript
const { isValid, errors } = validateKickConfig(config)
// Checks:
// - Client ID is set
// - Client Secret is set
// - Redirect URI is set
// - linkingAttemptsPerHour >= 1
```

If validation fails, `getKickConfig()` throws an `Error` with a descriptive message.

## Testing

Refer to test files in `src/__tests__/` for Kick module tests:

```bash
npm run test -- src/__tests__/lib/kick/
```

## References

- [Kick API Documentation](https://docs.kick.com/)
- [OAuth 2.1 — PKCE Extension](https://oauth.net/2.1/)
