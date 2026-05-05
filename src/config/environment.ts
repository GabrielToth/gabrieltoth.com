/**
 * Environment Configuration Module
 * Handles environment-specific configuration for cloud and local deployments
 *
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8
 *
 * This module provides:
 * - Environment detection (cloud vs local)
 * - Database configuration (Supabase cloud, PostgreSQL local)
 * - Redis/cache configuration (Redis cloud, in-memory local)
 * - Security configuration (HTTPS, CORS, headers)
 * - Feature flags for environment-specific behavior
 */

/**
 * Environment type
 */
export type Environment = "development" | "production" | "test"

/**
 * Deployment type
 */
export type DeploymentType = "cloud" | "local"

/**
 * Environment configuration interface
 */
export interface EnvironmentConfiguration {
    // Environment
    environment: Environment
    deploymentType: DeploymentType
    isDevelopment: boolean
    isProduction: boolean
    isTest: boolean
    isCloud: boolean
    isLocal: boolean

    // Application
    appUrl: string
    apiUrl: string
    debugMode: boolean

    // Database
    database: {
        url: string
        host: string
        port: number
        user: string
        password: string
        name: string
        ssl: boolean
        connectionTimeout: number
        idleTimeout: number
    }

    // Redis/Cache
    cache: {
        enabled: boolean
        url: string
        ttl: number
        maxMemory: string
    }

    // Security
    security: {
        httpsEnforced: boolean
        secureCookies: boolean
        corsOrigins: string[]
        corsCredentials: boolean
        corsMaxAge: number
        rateLimitEnabled: boolean
        rateLimitWindow: number
        rateLimitMaxAttempts: number
    }

    // Session
    session: {
        tokenExpiration: number // milliseconds
        rememberMeExpiration: number // milliseconds
        refreshThreshold: number // milliseconds
    }

    // Logging
    logging: {
        level: "debug" | "info" | "warn" | "error"
        format: "json" | "text"
        auditLogRetention: number // days
    }
}

/**
 * Get environment configuration based on NODE_ENV and deployment type
 *
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8
 */
export function getEnvironmentConfiguration(): EnvironmentConfiguration {
    const environment = (process.env.NODE_ENV || "development") as Environment
    const isProduction = environment === "production"
    const isDevelopment = environment === "development"
    const isTest = environment === "test"

    // Determine deployment type based on environment and variables
    const deploymentType = determineDeploymentType(isProduction)
    const isCloud = deploymentType === "cloud"
    const isLocal = deploymentType === "local"

    // Get environment-specific configuration
    const config: EnvironmentConfiguration = {
        environment,
        deploymentType,
        isDevelopment,
        isProduction,
        isTest,
        isCloud,
        isLocal,

        // Application URLs
        appUrl: getAppUrl(isProduction),
        apiUrl: getApiUrl(isProduction),
        debugMode: process.env.DEBUG === "true",

        // Database configuration
        database: getDatabaseConfiguration(isCloud),

        // Cache configuration
        cache: getCacheConfiguration(isCloud),

        // Security configuration
        security: getSecurityConfiguration(isProduction),

        // Session configuration
        session: getSessionConfiguration(),

        // Logging configuration
        logging: getLoggingConfiguration(isDevelopment),
    }

    return config
}

/**
 * Determine deployment type (cloud vs local)
 */
function determineDeploymentType(isProduction: boolean): DeploymentType {
    // If in production, assume cloud deployment
    if (isProduction) {
        return "cloud"
    }

    // Check for explicit deployment type
    const deploymentType = process.env.DEPLOYMENT_TYPE
    if (deploymentType === "cloud" || deploymentType === "local") {
        return deploymentType
    }

    // Default to local for development
    return "local"
}

/**
 * Get application URL based on environment
 */
function getAppUrl(isProduction: boolean): string {
    if (isProduction) {
        return process.env.NEXT_PUBLIC_APP_URL || "https://gabrieltoth.com"
    }

    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
}

/**
 * Get API URL based on environment
 */
function getApiUrl(isProduction: boolean): string {
    if (isProduction) {
        return process.env.NEXT_PUBLIC_API_URL || "https://gabrieltoth.com/api"
    }

    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
}

/**
 * Get database configuration based on deployment type
 *
 * Cloud: Supabase PostgreSQL
 * Local: Local PostgreSQL or SQLite
 */
function getDatabaseConfiguration(
    isCloud: boolean
): EnvironmentConfiguration["database"] {
    if (isCloud) {
        // Cloud deployment uses Supabase
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        if (!supabaseUrl) {
            throw new Error(
                "NEXT_PUBLIC_SUPABASE_URL is required for cloud deployment"
            )
        }

        // Use DATABASE_URL if provided, otherwise use Supabase URL
        const databaseUrl = process.env.DATABASE_URL || supabaseUrl

        return {
            url: databaseUrl,
            host: new URL(supabaseUrl).hostname,
            port: 5432,
            user: process.env.POSTGRES_USER || "postgres",
            password: process.env.POSTGRES_PASSWORD || "",
            name: process.env.POSTGRES_DB || "postgres",
            ssl: true,
            connectionTimeout: 10000,
            idleTimeout: 30000,
        }
    }

    // Local deployment uses local PostgreSQL
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
        throw new Error("DATABASE_URL is required for local deployment")
    }

    try {
        const url = new URL(databaseUrl)
        return {
            url: databaseUrl,
            host: url.hostname || "localhost",
            port: parseInt(url.port || "5432", 10),
            user: url.username || "postgres",
            password: url.password || "",
            name: url.pathname?.slice(1) || "postgres",
            ssl: false,
            connectionTimeout: 10000,
            idleTimeout: 30000,
        }
    } catch {
        throw new Error(`Invalid DATABASE_URL format: ${databaseUrl}`)
    }
}

