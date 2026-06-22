/**
 * YouTube Channel Linking Service Configuration
 * Centralizes all configuration for YouTube OAuth, Supabase email, encryption, rate limits, and security.
 */

import { EnvironmentConfig } from "../config/env"

export interface YouTubeOAuthConfig {
    clientId: string
    clientSecret: string
    redirectUri: string
    scopes: string[]
}

/** Supabase Auth email (configured in Supabase Dashboard SMTP settings) */
export interface EmailConfig {
    fromEmail: string
    fromName: string
}

export interface TokenEncryptionConfig {
    encryptionKey: string
    algorithm: string
}

export interface YouTubeChannelLinkingConfig {
    oauth: YouTubeOAuthConfig
    email: EmailConfig
    encryption: TokenEncryptionConfig
    rateLimit: {
        linkingAttemptsPerHour: number
        recoveryAttemptsPerDay: number
        verificationCodeAttempts: number
        unlinkAttemptsPerHour: number
    }
    security: {
        verificationCodeExpiry: number
        recoveryTokenExpiry: number
        unlinkRevocationWindow: number
        suspiciousActivityThreshold: number
    }
}

export function createYouTubeChannelLinkingConfig(
    env: EnvironmentConfig
): YouTubeChannelLinkingConfig {
    return {
        oauth: {
            clientId: env.YOUTUBE_CLIENT_ID,
            clientSecret: env.YOUTUBE_CLIENT_SECRET,
            redirectUri: env.YOUTUBE_REDIRECT_URI,
            scopes: [
                "https://www.googleapis.com/auth/youtube.readonly",
                "https://www.googleapis.com/auth/youtube.upload",
                "https://www.googleapis.com/auth/youtube",
                "https://www.googleapis.com/auth/userinfo.email",
                "https://www.googleapis.com/auth/userinfo.profile",
            ],
        },
        email: {
            fromEmail: env.EMAIL_FROM ?? env.RESEND_FROM_EMAIL ?? "noreply@gabrieltoth.com",
            fromName: env.RESEND_FROM_NAME ?? "Gabriel Toth",
        },
        encryption: {
            encryptionKey: env.TOKEN_ENCRYPTION_KEY,
            algorithm: "aes-256-gcm",
        },
        rateLimit: {
            linkingAttemptsPerHour: 5,
            recoveryAttemptsPerDay: 3,
            verificationCodeAttempts: 3,
            unlinkAttemptsPerHour: 5,
        },
        security: {
            verificationCodeExpiry: 15 * 60 * 1000,
            recoveryTokenExpiry: 24 * 60 * 60 * 1000,
            unlinkRevocationWindow: 24 * 60 * 60 * 1000,
            suspiciousActivityThreshold: 50,
        },
    }
}

export function validateYouTubeChannelLinkingConfig(
    config: YouTubeChannelLinkingConfig
): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!config.oauth.clientId) {
        errors.push("YouTube OAuth client ID is required")
    }
    if (!config.oauth.clientSecret) {
        errors.push("YouTube OAuth client secret is required")
    }
    if (!config.oauth.redirectUri) {
        errors.push("YouTube OAuth redirect URI is required")
    }

    if (!config.encryption.encryptionKey) {
        errors.push("Encryption key is required")
    }
    if (config.encryption.encryptionKey.length !== 64) {
        errors.push(
            "Encryption key must be 64 characters (32 bytes in hex format)"
        )
    }

    if (config.rateLimit.linkingAttemptsPerHour < 1) {
        errors.push("Linking attempts per hour must be at least 1")
    }
    if (config.rateLimit.recoveryAttemptsPerDay < 1) {
        errors.push("Recovery attempts per day must be at least 1")
    }
    if (config.rateLimit.verificationCodeAttempts < 1) {
        errors.push("Verification code attempts must be at least 1")
    }
    if (config.rateLimit.unlinkAttemptsPerHour < 1) {
        errors.push("Unlink attempts per hour must be at least 1")
    }

    if (config.security.verificationCodeExpiry < 60000) {
        errors.push("Verification code expiry must be at least 60000ms")
    }
    if (config.security.recoveryTokenExpiry < 3600000) {
        errors.push("Recovery token expiry must be at least 3600000ms")
    }
    if (config.security.unlinkRevocationWindow < 3600000) {
        errors.push("Unlink revocation window must be at least 3600000ms")
    }
    if (
        config.security.suspiciousActivityThreshold < 0 ||
        config.security.suspiciousActivityThreshold > 100
    ) {
        errors.push("Suspicious activity threshold must be between 0 and 100")
    }

    return {
        isValid: errors.length === 0,
        errors,
    }
}

let configInstance: YouTubeChannelLinkingConfig | null = null

export function getYouTubeChannelLinkingConfig(
    env?: EnvironmentConfig
): YouTubeChannelLinkingConfig {
    if (!configInstance) {
        if (!env) {
            throw new Error(
                "Environment configuration is required to create YouTube Channel Linking config"
            )
        }

        configInstance = createYouTubeChannelLinkingConfig(env)

        const validation = validateYouTubeChannelLinkingConfig(configInstance)
        if (!validation.isValid) {
            throw new Error(
                `Invalid YouTube Channel Linking configuration: ${validation.errors.join(", ")}`
            )
        }
    }

    return configInstance
}

export function resetYouTubeChannelLinkingConfig(): void {
    configInstance = null
}
