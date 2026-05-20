/**
 * Environment configuration (cloud vs local inferred from NODE_ENV).
 */

import {
    deriveApiUrl,
    getApiUrl as getValidatedApiUrl,
    getAppUrl as getValidatedAppUrl,
    isDebugEnabled,
} from "@/lib/config/env-validation"

export type Environment = "development" | "production" | "test"
export type DeploymentType = "cloud" | "local"

export interface EnvironmentConfiguration {
    environment: Environment
    deploymentType: DeploymentType
    isDevelopment: boolean
    isProduction: boolean
    isTest: boolean
    isCloud: boolean
    isLocal: boolean
    appUrl: string
    apiUrl: string
    debugMode: boolean
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
    cache: {
        enabled: boolean
        url: string
        ttl: number
        maxMemory: string
    }
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
    session: {
        tokenExpiration: number
        rememberMeExpiration: number
        refreshThreshold: number
    }
    logging: {
        level: "debug" | "info" | "warn" | "error"
        format: "json" | "text"
        auditLogRetention: number
    }
}

export function getEnvironmentConfiguration(): EnvironmentConfiguration {
    const environment = (process.env.NODE_ENV || "development") as Environment
    const isProduction = environment === "production"
    const isDevelopment = environment === "development"
    const isTest = environment === "test"
    const isCloud = isProduction
    const isLocal = !isProduction

    const appUrl = isTest
        ? process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
          "http://localhost:3000"
        : getValidatedAppUrl()
    const apiUrl = isTest ? deriveApiUrl(appUrl) : getValidatedApiUrl()

    return {
        environment,
        deploymentType: isCloud ? "cloud" : "local",
        isDevelopment,
        isProduction,
        isTest,
        isCloud,
        isLocal,
        appUrl,
        apiUrl,
        debugMode: isDebugEnabled(),
        database: getDatabaseConfiguration(isCloud),
        cache: getCacheConfiguration(isCloud),
        security: getSecurityConfiguration(isProduction, appUrl),
        session: getSessionConfiguration(),
        logging: getLoggingConfiguration(isDevelopment),
    }
}

function getDatabaseConfiguration(
    isCloud: boolean
): EnvironmentConfiguration["database"] {
    if (isCloud) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        if (!supabaseUrl) {
            throw new Error(
                "NEXT_PUBLIC_SUPABASE_URL is required for production"
            )
        }
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

    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
        throw new Error("DATABASE_URL is required for local development")
    }

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
}

function getCacheConfiguration(
    isCloud: boolean
): EnvironmentConfiguration["cache"] {
    const cacheEnabled = process.env.CACHE_ENABLED !== "false"
    const redisUrl = process.env.REDIS_URL

    if (isCloud && !redisUrl && cacheEnabled) {
        return {
            enabled: false,
            url: "",
            ttl: parseInt(process.env.CACHE_TTL || "3600", 10),
            maxMemory: process.env.CACHE_MAX_MEMORY || "256mb",
        }
    }

    const useRedis = Boolean(redisUrl && process.env.USE_REDIS !== "false")
    return {
        enabled: cacheEnabled && (isCloud ? useRedis : true),
        url: useRedis ? redisUrl! : "",
        ttl: parseInt(process.env.CACHE_TTL || "3600", 10),
        maxMemory: process.env.CACHE_MAX_MEMORY || "256mb",
    }
}

function getSecurityConfiguration(
    isProduction: boolean,
    appUrl: string
): EnvironmentConfiguration["security"] {
    return {
        httpsEnforced: isProduction,
        secureCookies: isProduction,
        corsOrigins: getCorsOrigins(isProduction, appUrl),
        corsCredentials: true,
        corsMaxAge: 86400,
        rateLimitEnabled: true,
        rateLimitWindow: 3600000,
        rateLimitMaxAttempts: 5,
    }
}

function getCorsOrigins(isProduction: boolean, appUrl: string): string[] {
    if (!isProduction) {
        return [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
        ]
    }

    const origins = new Set<string>()
    try {
        const parsed = new URL(appUrl)
        origins.add(parsed.origin)
        if (parsed.hostname.startsWith("www.")) {
            origins.add(
                `${parsed.protocol}//${parsed.hostname.slice(4)}${parsed.port ? `:${parsed.port}` : ""}`
            )
        } else {
            origins.add(
                `${parsed.protocol}//www.${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""}`
            )
        }
    } catch {
        throw new Error(`Invalid NEXT_PUBLIC_APP_URL: ${appUrl}`)
    }
    return [...origins]
}

function getSessionConfiguration(): EnvironmentConfiguration["session"] {
    return {
        tokenExpiration: 60 * 60 * 1000,
        rememberMeExpiration: 30 * 24 * 60 * 60 * 1000,
        refreshThreshold: 5 * 60 * 1000,
    }
}

function getLoggingConfiguration(
    isDevelopment: boolean
): EnvironmentConfiguration["logging"] {
    return {
        level: isDevelopment ? "debug" : "info",
        format: isDevelopment ? "text" : "json",
        auditLogRetention: 90,
    }
}

export function validateEnvironmentConfiguration(): void {
    const config = getEnvironmentConfiguration()
    if (!config.database.url) {
        throw new Error("Database URL is not configured")
    }
    if (config.security.corsOrigins.length === 0) {
        throw new Error("CORS origins are not configured")
    }
}

let cachedConfig: EnvironmentConfiguration | null = null

export function getConfig(): EnvironmentConfiguration {
    if (!cachedConfig) {
        cachedConfig = getEnvironmentConfiguration()
        validateEnvironmentConfiguration()
    }
    return cachedConfig
}

export function resetConfig(): void {
    cachedConfig = null
}

export default getConfig