/**
 * Get cache configuration based on deployment type
 *
 * Cloud: Redis (Upstash or similar)
 * Local: In-memory cache or local Redis
 */
function getCacheConfiguration(
    isCloud: boolean
): EnvironmentConfiguration["cache"] {
    const cacheEnabled = process.env.CACHE_ENABLED !== "false"

    if (isCloud) {
        // Cloud deployment uses Redis
        const redisUrl = process.env.REDIS_URL
        if (!redisUrl && cacheEnabled) {
            console.warn(
                "REDIS_URL not configured for cloud deployment, caching disabled"
            )
            return {
                enabled: false,
                url: "",
                ttl: 3600,
                maxMemory: "256mb",
            }
        }

        return {
            enabled: cacheEnabled && !!redisUrl,
            url: redisUrl || "",
            ttl: parseInt(process.env.CACHE_TTL || "3600", 10),
            maxMemory: process.env.CACHE_MAX_MEMORY || "256mb",
        }
    }

    // Local deployment can use Redis or in-memory
    const redisUrl = process.env.REDIS_URL
    const useRedis = redisUrl && process.env.USE_REDIS !== "false"

    return {
        enabled: cacheEnabled,
        url: useRedis ? redisUrl : "",
        ttl: parseInt(process.env.CACHE_TTL || "3600", 10),
        maxMemory: process.env.CACHE_MAX_MEMORY || "256mb",
    }
}

/**
 * Get security configuration based on environment
 *
 * Production: HTTPS enforced, secure cookies, strict CORS
 * Development: HTTPS optional, flexible CORS
 */
function getSecurityConfiguration(
    isProduction: boolean
): EnvironmentConfiguration["security"] {
    return {
        // HTTPS enforcement (Requirement 22.6)
        httpsEnforced: isProduction,

        // Secure cookies (Requirement 22.5)
        secureCookies: isProduction,

        // CORS configuration (Requirement 22.7)
        corsOrigins: getCorsOrigins(isProduction),
        corsCredentials: true,
        corsMaxAge: 86400, // 24 hours

        // Rate limiting (Requirement 5)
        rateLimitEnabled: true,
        rateLimitWindow: 3600000, // 1 hour
        rateLimitMaxAttempts: 5,
    }
}

/**
 * Get CORS origins based on environment
 */
function getCorsOrigins(isProduction: boolean): string[] {
    if (isProduction) {
        // Production: only allow specific domains
        return ["https://gabrieltoth.com", "https://www.gabrieltoth.com"]
    }

    // Development: allow localhost and common dev URLs
    return [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]
}

/**
 * Get session configuration
 */
function getSessionConfiguration(): EnvironmentConfiguration["session"] {
    return {
        // Session token expiration: 1 hour (Requirement 8)
        tokenExpiration: 60 * 60 * 1000,

        // Remember Me token expiration: 30 days (Requirement 7)
        rememberMeExpiration: 30 * 24 * 60 * 60 * 1000,

        // Refresh threshold: 5 minutes before expiration
        refreshThreshold: 5 * 60 * 1000,
    }
}

/**
 * Get logging configuration
 */
function getLoggingConfiguration(
    isDevelopment: boolean
): EnvironmentConfiguration["logging"] {
    return {
        level: isDevelopment ? "debug" : "info",
        format: isDevelopment ? "text" : "json",
        auditLogRetention: 90, // 90+ days (Requirement 6.8)
    }
}

/**
 * Validate environment configuration
 * Throws error if required variables are missing
 */
export function validateEnvironmentConfiguration(): void {
    const config = getEnvironmentConfiguration()

    // Validate database configuration
    if (!config.database.url) {
        throw new Error("Database URL is not configured")
    }

    // Validate cache configuration for cloud
    if (config.isCloud && !config.cache.url) {
        console.warn("Redis URL not configured for cloud deployment")
    }

    // Validate CORS origins
    if (config.security.corsOrigins.length === 0) {
        throw new Error("CORS origins are not configured")
    }
}

/**
 * Get environment configuration (singleton)
 */
let cachedConfig: EnvironmentConfiguration | null = null

export function getConfig(): EnvironmentConfiguration {
    if (!cachedConfig) {
        cachedConfig = getEnvironmentConfiguration()
        validateEnvironmentConfiguration()
    }

    return cachedConfig
}

/**
 * Reset cached configuration (useful for testing)
 */
export function resetConfig(): void {
    cachedConfig = null
}

/**
 * Export default configuration
 */
export default getConfig()
