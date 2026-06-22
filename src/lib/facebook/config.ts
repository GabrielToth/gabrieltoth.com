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

export function createFacebookConfig(env: EnvironmentConfig): FacebookConfig {
    return {
        oauth: {
            appId: env.FACEBOOK_APP_ID,
            appSecret: env.FACEBOOK_APP_SECRET,
            redirectUri: env.FACEBOOK_REDIRECT_URI,
            scopes: DEFAULT_SCOPES,
            apiVersion: "v22.0",
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

export function getFacebookConfig(env?: EnvironmentConfig): FacebookConfig {
    if (!configInstance) {
        if (!env) {
            throw new Error(
                "Environment configuration is required to create Facebook config"
            )
        }

        configInstance = createFacebookConfig(env)

        const validation = validateFacebookConfig(configInstance)
        if (!validation.isValid) {
            throw new Error(
                `Invalid Facebook configuration: ${validation.errors.join(", ")}`
            )
        }
    }

    return configInstance
}

export function resetFacebookConfig(): void {
    configInstance = null
}
