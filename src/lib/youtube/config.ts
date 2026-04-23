/**
 * YouTube Channel Linking Service Configuration
 * Centralizes all configuration for YouTube OAuth, email, and geolocation services
 * Validates: Requirements 1.1
 */

import { EnvironmentConfig } from "../config/env"

/**
 * YouTube OAuth configuration
 */
export interface YouTubeOAuthConfig {
    clientId: string
    clientSecret: string
    redirectUri: string
    scopes: string[]
}

/**
 * Email service configuration
 */
export interface EmailServiceConfig {
    host: string
    port: number
    user: string
    password: string
    fromEmail: string
    fromName: string
    tls: boolean
}

/**
 * Geolocation service configuration
 */
export interface GeolocationServiceConfig {
    serviceUrl: string
    apiKey?: string
    timeout: number
    retries: number
}

/**
 * Token encryption configuration
 */
export interface TokenEncryptionConfig {
    encryptionKey: string
    algorithm: string
}

/**
 * Complete YouTube Channel Linking service configuration
 */
export interface YouTubeChannelLinkingConfig {
    oauth: YouTubeOAuthConfig
    email: EmailServiceConfig
    geolocation: GeolocationServiceConfig
    encryption: TokenEncryptionConfig
    rateLimit: {
        linkingAttemptsPerHour: number
        recoveryAttemptsPerDay: number
        verificationCodeAttempts: number
        unlinkAttemptsPerHour: number
    }
    security: {
        verificationCodeExpiry: number // milliseconds
        recoveryTokenExpiry: number // milliseconds
        unlinkRevocationWindow: number // milliseconds
        suspiciousActivityThreshold: number // percentage difference
    }
}

/**
 * Create YouTube Channel Linking configuration from environment variables
 */
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
                "https://www.googleapis.com/auth/userinfo.email",
                "https://www.googleapis.com/auth/userinfo.profile",
            ],
        },
        email: {
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            user: env.SMTP_USER,
            password: env.SMTP_PASSWORD,
            fromEmail: env.SMTP_FROM_EMAIL,
            fromName: env.SMTP_FROM_NAME,
            tls: env.SMTP_PORT === 587,
        },
        geolocation: {
            serviceUrl: env.GEOIP_SERVICE_URL,
            apiKey: env.GEOIP_API_KEY,
            timeout: 5000, // 5 seconds
            retries: 3,
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
            verificationCodeExpiry: 15 * 60 * 1000, // 15 minutes
            recoveryTokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
            unlinkRevocationWindow: 24 * 60 * 60 * 1000, // 24 hours
            suspiciousActivityThreshold: 50, // 50% difference in IP/location/device
        },
    }
}

/**
 * Validate YouTube Channel Linking configuration
 */
export function validateYouTubeChannelLinkingConfig(
    config: YouTubeChannelLinkingConfig
): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate OAuth config
    if (!config.oauth.clientId) {
        errors.push("YouTube OAuth client ID is required")
    }
    if (!config.oauth.clientSecret) {
        errors.push("YouTube OAuth client secret is required")
    }
    if (!config.oauth.redirectUri) {
        errors.push("YouTube OAuth redirect URI is required")
    }

    // Validate email config
    if (!config.email.host) {
        errors.push("Email service host is required")
    }
    if (config.email.port < 1 || config.email.port > 65535) {
        errors.push("Email service port must be between 1 and 65535")
    }
    if (!config.email.user) {
        errors.push("Email service user is required")
    }
    if (!config.email.password) {
        errors.push("Email service password is required")
    }
    if (!config.email.fromEmail) {
        errors.push("Email from address is required")
    }

    // Validate geolocation config
    if (!config.geolocation.serviceUrl) {
        errors.push("Geolocation service URL is required")
    }
    if (config.geolocation.timeout < 1000) {
        errors.push("Geolocation timeout must be at least 1000ms")
    }
    if (config.geolocation.retries < 0) {
        errors.push("Geolocation retries must be non-negative")
    }

    // Validate encryption config
    if (!config.encryption.encryptionKey) {
        errors.push("Encryption key is required")
    }
    if (config.encryption.encryptionKey.length !== 64) {
        errors.push(
            "Encryption key must be 64 characters (32 bytes in hex format)"
        )
    }

    // Validate rate limiting config
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

    // Validate security config
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

/**
 * Create a singleton configuration instance
 */
let configInstance: YouTubeChannelLinkingConfig | null = null

/**
 * Get or create the YouTube Channel Linking configuration
 */
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

        // Validate configuration
        const validation = validateYouTubeChannelLinkingConfig(configInstance)
        if (!validation.isValid) {
            throw new Error(
                `Invalid YouTube Channel Linking configuration: ${validation.errors.join(", ")}`
            )
        }
    }

    return configInstance
}

/**
 * Reset the configuration (useful for testing)
 */
export function resetYouTubeChannelLinkingConfig(): void {
    configInstance = null
}
