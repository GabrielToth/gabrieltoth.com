/**
 * Module: Configuration Manager for Password Security
 * Purpose: Load, validate, and manage Argon2id security parameters from environment
 *
 * This module handles:
 * - Loading Argon2id parameters (memory, time, parallelism) from environment
 * - Loading and validating pepper secret with fail-secure behavior
 * - Caching configuration once at startup in memory
 * - Providing access to cached configuration at runtime
 * - Comprehensive validation with clear error messages
 *
 * Requirements covered:
 * - Requirement 4: Configuration Manager (4.1-4.6)
 * - Requirement 3: Pepper loading and validation (3.2, 3.3)
 * - Requirement 12: Configuration management (12.1-12.6)
 * - Requirement 16: Compatibility with multiple environments (16.1-16.9)
 */

import type {
    Argon2Params,
    RateLimitingConfig,
    SecurityConfig,
    ValidationError,
} from "./types"

/**
 * Argon2id Configuration Constraints
 * These ensure security while fitting within Vercel Free Plan constraints
 *
 * Memory: 16-256 MB (64 MB default tuned for Vercel Free)
 * Time: 2-10 iterations (3 default balances security and speed)
 * Parallelism: 1-4 threads (2 default maximizes per-thread work)
 */
const ARGON2_CONSTRAINTS = {
    memory: { min: 16, max: 256, default: 64 }, // MB
    time: { min: 2, max: 10, default: 3 }, // iterations
    parallelism: { min: 1, max: 4, default: 2 }, // threads
} as const

/**
 * Rate Limiting Defaults
 * Controls authentication attempt limits and CAPTCHA escalation
 */
const RATE_LIMITING_DEFAULTS = {
    failureThreshold: 5, // Lock after 5 failed attempts
    windowMinutes: 15, // Within 15 minute window
    lockoutMinutes: 15, // Locked for 15 minutes
    captchaEscalationThreshold: 3, // Escalate CAPTCHA after 3 failures
} as const

/**
 * ConfigurationManager
 *
 * Singleton class that manages password security configuration.
 * Loads configuration from environment variables at startup and caches it.
 * Fails securely if critical configuration (pepper) is missing.
 *
 * Usage:
 *   const manager = ConfigurationManager.getInstance()
 *   const config = manager.getConfig()
 */
export class ConfigurationManager {
    private static instance: ConfigurationManager | null = null

    private config: SecurityConfig | null = null

    private constructor() {
        // Private constructor to enforce singleton pattern
    }

    /**
     * Get or create singleton instance
     * Loads configuration on first call
     */
    public static getInstance(): ConfigurationManager {
        if (!ConfigurationManager.instance) {
            ConfigurationManager.instance = new ConfigurationManager()
            ConfigurationManager.instance.loadConfiguration()
        }
        return ConfigurationManager.instance
    }

    /**
     * Load configuration from environment variables at startup
     *
     * This is called automatically on first getInstance() call.
     * Throws error if configuration is invalid (fail-secure).
     * Logs configuration details (excluding secrets).
     *
     * @throws Error if configuration is invalid or pepper is missing
     */
    private loadConfiguration(): void {
        try {
            // Load all configuration components
            const argon2id = this.loadArgon2idParams()
            const pepper = this.loadPepperSecret()
            const rateLimiting = this.loadRateLimitingConfig()
            const captchaProvider = (process.env.CAPTCHA_PROVIDER ||
                "cloudflare") as "cloudflare" | "google"

            this.config = {
                argon2id,
                pepper,
                rateLimiting,
                captchaProvider,
            }

            // Log configuration (excluding secrets)
            console.log("✅ Security configuration loaded successfully:", {
                argon2id,
                pepper: "<secret>",
                rateLimiting,
                captchaProvider,
            })
        } catch (error) {
            console.error("❌ Failed to load security configuration:", error)
            throw error
        }
    }

    /**
     * Get cached configuration
     *
     * Returns the configuration that was loaded at startup.
     * Safe to call multiple times - returns cached instance.
     *
     * @returns Cached security configuration
     * @throws Error if called before configuration is loaded
     */
    public getConfig(): SecurityConfig {
        if (!this.config) {
            throw new Error(
                "Configuration not loaded. Call getInstance() first."
            )
        }
        return this.config
    }

