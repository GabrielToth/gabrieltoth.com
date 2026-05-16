/**
 * Type Definitions: Password Security Configuration
 * Purpose: Define types for Argon2id parameters, security configuration, and validation
 *
 * Exports:
 * - Argon2Params: Memory cost, time cost, parallelism for Argon2id
 * - RateLimitingConfig: Rate limiting thresholds and windows
 * - SecurityConfig: Complete security configuration object
 * - ValidationError: Error details for configuration validation
 * - HashResult: Result of password hashing operation
 */

/**
 * Argon2id hashing parameters
 * These control the security vs performance tradeoff for password hashing
 */
export interface Argon2Params {
    /** Memory cost in MB (16-256). Default: 64. Tuned for Vercel Free Plan. */
    memory: number

    /** Time cost in iterations (2-10). Default: 3. Controls CPU work factor. */
    time: number

    /** Parallelism in threads (1-4). Default: 2. Controls memory-hard property. */
    parallelism: number
}

/**
 * Rate limiting configuration
 * Controls account lockout and CAPTCHA escalation behavior
 */
export interface RateLimitingConfig {
    /** Number of failed attempts before lockout. Default: 5. */
    failureThreshold: number

    /** Time window for counting failures in minutes. Default: 15. */
    windowMinutes: number

    /** How long to lock the account in minutes. Default: 15. */
    lockoutMinutes: number

    /** Failed attempts before escalating to CAPTCHA. Default: 3. */
    captchaEscalationThreshold: number
}

/**
 * Complete security configuration
 * Loaded at application startup and cached in memory
 */
export interface SecurityConfig {
    /** Argon2id parameters (memory, time, parallelism) */
    argon2id: Argon2Params

    /** Pepper secret (server-side constant appended to passwords) */
    pepper: string

    /** Rate limiting configuration */
    rateLimiting: RateLimitingConfig

    /** CAPTCHA provider (cloudflare or google) */
    captchaProvider: "cloudflare" | "google"
}

/**
 * Configuration validation error
 */
export interface ValidationError {
    field: string
    message: string
    value?: unknown
}

/**
 * Configuration loading result (success or failure)
 */
export interface ConfigurationLoadResult {
    success: boolean
    config?: SecurityConfig
    errors?: ValidationError[]
}

/**
 * Hash result with metadata
 * Returned from password hashing operations
 */
export interface HashResult {
    /** The Argon2id hash string (includes salt and parameters) */
    hash: string

    /** Algorithm type for migration tracking */
    algorithm: "argon2id"

    /** Time taken to generate hash in milliseconds */
    timeTakenMs: number

    /** Whether hash generation exceeded warning threshold */
    performanceWarning: boolean
}
