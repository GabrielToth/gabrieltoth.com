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

export function getTikTokConfig(env?: EnvironmentConfig): TikTokConfig {
    if (!configInstance) {
        if (!env) {
            throw new Error(
                "Environment configuration is required to create TikTok config",
            )
        }

        configInstance = createTikTokConfig(env)

        const validation = validateTikTokConfig(configInstance)
        if (!validation.isValid) {
            throw new Error(
                `Invalid TikTok configuration: ${validation.errors.join(", ")}`,
            )
        }
    }

    return configInstance
}

export function resetTikTokConfig(): void {
    configInstance = null
}
