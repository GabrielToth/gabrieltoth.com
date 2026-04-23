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

    // Redis
    REDIS_URL: string

    // Discord
    DISCORD_WEBHOOK_URL: string

    // Docker
    HOSTNAME: string

    // YouTube OAuth
    YOUTUBE_CLIENT_ID: string
    YOUTUBE_CLIENT_SECRET: string
    YOUTUBE_REDIRECT_URI: string

    // Email Service
    SMTP_HOST: string
    SMTP_PORT: number
    SMTP_USER: string
    SMTP_PASSWORD: string
    SMTP_FROM_EMAIL: string
    SMTP_FROM_NAME: string

    // Geolocation Service
    GEOIP_SERVICE_URL: string
    GEOIP_API_KEY?: string

    // Token Encryption
    TOKEN_ENCRYPTION_KEY: string
}

/**
 * Validate and parse environment variables
 * Throws error with clear message if required variables are missing
 */
export function validateEnv(): EnvironmentConfig {
    const required = [
        "DATABASE_URL",
        "REDIS_URL",
        "DISCORD_WEBHOOK_URL",
        "YOUTUBE_CLIENT_ID",
        "YOUTUBE_CLIENT_SECRET",
        "YOUTUBE_REDIRECT_URI",
        "SMTP_HOST",
        "SMTP_PORT",
        "SMTP_USER",
        "SMTP_PASSWORD",
        "SMTP_FROM_EMAIL",
        "SMTP_FROM_NAME",
        "GEOIP_SERVICE_URL",
        "TOKEN_ENCRYPTION_KEY",
    ]

    const missing = required.filter(key => !process.env[key])

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(", ")}`
        )
    }

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
        REDIS_URL: process.env.REDIS_URL!,
        DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL!,
        HOSTNAME: process.env.HOSTNAME ?? "unknown",
        YOUTUBE_CLIENT_ID: process.env.YOUTUBE_CLIENT_ID!,
        YOUTUBE_CLIENT_SECRET: process.env.YOUTUBE_CLIENT_SECRET!,
        YOUTUBE_REDIRECT_URI: process.env.YOUTUBE_REDIRECT_URI!,
        SMTP_HOST: process.env.SMTP_HOST!,
        SMTP_PORT: parseInt(process.env.SMTP_PORT ?? "587", 10),
        SMTP_USER: process.env.SMTP_USER!,
        SMTP_PASSWORD: process.env.SMTP_PASSWORD!,
        SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL!,
        SMTP_FROM_NAME: process.env.SMTP_FROM_NAME!,
        GEOIP_SERVICE_URL: process.env.GEOIP_SERVICE_URL!,
        GEOIP_API_KEY: process.env.GEOIP_API_KEY,
        TOKEN_ENCRYPTION_KEY: process.env.TOKEN_ENCRYPTION_KEY!,
    }
}

export default validateEnv
