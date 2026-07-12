// Environment Configuration Validation
// Focus: Fail-fast on missing config, clear error messages

export interface EnvironmentConfig {
    // Application
    NODE_ENV: "development" | "production" | "test"
    DEBUG: boolean
    PORT: number

    // Database
    DATABASE_URL: string
    POSTGRES_USER: string
    POSTGRES_PASSWORD: string
    POSTGRES_DB: string

    // Redis (Upstash REST API; Vercel-friendly, optional for cache)
    UPSTASH_REDIS_REST_URL: string
    UPSTASH_REDIS_REST_TOKEN: string

    // Discord (optional alerts)
    DISCORD_WEBHOOK_URL: string

    // Hostname
    HOSTNAME: string

    // YouTube OAuth (YouTube linking feature)
    YOUTUBE_CLIENT_ID: string
    YOUTUBE_CLIENT_SECRET: string
    YOUTUBE_REDIRECT_URI: string

    // Instagram OAuth (Instagram Business account linking)
    INSTAGRAM_APP_ID: string
    INSTAGRAM_APP_SECRET: string
    INSTAGRAM_REDIRECT_URI: string

    // Instagram Webhook (Meta verification handshake)
    INSTAGRAM_WEBHOOK_VERIFY_TOKEN: string

    // TikTok OAuth (TikTok account linking)
    TIKTOK_CLIENT_KEY: string
    TIKTOK_CLIENT_SECRET: string
    TIKTOK_REDIRECT_URI: string

    // Twitter/X OAuth (Twitter account linking)
    TWITTER_CLIENT_ID: string
    TWITTER_CLIENT_SECRET: string
    TWITTER_REDIRECT_URI: string

    // LinkedIn OAuth (LinkedIn account linking)
    LINKEDIN_CLIENT_ID: string
    LINKEDIN_CLIENT_SECRET: string
    LINKEDIN_REDIRECT_URI: string

    // Facebook OAuth (Facebook Page linking)
    FACEBOOK_APP_ID: string
    FACEBOOK_APP_SECRET: string
    FACEBOOK_REDIRECT_URI: string

    // Facebook Webhook (Meta verification handshake)
    FACEBOOK_WEBHOOK_VERIFY_TOKEN: string

    // Facebook Page Access Token (bypass OAuth — from Graph API Explorer)
    FACEBOOK_PAGE_ID: string
    FACEBOOK_PAGE_ACCESS_TOKEN: string

    // Instagram Business Account Token (bypass OAuth — from Graph API Explorer)
    INSTAGRAM_BUSINESS_ACCOUNT_ID: string
    INSTAGRAM_PAGE_ACCESS_TOKEN: string

    // Twitch OAuth (Twitch account linking)
    TWITCH_CLIENT_ID: string
    TWITCH_CLIENT_SECRET: string
    TWITCH_REDIRECT_URI: string

    // Kick OAuth (Kick account linking)
    KICK_CLIENT_ID: string
    KICK_CLIENT_SECRET: string
    KICK_REDIRECT_URI: string

    // Email via Supabase Auth (configured in Supabase Dashboard SMTP)
    EMAIL_FROM: string

    // Email via Resend (legacy, still used by auth/contact modules)
    RESEND_API_KEY: string
    RESEND_FROM_EMAIL: string
    RESEND_FROM_NAME: string

    // Token Encryption
    TOKEN_ENCRYPTION_KEY: string

    // OAuth State Signing Secret
    OAUTH_STATE_SECRET: string
}

const BASE_REQUIRED = ["DATABASE_URL", "DISCORD_WEBHOOK_URL"] as const

const YOUTUBE_REQUIRED = [
    ...BASE_REQUIRED,
    "YOUTUBE_CLIENT_ID",
    "YOUTUBE_CLIENT_SECRET",
    "YOUTUBE_REDIRECT_URI",
    "TOKEN_ENCRYPTION_KEY",
    "OAUTH_STATE_SECRET",
] as const

function parseConfig(): EnvironmentConfig {
    return {
        NODE_ENV:
            (process.env.NODE_ENV as "development" | "production" | "test") ??
            "development",
        DEBUG: process.env.DEBUG === "true",
        PORT: parseInt(process.env.PORT ?? "4000", 10),
        DATABASE_URL: process.env.DATABASE_URL!,
        POSTGRES_USER: process.env.POSTGRES_USER ?? "postgres",
        POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD ?? "",
        POSTGRES_DB: process.env.POSTGRES_DB ?? "app",
        UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ?? "",
        UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
        DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL!,
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
        LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID ?? "",
        LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET ?? "",
        LINKEDIN_REDIRECT_URI: process.env.LINKEDIN_REDIRECT_URI ?? "",
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
        TWITCH_CLIENT_ID: process.env.TWITCH_CLIENT_ID ?? "",
        TWITCH_CLIENT_SECRET: process.env.TWITCH_CLIENT_SECRET ?? "",
        TWITCH_REDIRECT_URI: process.env.TWITCH_REDIRECT_URI ?? "",
        KICK_CLIENT_ID: process.env.KICK_CLIENT_ID ?? "",
        KICK_CLIENT_SECRET: process.env.KICK_CLIENT_SECRET ?? "",
        KICK_REDIRECT_URI: process.env.KICK_REDIRECT_URI ?? "",
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
}

/**
 * Validate minimal environment variables.
 */
export function validateEnv(): EnvironmentConfig {
    const missing = BASE_REQUIRED.filter(key => !process.env[key])

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(", ")}`
        )
    }

    return parseConfig()
}

/**
 * Validate environment for YouTube channel linking (includes Resend email).
 */
export function validateYouTubeEnv(): EnvironmentConfig {
    const missing = YOUTUBE_REQUIRED.filter(key => !process.env[key])

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(", ")}`
        )
    }

    return parseConfig()
}

export default validateEnv
