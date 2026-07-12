/**
 * LinkedIn OAuth Configuration
 * Centralizes all configuration for LinkedIn OAuth 2.0, token management, and publishing.
 */

import { EnvironmentConfig } from "../config/env"

export interface LinkedInOAuthConfig {
    clientId: string
    clientSecret: string
    redirectUri: string
    scopes: string[]
    apiVersion: string
}

export interface LinkedInConfig {
    oauth: LinkedInOAuthConfig
    rateLimit: {
        linkingAttemptsPerHour: number
        publishAttemptsPerHour: number
    }
    security: {
        tokenExpiryBufferMs: number
    }
}

/**
 * Valid scopes for LinkedIn Standalone App:
 * - w_member_social: Create, modify, and delete posts on your behalf
 * - openid: Use your name and photo (OpenID Connect)
 * - profile: Use your name and photo
 * - email: Use the primary email address
 *
 * NOTE: r_liteprofile and r_emailaddress are legacy v2 scopes that are no longer
 * valid for new apps. w_organization_social requires an Organization-level app.
 */
const DEFAULT_SCOPES = [
    "w_member_social",
    "openid",
    "profile",
    "email",
]

export function createLinkedInConfig(env: EnvironmentConfig): LinkedInConfig {
    return {
        oauth: {
            clientId: env.LINKEDIN_CLIENT_ID,
            clientSecret: env.LINKEDIN_CLIENT_SECRET,
            redirectUri: env.LINKEDIN_REDIRECT_URI,
            scopes: DEFAULT_SCOPES,
            apiVersion: "v2",
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

export function validateLinkedInConfig(config: LinkedInConfig): {
    isValid: boolean
    errors: string[]
} {
    const errors: string[] = []

    if (!config.oauth.clientId) {
        errors.push("LinkedIn Client ID is required")
    }
    if (!config.oauth.clientSecret) {
        errors.push("LinkedIn Client Secret is required")
    }
    if (!config.oauth.redirectUri) {
        errors.push("LinkedIn redirect URI is required")
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

let configInstance: LinkedInConfig | null = null

/**
 * Get or initialize the LinkedIn configuration singleton.
 * Reads LinkedIn-specific env vars from `process.env` directly
 * when no `env` parameter is provided (self-sufficient in serverless).
 */
export function getLinkedInConfig(env?: EnvironmentConfig): LinkedInConfig {
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
            TWITCH_CLIENT_ID: process.env.TWITCH_CLIENT_ID ?? "",
            TWITCH_CLIENT_SECRET: process.env.TWITCH_CLIENT_SECRET ?? "",
            TWITCH_REDIRECT_URI: process.env.TWITCH_REDIRECT_URI ?? "",
            KICK_CLIENT_ID: process.env.KICK_CLIENT_ID ?? "",
            KICK_CLIENT_SECRET: process.env.KICK_CLIENT_SECRET ?? "",
            KICK_REDIRECT_URI: process.env.KICK_REDIRECT_URI ?? "",
        }

        configInstance = createLinkedInConfig(resolvedEnv)

        const validation = validateLinkedInConfig(configInstance)
        if (!validation.isValid) {
            throw new Error(
                `Cannot initialize LinkedIn OAuth: ${validation.errors.join("; ")}. ` +
                    `Set the missing variable(s) in your Vercel Dashboard and redeploy.`
            )
        }
    }

    return configInstance
}

export function resetLinkedInConfig(): void {
    configInstance = null
}