    /**
     * Get Argon2id parameters
     */
    public getArgon2Params(): Argon2Params {
        return this.getConfig().argon2id
    }

    /**
     * Get pepper secret (cached in memory)
     *
     * Pepper is loaded once at startup and cached.
     * Never make repeated environment variable lookups.
     */
    public getPepper(): string {
        return this.getConfig().pepper
    }

    /**
     * Get rate limiting configuration
     */
    public getRateLimitingConfig(): RateLimitingConfig {
        return this.getConfig().rateLimiting
    }

    /**
     * Get CAPTCHA provider
     */
    public getCaptchaProvider(): "cloudflare" | "google" {
        return this.getConfig().captchaProvider
    }

    /**
     * Load and validate Argon2id parameters from environment
     * Falls back to defaults if environment variables not set
     *
     * @returns Validated Argon2id parameters
     * @throws Error if any parameter is outside constraints
     */
    private loadArgon2idParams(): Argon2Params {
        const memory = parseInt(
            process.env.ARGON2_MEMORY_COST ||
                String(ARGON2_CONSTRAINTS.memory.default),
            10
        )
        const time = parseInt(
            process.env.ARGON2_TIME_COST ||
                String(ARGON2_CONSTRAINTS.time.default),
            10
        )
        const parallelism = parseInt(
            process.env.ARGON2_PARALLELISM ||
                String(ARGON2_CONSTRAINTS.parallelism.default),
            10
        )

        // Validate all parameters
        const errors = this.validateArgon2idParams({
            memory,
            time,
            parallelism,
        })
        if (errors.length > 0) {
            const errorMessages = errors
                .map(e => `  - ${e.field}: ${e.message}`)
                .join("\n")
            throw new Error(`Invalid Argon2id configuration:\n${errorMessages}`)
        }

        return { memory, time, parallelism }
    }

    /**
     * Load and validate pepper secret
     *
     * Pepper is a server-side constant appended to passwords before hashing.
     * Critical security requirement that must be configured.
     *
     * Validation rules:
     * - Must be set in environment (PEPPER_SECRET)
     * - Must be at least 32 characters
     * - Production must not use development value
     *
     * @returns Validated pepper secret
     * @throws Error if pepper is not configured or invalid (fail-secure)
     */
    private loadPepperSecret(): string {
        const pepper = process.env.PEPPER_SECRET

        // FAIL-SECURE: Refuse to operate without pepper
        if (!pepper) {
            throw new Error(
                "PEPPER_SECRET environment variable is not configured.\n\n" +
                    "This is a CRITICAL SECURITY REQUIREMENT.\n\n" +
                    "Action required:\n" +
                    "1. Generate pepper: openssl rand -hex 32\n" +
                    "2. Set PEPPER_SECRET environment variable\n" +
                    "3. In Docker: Add to docker-compose.yml\n" +
                    "4. In Vercel: Add to Environment Variables\n\n" +
                    "Without pepper, the system cannot operate securely."
            )
        }

        if (pepper.length < 32) {
            throw new Error(
                `PEPPER_SECRET is too short (${pepper.length} characters).\n\n` +
                    "Minimum 32 characters required for security.\n\n" +
                    "Generate new pepper with: openssl rand -hex 32"
            )
        }

        // Warn if using development pepper in production
        if (
            pepper ===
            "dev-pepper-test-very-long-string-32chars-minimum-required!"
        ) {
            // Check if this is actually a Vercel production deployment
            // (not just a local build with NODE_ENV=production)
            const isVercelProduction =
                process.env.VERCEL_ENV === "production" ||
                (process.env.NODE_ENV === "production" &&
                    process.env.VERCEL === "1")

            if (isVercelProduction) {
                throw new Error(
                    "PEPPER_SECRET is using development value in production!\n\n" +
                        "This is a CRITICAL SECURITY ISSUE.\n\n" +
                        "Action required:\n" +
                        "1. Generate new production pepper: openssl rand -hex 32\n" +
                        "2. Set PEPPER_SECRET in Vercel Environment Variables\n" +
                        "3. Redeploy\n\n" +
                        "Using development pepper in production undermines security."
                )
            }
            console.warn(
                "⚠️  WARNING: Using development pepper. Change this in production!"
            )
        }

        return pepper
    }

