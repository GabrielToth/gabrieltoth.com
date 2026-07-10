import { EnvironmentConfig } from "../config/env"

export interface TikTokOAuthConfig {
    clientKey: string
    clientSecret: string
    redirectUri: string
    scopes: string[]
    apiVersion: string
}

export interface TikTokRateLimitConfig {
    linkingAttemptsPerHour: number
    publishAttemptsPerHour: number
}

export interface TikTokSecurityConfig {
    tokenExpiryBufferMs: number
}

export interface TikTokConfig {
    oauth: TikTokOAuthConfig
    rateLimit: TikTokRateLimitConfig
    security: TikTokSecurityConfig
}

const DEFAULT_SCOPES = [
    "user.info.basic",
    "user.info.profile",
    "user.info.stats",
    "video.list",
    "video.publish",
]

export function createTikTokConfig(env: EnvironmentConfig): TikTokConfig {
    return {
        oauth: {
            clientKey: env.TIKTOK_CLIENT_KEY,
            clientSecret: env.TIKTOK_CLIENT_SECRET,
            redirectUri: env.TIKTOK_REDIRECT_URI,
            scopes: DEFAULT_SCOPES,
            apiVersion: "v2",
        },
        rateLimit: {
            linkingAttemptsPerHour: 5,
            publishAttemptsPerHour: 6,
        },
        security: {
            tokenExpiryBufferMs: 5 * 60 * 1000,
        },
    }
}

export function validateTikTokConfig(config: TikTokConfig): {
    isValid: boolean
    errors: string[]
} {
    const errors: string[] = []

    if (!config.oauth.clientKey) {
        errors.push("TikTok Client Key is required")
    }
    if (!config.oauth.clientSecret) {
        errors.push("TikTok Client Secret is required")
    }
    if (!config.oauth.redirectUri) {
        errors.push("TikTok redirect URI is required")
    }

    if (config.rateLimit.linkingAttemptsPerHour < 1) {
        errors.push("Linking attempts per hour must be at least 1")
    }
    if (config.rateLimit.publishAttemptsPerHour < 1) {
        errors.push("Publish attempts per hour must be at least 1")
    }

    return {
        isValid: errors.length === 0,
        errors,
    }
}

let configInstance: TikTokConfig | null = null

/**
 * Get or initialize the TikTok configuration singleton.
 * Reads TikTok-specific env vars from `process.env` directly
 * when no `env` parameter is provided (self-sufficient in serverless).
 *
 * Never silently falls back to a default value — if a required var is
 * missing, the validation step throws a clear error telling the user
 * which env var to set in the Vercel Dashboard.
 */
export function getTikTokConfig(env?: EnvironmentConfig): TikTokConfig {
    if (!configInstance) {
        const resolvedEnv: EnvironmentConfig = env || {
            NODE_ENV:
                (process.env.NODE_ENV as
                    "development" | "production" | "test") ?? "development",
            DEBUG: process.env.DEBUG === "true",
            PORT: parseInt(process.env.PORT ?? "4000", 10),
            DATABASE_URL: process.env.DATABASE_URL ?? "",
            POSTGRES_USER: process.env.POSTGRES_USER ?? "postgres",
            POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD ?? "",
            POSTGRES_DB: process.env.POSTGRES_DB ?? "app",
            UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ?? "",
            UPSTASH_REDIS_REST_TOKEN:
                process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
            DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL ?? "",
            HOSTNAME: process.env.HOSTNAME ?? "unknown",
            YOUTUBE_CLIENT_ID: process.env.YOUTUBE_CLIENT_ID ?? "",
            YOUTUBE_CLIENT_SECRET: process.env.YOUTUBE_CLIENT_SECRET ?? "",
            YOUTUBE_REDIRECT_URI: process.env.YOUTUBE_REDIRECT_URI ?? "",
            INSTAGRAM_APP_ID: process.env.INSTAGRAM_APP_ID ?? "",
            INSTAGRAM_APP_SECRET: process.env.INSTAGRAM_APP_SECRET ?? "",
            INSTAGRAM_REDIRECT_URI: process.env.INSTAGRAM_REDIRECT_URI ?? "",
            INSTAGRAM_WEBHOOK_VERIFY_TOKEN:
                process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN ?? "",
            TIKTOK_CLIENT_KEY: process.env.TIKTOK_CLIENT_KEY ?? "",
            TIKTOK_CLIENT_SECRET: process.env.TIKTOK_CLIENT_SECRET ?? "",
            TIKTOK_REDIRECT_URI: process.env.TIKTOK_REDIRECT_URI ?? "",
            TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID ?? "",
            TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET ?? "",
            TWITTER_REDIRECT_URI: process.env.TWITTER_REDIRECT_URI ?? "",
            FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID ?? "",
            FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET ?? "",
            FACEBOOK_REDIRECT_URI: process.env.FACEBOOK_REDIRECT_URI ?? "",
            FACEBOOK_WEBHOOK_VERIFY_TOKEN:
                process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN ?? "",
            FACEBOOK_PAGE_ID: process.env.FACEBOOK_PAGE_ID ?? "",
            FACEBOOK_PAGE_ACCESS_TOKEN:
                process.env.FACEBOOK_PAGE_ACCESS_TOKEN ?? "",
            INSTAGRAM_BUSINESS_ACCOUNT_ID:
                process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID ?? "",
            INSTAGRAM_PAGE_ACCESS_TOKEN:
                process.env.INSTAGRAM_PAGE_ACCESS_TOKEN ?? "",
            EMAIL_FROM: process.env.EMAIL_FROM ?? "noreply@gabrieltoth.com",
            RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
            RESEND_FROM_EMAIL:
                process.env.RESEND_FROM_EMAIL ??
                process.env.EMAIL_FROM ??
                "noreply@gabrieltoth.com",
            RESEND_FROM_NAME: process.env.RESEND_FROM_NAME ?? "Gabriel Toth",
            TOKEN_ENCRYPTION_KEY: process.env.TOKEN_ENCRYPTION_KEY ?? "",
            OAUTH_STATE_SECRET: process.env.OAUTH_STATE_SECRET ?? "",
        }

        configInstance = createTikTokConfig(resolvedEnv)

        const validation = validateTikTokConfig(configInstance)
        if (!validation.isValid) {
            throw new Error(
                `Cannot initialize TikTok OAuth: ${validation.errors.join("; ")}. ` +
                    `Set the missing variable(s) in your Vercel Dashboard and redeploy.`
            )
        }
    }

    return configInstance
}

export function resetTikTokConfig(): void {
    configInstance = null
}
