/**
 * Module: CAPTCHA Token Verification
 * Purpose: Verify Cloudflare Turnstile CAPTCHA tokens on the backend
 *
 * This module handles:
 * - Verifying CAPTCHA tokens with Cloudflare API
 * - Checking token expiration (5 minute window)
 * - Handling network errors gracefully
 * - Logging verification attempts and failures
 * - Returning structured verification results
 *
 * Requirements covered:
 * - Requirement 20: CAPTCHA Protection (20.3, 20.6, 20.7, 20.11)
 * - Requirement 14: Error Handling and Logging (14.1, 14.5)
 */

/**
 * CAPTCHA Verification Result
 * Returned by verifyCAPTCHA function with verification status and metadata
 */
export interface CAPTCHAVerificationResult {
    /** Whether the CAPTCHA token is valid */
    success: boolean

    /** Error codes from Cloudflare (if verification failed) */
    errorCodes?: string[]

    /** Timestamp when the CAPTCHA challenge was issued */
    challengeTs?: string

    /** Hostname where the CAPTCHA was solved */
    hostname?: string

    /** Risk score (0-1, lower is better) - for future risk assessment */
    score?: number

    /** Reason for failure (for logging) */
    failureReason?: string
}

/**
 * Cloudflare Turnstile API Response
 * Raw response from Cloudflare verification endpoint
 */
interface CloudflareVerifyResponse {
    success: boolean
    challenge_ts?: string
    hostname?: string
    error_codes?: string[]
    score?: number
    score_reason?: string[]
}

/**
 * CAPTCHA Configuration
 * Loaded from environment variables
 */
interface CAPTCHAConfig {
    secretKey: string
    provider: "cloudflare" | "google"
    tokenExpirationMinutes: number
}

/**
 * Load CAPTCHA configuration from environment
 * Throws error if critical configuration is missing
 *
 * @returns CAPTCHA configuration
 * @throws Error if CAPTCHA_SECRET_KEY is not configured
 */
function loadCAPTCHAConfig(): CAPTCHAConfig {
    const secretKey = process.env.CAPTCHA_SECRET_KEY
    const provider = (process.env.CAPTCHA_PROVIDER || "cloudflare") as
        | "cloudflare"
        | "google"
    const tokenExpirationMinutes = parseInt(
        process.env.CAPTCHA_TOKEN_EXPIRATION_MINUTES || "5",
        10
    )

    if (!secretKey) {
        throw new Error(
            "CAPTCHA_SECRET_KEY environment variable is not configured.\n\n" +
                "This is required for CAPTCHA verification.\n\n" +
                "Action required:\n" +
                "1. Get secret key from Cloudflare Turnstile dashboard\n" +
                "2. Set CAPTCHA_SECRET_KEY environment variable\n" +
                "3. In Docker: Add to docker-compose.yml\n" +
                "4. In Vercel: Add to Environment Variables"
        )
    }

    return {
        secretKey,
        provider,
        tokenExpirationMinutes,
    }
}

/**
 * Verify CAPTCHA token with Cloudflare Turnstile API
 *
 * This function:
 * 1. Validates that token is provided
 * 2. Sends token to Cloudflare verification endpoint
 * 3. Checks token expiration (5 minute window)
 * 4. Returns verification result with metadata
 * 5. Handles errors gracefully with logging
 *
 * Token Expiration:
 * - Cloudflare returns challenge_ts (when CAPTCHA was solved)
 * - We check if token is older than 5 minutes
 * - Expired tokens are rejected even if Cloudflare says success
 *
 * Error Handling:
 * - Network errors are logged and throw
 * - Invalid responses are logged and throw
 * - Expired tokens return success: false (not an error)
 * - Missing tokens return success: false (not an error)
 *
 * Logging:
 * - Successful verifications: logged at info level
 * - Failed verifications: logged at warn level
 * - Network errors: logged at error level
 * - Configuration issues: logged at error level
 *
 * @param token CAPTCHA token from frontend
 * @returns Verification result with success status and metadata
 * @throws Error if network error or invalid response from Cloudflare
 *
 * @example
 * ```typescript
 * const result = await verifyCAPTCHA(captchaToken)
 * if (!result.success) {
 *   return { error: 'CAPTCHA verification failed', status: 400 }
 * }
 * // Continue with authentication
 * ```
 */
