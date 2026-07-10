import { EnvironmentConfig } from "../config/env"

export interface FacebookOAuthConfig {
    appId: string
    appSecret: string
    redirectUri: string
    scopes: string[]
    apiVersion: string
}

export interface FacebookRateLimitConfig {
    linkingAttemptsPerHour: number
    publishAttemptsPerHour: number
    liveAttemptsPerHour: number
}

export interface FacebookSecurityConfig {
    tokenExpiryBufferMs: number
}

export interface FacebookConfig {
    oauth: FacebookOAuthConfig
    rateLimit: FacebookRateLimitConfig
    security: FacebookSecurityConfig
}

const DEFAULT_SCOPES = [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
    "pages_manage_metadata",
    "pages_read_user_content",
    "pages_manage_engagement",
    "public_profile",
]

/**
 * Create Facebook config.
 * NOTE: FACEBOOK_APP_ID and INSTAGRAM_APP_ID are DIFFERENT IDs.
 * FACEBOOK_APP_ID = the main Facebook App ID (from developers.facebook.com)
 * INSTAGRAM_APP_ID = the Instagram-specific App ID within that Facebook App.
 * They are NOT interchangeable. Facebook must use FACEBOOK_APP_ID.
 */
export function createFacebookConfig(env: EnvironmentConfig): FacebookConfig {
    return {
        oauth: {
            appId: env.FACEBOOK_APP_ID,
            appSecret: env.FACEBOOK_APP_SECRET,
            redirectUri: env.FACEBOOK_REDIRECT_URI,
            scopes: DEFAULT_SCOPES,
            apiVersion: "v25.0",
        },
        rateLimit: {
            linkingAttemptsPerHour: 5,
            publishAttemptsPerHour: 10,
            liveAttemptsPerHour: 5,
        },
        security: {
            tokenExpiryBufferMs: 5 * 60 * 1000,
        },
    }
}

export function validateFacebookConfig(config: FacebookConfig): {
    isValid: boolean
    errors: string[]
} {
    const errors: string[] = []

    if (!config.oauth.appId) {
        errors.push("Facebook App ID is required")
    }
    if (!config.oauth.appSecret) {
        errors.push("Facebook App Secret is required")
    }
    if (!config.oauth.redirectUri) {
        errors.push("Facebook redirect URI is required")
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

let configInstance: FacebookConfig | null = null

/**
 * Get or initialize the Facebook configuration singleton.
 * Reads the 3 Facebook-specific env vars from `process.env` directly
 * when no `env` parameter is provided (self-sufficient in serverless).
 *
 * Never silently falls back to a default value — if a required var is
 * missing, the validation step throws a clear error telling the user
 * which env var to set in the Vercel Dashboard.
 */
export function getFacebookConfig(env?: EnvironmentConfig): FacebookConfig {
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

        configInstance = createFacebookConfig(resolvedEnv)

        const validation = validateFacebookConfig(configInstance)
        if (!validation.isValid) {
            throw new Error(
                `Cannot initialize Facebook OAuth: ${validation.errors.join("; ")}. ` +
                    `Set the missing variable(s) in your Vercel Dashboard and redeploy.`
            )
        }
    }

    return configInstance
}

export function resetFacebookConfig(): void {
    configInstance = null
}
