/**
 * Instagram Graph API Configuration
 * Centralizes all configuration for Instagram OAuth, token management, and publishing.
 */

import { EnvironmentConfig } from "../config/env"

export interface InstagramOAuthConfig {
    appId: string
    appSecret: string
    redirectUri: string
    scopes: string[]
    apiVersion: string
}

export interface InstagramConfig {
    oauth: InstagramOAuthConfig
    rateLimit: {
        linkingAttemptsPerHour: number
        publishAttemptsPerHour: number
    }
    security: {
        tokenExpiryBufferMs: number
    }
}

const DEFAULT_SCOPES = [
    // Core
    "instagram_basic",
    "instagram_content_publish",
    "pages_show_list",
    "pages_read_engagement",
    // Comments & moderation
    "instagram_business_manage_comments",
    // Direct Messaging
    "instagram_business_manage_messages",
    // Webhook subscription management
    "pages_manage_metadata",
]

export function createInstagramConfig(env: EnvironmentConfig): InstagramConfig {
    return {
        oauth: {
            appId: env.INSTAGRAM_APP_ID,
            appSecret: env.INSTAGRAM_APP_SECRET,
            redirectUri: env.INSTAGRAM_REDIRECT_URI,
            scopes: DEFAULT_SCOPES,
            apiVersion: "v22.0",
        },
        rateLimit: {
            linkingAttemptsPerHour: 5,
            publishAttemptsPerHour: 10,
        },
        security: {
            tokenExpiryBufferMs: 5 * 60 * 1000,
        },
    }
}

export function validateInstagramConfig(config: InstagramConfig): {
    isValid: boolean
    errors: string[]
} {
    const errors: string[] = []

    if (!config.oauth.appId) {
        errors.push("Instagram App ID is required")
    }
    if (!config.oauth.appSecret) {
        errors.push("Instagram App Secret is required")
    }
    if (!config.oauth.redirectUri) {
        errors.push("Instagram redirect URI is required")
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

let configInstance: InstagramConfig | null = null

/**
 * Get or initialize the Instagram configuration singleton.
 * Reads the 3 Instagram-specific env vars from `process.env` directly
 * when no `env` parameter is provided (self-sufficient in serverless).
 *
 * Never silently falls back to a default value — if a required var is
 * missing, the validation step throws a clear error telling the user
 * which env var to set in the Vercel Dashboard.
 */
export function getInstagramConfig(env?: EnvironmentConfig): InstagramConfig {
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
            FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID ?? "",
            FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET ?? "",
            FACEBOOK_REDIRECT_URI: process.env.FACEBOOK_REDIRECT_URI ?? "",
            FACEBOOK_WEBHOOK_VERIFY_TOKEN:
                process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN ?? "",
            EMAIL_FROM: process.env.EMAIL_FROM ?? "noreply@gabrieltoth.com",
            RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
            RESEND_FROM_EMAIL:
                process.env.RESEND_FROM_EMAIL ??
                process.env.EMAIL_FROM ??
                "noreply@gabrieltoth.com",
            RESEND_FROM_NAME: process.env.RESEND_FROM_NAME ?? "Gabriel Toth",
            TOKEN_ENCRYPTION_KEY: process.env.TOKEN_ENCRYPTION_KEY ?? "",
        }

        configInstance = createInstagramConfig(resolvedEnv)

        const validation = validateInstagramConfig(configInstance)
        if (!validation.isValid) {
            throw new Error(
                `Cannot initialize Instagram OAuth: ${validation.errors.join("; ")}. ` +
                    `Set the missing variable(s) in your Vercel Dashboard and redeploy.`
            )
        }
    }

    return configInstance
}

export function resetInstagramConfig(): void {
    configInstance = null
}