    /**
     * Load rate limiting configuration
     * Falls back to defaults if environment variables not set
     */
    private loadRateLimitingConfig(): RateLimitingConfig {
        return {
            failureThreshold: parseInt(
                process.env.RATE_LIMIT_FAILURE_THRESHOLD ||
                    String(RATE_LIMITING_DEFAULTS.failureThreshold),
                10
            ),
            windowMinutes: parseInt(
                process.env.RATE_LIMIT_WINDOW_MINUTES ||
                    String(RATE_LIMITING_DEFAULTS.windowMinutes),
                10
            ),
            lockoutMinutes: parseInt(
                process.env.RATE_LIMIT_LOCKOUT_MINUTES ||
                    String(RATE_LIMITING_DEFAULTS.lockoutMinutes),
                10
            ),
            captchaEscalationThreshold: parseInt(
                process.env.RATE_LIMIT_CAPTCHA_ESCALATION_THRESHOLD ||
                    String(RATE_LIMITING_DEFAULTS.captchaEscalationThreshold),
                10
            ),
        }
    }

    /**
     * Validate Argon2id parameters against constraints
     *
     * @param params Parameters to validate
     * @returns Array of validation error messages (empty if valid)
     */
    private validateArgon2idParams(
        params: Partial<Argon2Params>
    ): ValidationError[] {
        const errors: ValidationError[] = []

        if (params.memory !== undefined) {
            if (isNaN(params.memory)) {
                errors.push({
                    field: "ARGON2_MEMORY_COST",
                    message: "Must be a valid number",
                    value: process.env.ARGON2_MEMORY_COST,
                })
            } else if (
                params.memory < ARGON2_CONSTRAINTS.memory.min ||
                params.memory > ARGON2_CONSTRAINTS.memory.max
            ) {
                errors.push({
                    field: "ARGON2_MEMORY_COST",
                    message: `Must be between ${ARGON2_CONSTRAINTS.memory.min} and ${ARGON2_CONSTRAINTS.memory.max} MB`,
                    value: params.memory,
                })
            }
        }

        if (params.time !== undefined) {
            if (isNaN(params.time)) {
                errors.push({
                    field: "ARGON2_TIME_COST",
                    message: "Must be a valid number",
                    value: process.env.ARGON2_TIME_COST,
                })
            } else if (
                params.time < ARGON2_CONSTRAINTS.time.min ||
                params.time > ARGON2_CONSTRAINTS.time.max
            ) {
                errors.push({
                    field: "ARGON2_TIME_COST",
                    message: `Must be between ${ARGON2_CONSTRAINTS.time.min} and ${ARGON2_CONSTRAINTS.time.max} iterations`,
                    value: params.time,
                })
            }
        }

        if (params.parallelism !== undefined) {
            if (isNaN(params.parallelism)) {
                errors.push({
                    field: "ARGON2_PARALLELISM",
                    message: "Must be a valid number",
                    value: process.env.ARGON2_PARALLELISM,
                })
            } else if (
                params.parallelism < ARGON2_CONSTRAINTS.parallelism.min ||
                params.parallelism > ARGON2_CONSTRAINTS.parallelism.max
            ) {
                errors.push({
                    field: "ARGON2_PARALLELISM",
                    message: `Must be between ${ARGON2_CONSTRAINTS.parallelism.min} and ${ARGON2_CONSTRAINTS.parallelism.max} threads`,
                    value: params.parallelism,
                })
            }
        }

        return errors
    }
}

/**
 * Create singleton instance and return configuration
 * Convenience function for quick access
 *
 * @returns Cached security configuration
 * @throws Error if configuration is invalid
 */
export function getSecurityConfig(): SecurityConfig {
    return ConfigurationManager.getInstance().getConfig()
}

/**
 * Export configuration constraints and defaults for use in other modules
 */
export { ARGON2_CONSTRAINTS, RATE_LIMITING_DEFAULTS }
