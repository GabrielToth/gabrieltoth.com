/**
 * Module: Configuration and Parameter Logging
 * Purpose: Log Argon2id parameters and security configuration on application startup
 *
 * This module handles:
 * - Logging Argon2id parameters (memory, time, parallelism) on startup
 * - Logging pepper presence (not the actual value)
 * - Logging CAPTCHA provider configuration
 * - Logging rate limiting configuration
 * - Excluding sensitive data from logs
 * - Providing audit trail for security configuration
 *
 * Requirements covered:
 * - Requirement 14.3: Log password hashing parameters on startup
 * - Requirement 14.5: Logs SHALL NOT contain plaintext passwords, pepper values, or sensitive data
 *
 * Usage:
 *   import { logConfigurationOnStartup } from '@/lib/auth/password-security/configuration-logging'
 *
 *   // Call during application startup
 *   await logConfigurationOnStartup()
 */

import { createLogger } from "@/lib/logger"
import { ConfigurationManager } from "./config"
import type { RateLimitingConfig } from "./types"

const logger = createLogger("ConfigurationLogging")

/**
 * Configuration log entry for audit trail
 */
export interface ConfigurationLogEntry {
    timestamp: Date
    argon2id: {
        memory: number
        time: number
        parallelism: number
    }
    pepper: {
        configured: boolean
        length?: number
    }
    rateLimiting: RateLimitingConfig
    captchaProvider: "cloudflare" | "google"
    environment: string
}

/**
 * Log configuration and security parameters on application startup
 *
 * Requirement 14.3: Log Argon2id parameters on startup
 * Requirement 14.5: Exclude sensitive data from logs (pepper value is never logged)
 *
 * This function:
 * 1. Retrieves configuration from ConfigurationManager
 * 2. Creates a safe log entry (excluding pepper value)
 * 3. Logs to console and audit system
 * 4. Returns the log entry for verification
 *
 * @returns Promise<ConfigurationLogEntry> - The logged configuration entry
 * @throws Error if configuration is not loaded
 *
 * @example
 * ```typescript
 * // During application startup
 * try {
 *   const logEntry = await logConfigurationOnStartup()
 *   console.log('Configuration logged:', logEntry)
 * } catch (error) {
 *   console.error('Failed to log configuration:', error)
 *   process.exit(1)
 * }
 * ```
 */
export async function logConfigurationOnStartup(): Promise<ConfigurationLogEntry> {
    try {
        // Get configuration from singleton manager
        const configManager = ConfigurationManager.getInstance()
        const config = configManager.getConfig()

        // Create safe log entry (pepper value is NEVER included)
        const logEntry: ConfigurationLogEntry = {
            timestamp: new Date(),
            argon2id: config.argon2id,
            pepper: {
                configured: !!config.pepper,
                length: config.pepper ? config.pepper.length : undefined,
            },
            rateLimiting: config.rateLimiting,
            captchaProvider: config.captchaProvider,
            environment: process.env.NODE_ENV || "development",
        }

        // Log to console with formatted output
        logger.info("🔐 Password Security Configuration Loaded", {
            argon2id: {
                memory: `${config.argon2id.memory} MB`,
                time: `${config.argon2id.time} iterations`,
                parallelism: `${config.argon2id.parallelism} threads`,
            },
            pepper: {
                configured: logEntry.pepper.configured,
                length: logEntry.pepper.length,
            },
            rateLimiting: {
                failureThreshold: `${config.rateLimiting.failureThreshold} attempts`,
                windowMinutes: `${config.rateLimiting.windowMinutes} minutes`,
                lockoutMinutes: `${config.rateLimiting.lockoutMinutes} minutes`,
                captchaEscalationThreshold: `${config.rateLimiting.captchaEscalationThreshold} attempts`,
            },
            captchaProvider: config.captchaProvider,
            environment: logEntry.environment,
        })

        // Log to audit system
        await logConfigurationToAudit(logEntry)

        return logEntry
    } catch (error) {
        logger.error(
            "❌ Failed to log configuration on startup",
            error instanceof Error ? error : new Error(String(error))
        )
        throw error
    }
}

/**
 * Log configuration to audit system
 *
 * This creates an audit trail entry for configuration changes.
 * Useful for compliance and security monitoring.
 *
 * @param entry - The configuration log entry
 */
async function logConfigurationToAudit(
    entry: ConfigurationLogEntry
): Promise<void> {
    try {
        // In a real system, this would write to an audit database
        // For now, we just log to console
        logger.info("📋 Configuration Audit Entry", {
            event_type: "configuration_loaded",
            timestamp: entry.timestamp.toISOString(),
            argon2id: entry.argon2id,
            pepper_configured: entry.pepper.configured,
            pepper_length: entry.pepper.length,
            rate_limiting: entry.rateLimiting,
            captcha_provider: entry.captchaProvider,
            environment: entry.environment,
        })
    } catch (error) {
        logger.error(
            "Failed to write configuration to audit system",
            error instanceof Error ? error : new Error(String(error))
        )
        // Don't throw - audit logging failure shouldn't block startup
    }
}

