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
}

/**
 * Validate and parse environment variables
 * Throws error with clear message if required variables are missing
 */
export function validateEnv(): EnvironmentConfig {
    const required = ["DATABASE_URL", "REDIS_URL", "DISCORD_WEBHOOK_URL"]

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
    }
}

export default validateEnv