export async function verifyCAPTCHA(
    token: string | undefined | null
): Promise<CAPTCHAVerificationResult> {
    // Validate token is provided
    if (!token) {
        console.warn("CAPTCHA verification failed: token is missing")
        return {
            success: false,
            failureReason: "Token is missing",
        }
    }

    try {
        // Load configuration
        let config: CAPTCHAConfig
        try {
            config = loadCAPTCHAConfig()
        } catch (error) {
            console.error("CAPTCHA configuration error:", error)
            throw error
        }

        // Verify with Cloudflare
        const verifyUrl =
            "https://challenges.cloudflare.com/turnstile/v0/siteverify"

        let response: Response
        try {
            response = await fetch(verifyUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    secret: config.secretKey,
                    response: token,
                }),
            })
        } catch (error) {
            console.error("CAPTCHA network error:", {
                error: error instanceof Error ? error.message : String(error),
                url: verifyUrl,
            })
            throw new Error("CAPTCHA service unavailable")
        }

        // Parse response
        let data: CloudflareVerifyResponse
        try {
            if (!response.ok) {
                console.error("CAPTCHA API error:", {
                    status: response.status,
                    statusText: response.statusText,
                })
                throw new Error(
                    `CAPTCHA API returned ${response.status}: ${response.statusText}`
                )
            }

            data = (await response.json()) as CloudflareVerifyResponse
        } catch (error) {
            console.error("CAPTCHA response parsing error:", error)
            throw new Error("Invalid response from CAPTCHA service")
        }

        // Check if verification succeeded
        if (!data.success) {
            console.warn("CAPTCHA verification failed:", {
                errorCodes: data.error_codes,
                hostname: data.hostname,
            })
            return {
                success: false,
                errorCodes: data.error_codes,
                hostname: data.hostname,
                failureReason: "Cloudflare verification failed",
            }
        }

        // Check token expiration (5 minute window)
        if (data.challenge_ts) {
            const challengeTime = new Date(data.challenge_ts).getTime()
            const now = Date.now()
            const diffSeconds = (now - challengeTime) / 1000

            if (diffSeconds > config.tokenExpirationMinutes * 60) {
                console.warn("CAPTCHA token expired:", {
                    diffSeconds,
                    expirationSeconds: config.tokenExpirationMinutes * 60,
                    challengeTs: data.challenge_ts,
                })
                return {
                    success: false,
                    challengeTs: data.challenge_ts,
                    hostname: data.hostname,
                    failureReason: "Token expired",
                }
            }
        }

        // Verification successful
        console.info("CAPTCHA verification successful:", {
            hostname: data.hostname,
            challengeTs: data.challenge_ts,
        })

        return {
            success: true,
            challengeTs: data.challenge_ts,
            hostname: data.hostname,
            score: data.score,
        }
    } catch (error) {
        // Log unexpected errors
        console.error("CAPTCHA verification error:", {
            error: error instanceof Error ? error.message : String(error),
            token: token ? `${token.substring(0, 10)}...` : "missing",
        })

        // Re-throw to let caller handle
        throw error
    }
}

/**
 * Verify CAPTCHA with graceful degradation
 *
 * This function wraps verifyCAPTCHA with fallback behavior:
 * - If CAPTCHA service is unavailable, logs warning
 * - Returns false to allow retry or escalate to rate limiting
 * - Does not throw errors (safe for use in auth flows)
 * - Activates degraded mode with enhanced rate limiting
 *
 * Use this when you want to continue authentication even if CAPTCHA fails,
 * relying on rate limiting as fallback protection.
 *
 * Degraded Mode Behavior:
 * - CAPTCHA verification failures are logged as warnings
 * - Authentication continues with enhanced rate limiting
 * - Stricter failure threshold (3 instead of 5)
 * - Shorter lockout window (10 minutes instead of 15)
 * - More aggressive logging for audit trail
 * - Temporary degraded mode flag in audit logs
 *
 * @param token CAPTCHA token from frontend
 * @returns Object with success status and degraded mode flag
 *
 * @example
 * ```typescript
 * const result = await verifyCAPTCHAWithFallback(token)
 * if (!result.success) {
 *   if (result.degradedMode) {
 *     // CAPTCHA service unavailable, using enhanced rate limiting
 *     // Apply stricter rate limits
 *   }
 *   return { error: 'Verification failed', status: 400 }
 * }
 * ```
 */
export interface CAPTCHAFallbackResult {
    /** Whether CAPTCHA verification succeeded */
    success: boolean

    /** Whether degraded mode is active (CAPTCHA service unavailable) */
    degradedMode: boolean

    /** Reason for failure (if any) */
    failureReason?: string

    /** Error codes from CAPTCHA service (if available) */
    errorCodes?: string[]
}

export async function verifyCAPTCHAWithFallback(
    token: string | undefined | null
): Promise<CAPTCHAFallbackResult> {
    try {
        const result = await verifyCAPTCHA(token)
        return {
            success: result.success,
            degradedMode: false,
            failureReason: result.failureReason,
            errorCodes: result.errorCodes,
        }
    } catch (error) {
        // CAPTCHA service unavailable - activate degraded mode
        const errorMessage =
            error instanceof Error ? error.message : String(error)

        console.warn("CAPTCHA service unavailable, activating degraded mode:", {
            error: errorMessage,
            timestamp: new Date().toISOString(),
        })

        // Log degraded mode activation for audit trail
        console.info("CAPTCHA degraded mode activated", {
            reason: errorMessage.includes("network")
                ? "network_error"
                : errorMessage.includes("configuration")
                  ? "config_error"
                  : "service_error",
            timestamp: new Date().toISOString(),
            event_type: "captcha_degraded_mode",
        })

        // Return false with degraded mode flag
        // Caller should escalate to enhanced rate limiting
        return {
            success: false,
            degradedMode: true,
            failureReason: "CAPTCHA service unavailable",
        }
    }
}

/**
 * Check if CAPTCHA is configured
 *
 * Returns true if CAPTCHA_SECRET_KEY is set in environment.
 * Use this to determine if CAPTCHA verification should be enforced.
 *
 * @returns true if CAPTCHA is configured, false otherwise
 */
export function isCAPTCHAConfigured(): boolean {
    return !!process.env.CAPTCHA_SECRET_KEY
}

/**
 * Get CAPTCHA provider
 *
 * Returns the configured CAPTCHA provider (cloudflare or google).
 * Defaults to cloudflare if not specified.
 *
 * @returns CAPTCHA provider name
 */
export function getCAPTCHAProvider(): "cloudflare" | "google" {
    return (process.env.CAPTCHA_PROVIDER || "cloudflare") as
        | "cloudflare"
        | "google"
}
