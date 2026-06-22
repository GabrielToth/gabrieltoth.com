/**
 * Kick API Configuration
 * Centralizes OAuth, API, and WebSocket configuration for Kick platform integration.
 * Reads from process.env directly (not through env.ts) — Vercel provides env vars to RSC.
 */

export interface KickOAuthConfig {
    clientId: string
    clientSecret: string
    redirectUri: string
    scopes: string[]
}

export interface KickConfig {
    oauth: KickOAuthConfig
    apiBaseUrl: string
    oauthAuthorizeUrl: string
    oauthTokenUrl: string
    websocketUrl: string
    rateLimit: {
        linkingAttemptsPerHour: number
    }
    security: {
        tokenExpiryBufferMs: number
    }
}

const DEFAULT_SCOPES = [
    "user:read",
    "channel:read",
    "channel:write",
    "streamkey:read",
    "chat:write",
    "events:subscribe",
    "moderation:read",
    "moderation:write",
    "channel_points:read",
    "channel_points:write",
    "kick:read",
]

export function createKickConfig(): KickConfig {
    return {
        oauth: {
            clientId: process.env.KICK_CLIENT_ID || "",
            clientSecret: process.env.KICK_CLIENT_SECRET || "",
            redirectUri:
                process.env.KICK_REDIRECT_URI ||
                "https://www.gabrieltoth.com/api/oauth/callback/kick",
            scopes: DEFAULT_SCOPES,
        },
        apiBaseUrl: "https://api.kick.com",
        oauthAuthorizeUrl: "https://id.kick.com/oauth/authorize",
        oauthTokenUrl: "https://id.kick.com/oauth/token",
        websocketUrl: "wss://ws.kick.com",
        rateLimit: {
            linkingAttemptsPerHour: 5,
        },
        security: {
            tokenExpiryBufferMs: 5 * 60 * 1000,
        },
    }
}

export function validateKickConfig(config: KickConfig): {
    isValid: boolean
    errors: string[]
} {
    const errors: string[] = []

    if (!config.oauth.clientId) {
        errors.push("Kick Client ID is required")
    }
    if (!config.oauth.clientSecret) {
        errors.push("Kick Client Secret is required")
    }
    if (!config.oauth.redirectUri) {
        errors.push("Kick redirect URI is required")
    }

    if (config.rateLimit.linkingAttemptsPerHour < 1) {
        errors.push("Linking attempts per hour must be at least 1")
    }

    return {
        isValid: errors.length === 0,
        errors,
    }
}

let configInstance: KickConfig | null = null

export function getKickConfig(): KickConfig {
    if (!configInstance) {
        configInstance = createKickConfig()

        const validation = validateKickConfig(configInstance)
        if (!validation.isValid) {
            throw new Error(
                `Invalid Kick configuration: ${validation.errors.join(", ")}`
            )
        }
    }

    return configInstance
}

export function resetKickConfig(): void {
    configInstance = null
}
