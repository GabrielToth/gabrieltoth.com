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

export function getInstagramConfig(env?: EnvironmentConfig): InstagramConfig {
    if (!configInstance) {
        if (!env) {
            throw new Error(
                "Environment configuration is required to create Instagram config"
            )
        }

        configInstance = createInstagramConfig(env)

        const validation = validateInstagramConfig(configInstance)
        if (!validation.isValid) {
            throw new Error(
                `Invalid Instagram configuration: ${validation.errors.join(", ")}`
            )
        }
    }

    return configInstance
}

export function resetInstagramConfig(): void {
    configInstance = null
}
