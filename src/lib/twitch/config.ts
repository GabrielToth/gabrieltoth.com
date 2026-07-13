/**
 * Twitch API Configuration
 * Centralizes OAuth, Helix API, IRC, and WebSocket configuration for Twitch integration.
 * Reads from process.env directly — Vercel provides env vars to RSC.
 */

export interface TwitchOAuthConfig {
    clientId: string
    clientSecret: string
    redirectUri: string
    scopes: string[]
}

export interface TwitchConfig {
    oauth: TwitchOAuthConfig
    apiBaseUrl: string
    oauthAuthorizeUrl: string
    oauthTokenUrl: string
    oauthRevokeUrl: string
    ircUrl: string
    ircPort: number
    eventsubWsUrl: string
    rateLimit: {
        requestsPerMinute: number
    }
    security: {
        tokenExpiryBufferMs: number
    }
}

const DEFAULT_SCOPES = [
    "chat:read",
    "chat:edit",
    "moderation:read",
    "moderator:manage:banned_users",
    "moderator:manage:announcements",
    "moderator:manage:chat_messages",
    "channel:manage:broadcast",
    "channel:read:subscriptions",
    "channel:moderate",
    "user:read:broadcast",
    "user:read:email",
    "whispers:read",
    "whispers:edit",
]

export function createTwitchConfig(): TwitchConfig {
    return {
        oauth: {
            clientId: process.env.TWITCH_CLIENT_ID || "",
            clientSecret: process.env.TWITCH_CLIENT_SECRET || "",
            redirectUri:
                process.env.TWITCH_REDIRECT_URI ||
                (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL
                    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/api/oauth/callback/twitch`
                    : "http://localhost:3000/api/oauth/callback/twitch"),
            scopes: DEFAULT_SCOPES,
        },
        apiBaseUrl: "https://api.twitch.tv/helix",
        oauthAuthorizeUrl: "https://id.twitch.tv/oauth2/authorize",
        oauthTokenUrl: "https://id.twitch.tv/oauth2/token",
        oauthRevokeUrl: "https://id.twitch.tv/oauth2/revoke",
        ircUrl: "irc.chat.twitch.tv",
        ircPort: 6667,
        eventsubWsUrl: "wss://eventsub.wss.twitch.tv",
        rateLimit: {
            requestsPerMinute: 800,
        },
        security: {
            tokenExpiryBufferMs: 5 * 60 * 1000,
        },
    }
}

export function validateTwitchConfig(config: TwitchConfig): {
    isValid: boolean
    errors: string[]
} {
    const errors: string[] = []

    if (!config.oauth.clientId) {
        errors.push("Twitch Client ID is required")
    }
    if (!config.oauth.clientSecret) {
        errors.push("Twitch Client Secret is required")
    }
    if (!config.oauth.redirectUri) {
        errors.push("Twitch redirect URI is required")
    }

    return {
        isValid: errors.length === 0,
        errors,
    }
}

let configInstance: TwitchConfig | null = null

export function getTwitchConfig(): TwitchConfig {
    if (!configInstance) {
        configInstance = createTwitchConfig()

        const validation = validateTwitchConfig(configInstance)
        if (!validation.isValid) {
            throw new Error(
                `Invalid Twitch configuration: ${validation.errors.join(", ")}`
            )
        }
    }

    return configInstance
}

export function resetTwitchConfig(): void {
    configInstance = null
}