/**
 * Get a formatted string representation of configuration for display
 *
 * Useful for debugging and verification.
 * Pepper value is NEVER included in output.
 *
 * @returns Formatted configuration string
 */
export function getConfigurationSummary(): string {
    try {
        const configManager = ConfigurationManager.getInstance()
        const config = configManager.getConfig()

        return `
╔════════════════════════════════════════════════════════════╗
║         Password Security Configuration Summary            ║
╠════════════════════════════════════════════════════════════╣
║ Argon2id Parameters:                                       ║
║   • Memory Cost:     ${String(config.argon2id.memory).padEnd(6)} MB                    ║
║   • Time Cost:       ${String(config.argon2id.time).padEnd(6)} iterations              ║
║   • Parallelism:     ${String(config.argon2id.parallelism).padEnd(6)} threads                ║
║                                                            ║
║ Pepper Security:                                           ║
║   • Configured:      ${String(config.pepper ? "✓ Yes" : "✗ No").padEnd(6)}                    ║
║   • Length:          ${String(config.pepper?.length || 0).padEnd(6)} characters              ║
║                                                            ║
║ Rate Limiting:                                             ║
║   • Failure Threshold: ${String(config.rateLimiting.failureThreshold).padEnd(2)} attempts              ║
║   • Window:          ${String(config.rateLimiting.windowMinutes).padEnd(2)} minutes                ║
║   • Lockout:         ${String(config.rateLimiting.lockoutMinutes).padEnd(2)} minutes                ║
║   • CAPTCHA Escalation: ${String(config.rateLimiting.captchaEscalationThreshold).padEnd(2)} attempts              ║
║                                                            ║
║ CAPTCHA Provider:    ${config.captchaProvider.padEnd(6)}                    ║
║ Environment:         ${(process.env.NODE_ENV || "development").padEnd(6)}                    ║
╚════════════════════════════════════════════════════════════╝
`
    } catch (error) {
        return `Failed to generate configuration summary: ${error}`
    }
}

/**
 * Verify that all required configuration is present
 *
 * Useful for health checks and startup verification.
 *
 * @returns Object with verification results
 */
export function verifyConfiguration(): {
    valid: boolean
    issues: string[]
} {
    const issues: string[] = []

    try {
        const configManager = ConfigurationManager.getInstance()
        const config = configManager.getConfig()

        // Check Argon2id parameters
        if (!config.argon2id) {
            issues.push("Argon2id configuration is missing")
        } else {
            if (config.argon2id.memory < 16 || config.argon2id.memory > 256) {
                issues.push(
                    `Argon2id memory (${config.argon2id.memory}) is outside valid range [16-256]`
                )
            }
            if (config.argon2id.time < 2 || config.argon2id.time > 10) {
                issues.push(
                    `Argon2id time (${config.argon2id.time}) is outside valid range [2-10]`
                )
            }
            if (
                config.argon2id.parallelism < 1 ||
                config.argon2id.parallelism > 4
            ) {
                issues.push(
                    `Argon2id parallelism (${config.argon2id.parallelism}) is outside valid range [1-4]`
                )
            }
        }

        // Check pepper
        if (!config.pepper) {
            issues.push("Pepper is not configured")
        } else if (config.pepper.length < 32) {
            issues.push(
                `Pepper is too short (${config.pepper.length} characters, minimum 32 required)`
            )
        }

        // Check rate limiting
        if (!config.rateLimiting) {
            issues.push("Rate limiting configuration is missing")
        } else {
            if (config.rateLimiting.failureThreshold < 1) {
                issues.push("Rate limiting failure threshold must be >= 1")
            }
            if (config.rateLimiting.windowMinutes < 1) {
                issues.push("Rate limiting window must be >= 1 minute")
            }
            if (config.rateLimiting.lockoutMinutes < 1) {
                issues.push("Rate limiting lockout must be >= 1 minute")
            }
        }

        // Check CAPTCHA provider
        if (!config.captchaProvider) {
            issues.push("CAPTCHA provider is not configured")
        } else if (
            config.captchaProvider !== "cloudflare" &&
            config.captchaProvider !== "google"
        ) {
            issues.push(
                `Invalid CAPTCHA provider: ${config.captchaProvider} (must be 'cloudflare' or 'google')`
            )
        }
    } catch (error) {
        issues.push(
            `Configuration verification failed: ${error instanceof Error ? error.message : String(error)}`
        )
    }

    return {
        valid: issues.length === 0,
        issues,
    }
}
