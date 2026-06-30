/**
 * Login Service
 * Purpose: Handle user authentication with CAPTCHA validation, rate limiting,
 * password verification, and audit logging. Extracted from AuthenticationService
 * for SRP and testability.
 *
 * Requirements covered:
 * - Requirement 1: Argon2id Password Hashing
 * - Requirement 3: Pepper Security Layer
 * - Requirement 6: Password Hash Validation
 * - Requirement 7: Brute Force Protection with Rate Limiting
 * - Requirement 8: Input Validation
 * - Requirement 9: Security Against Attack Vectors
 * - Requirement 10: Constant-Time Comparison
 * - Requirement 14: Error Handling and Logging
 * - Requirement 20: CAPTCHA Protection Against Automated Attacks
 */

import { verifyCAPTCHAWithFallback } from "@/lib/auth/captcha-verifier"
import { logger } from "@/lib/logger"
import {
    normalizeResponseTime,
    validatePassword,
    validatePasswordInput,
} from "./index"
import type { AuthenticationResult, LoginRequest } from "./authentication-service"
import type {
    IAuthAuditService,
    IAuthRepository,
    IRateLimiter,
} from "./auth-service-types"

/**
 * Result of password validation
 */
interface PasswordValidationResult {
    valid: boolean
    algorithmType?: string
}

/**
 * Login Service
 *
 * Handles the login/authentication flow:
 * 1. CAPTCHA validation
 * 2. Rate limiting check
 * 3. Input validation
 * 4. User lookup
 * 5. Password validation
 * 6. Rate limit reset on success
 * 7. Audit logging
 * 8. Response time normalization
 */
export class LoginService {
    constructor(
        private readonly authRepository: IAuthRepository,
        private readonly authAuditService: IAuthAuditService,
        private readonly rateLimiter: IRateLimiter
    ) {}

    /**
     * Authenticate a user with email and password
     *
     * @param request - Login request data
     * @returns Authentication result
     */
    async login(request: LoginRequest): Promise<AuthenticationResult> {
        const operationStartTime = Date.now()

        try {
            let degradedMode = false

            // STEP 1: Validate CAPTCHA
            const captchaResult = await this.validateCaptcha(request)
            if (!captchaResult.success) {
                if (captchaResult.degradedMode) {
                    degradedMode = true
                } else {
                    return {
                        success: false,
                        error: captchaResult.error ?? "Authentication failed",
                        errorCode: captchaResult.errorCode ?? "AUTH_FAILED",
                        statusCode: captchaResult.statusCode ?? 401,
                        degradedMode: false,
                    }
                }
            }

            // STEP 2: Check rate limits
            const rateLimitResult = await this.checkRateLimit(
                request.email,
                degradedMode
            )
            if (rateLimitResult) {
                return rateLimitResult
            }

            // STEP 3: Validate input
            const inputResult = await this.validateInput(request)
            if (inputResult) {
                return inputResult
            }

            // STEP 4: Look up user
            const userLookupResult = await this.lookupUser(request.email)
            if (!userLookupResult.user) {
                return userLookupResult.errorResult ?? {
                    success: false,
                    error: "Authentication failed",
                    errorCode: "AUTH_FAILED",
                    statusCode: 401,
                }
            }

            // STEP 5: Validate password
            const passwordResult = await this.validateUserPassword(
                request.password,
                userLookupResult.user.password_hash
            )
            if (!passwordResult.valid) {
                // Record failure for rate limiting
                await this.rateLimiter.recordFailure(request.email).catch(() => {
                    // ignore failure recording errors
                })

                return {
                    success: false,
                    error: "Authentication failed",
                    errorCode: "AUTH_FAILED",
                    statusCode: 401,
                }
            }

            // STEP 6: Reset rate limit counter on success
            await this.rateLimiter.recordSuccess(request.email).catch((error) => {
                logger.error("Failed to reset rate limit counter", {
                    email: request.email,
                    error:
                        error instanceof Error ? error.message : String(error),
                })
                // Don't fail authentication if rate limit reset fails
            })

            // STEP 7: Log authentication event
            await this.authAuditService
                .logAuthSuccess({
                    email: request.email,
                    userId: userLookupResult.user.id,
                    algorithm: passwordResult.algorithmType || "unknown",
                    degradedMode,
                })
                .catch((error) => {
                    logger.error("Failed to log authentication event", {
                        email: request.email,
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    })
                    // Don't fail authentication if logging fails
                })

            // STEP 8-9: Return success with normalized response time
            logger.info("User authenticated successfully", {
                userId: userLookupResult.user.id,
                email: request.email,
                algorithmType: passwordResult.algorithmType,
            })

            return this.normalizeAndReturn(
                {
                    success: true,
                    userId: userLookupResult.user.id,
                    email: userLookupResult.user.email,
                    statusCode: 200,
                    degradedMode,
                },
                operationStartTime
            )
        } catch (error) {
            logger.error("Unexpected error during login", {
                error: error instanceof Error ? error.message : String(error),
            })

            return this.normalizeAndReturn(
                {
                    success: false,
                    error: "Authentication failed",
                    errorCode: "INTERNAL_ERROR",
                    statusCode: 500,
                },
                operationStartTime
            )
        }
    }

    /**
     * Validate CAPTCHA token
     * Returns an error result or indicates degraded mode
     */
    private async validateCaptcha(
        request: LoginRequest
    ): Promise<{
        success: boolean
        error?: string
        errorCode?: string
        statusCode?: number
        degradedMode?: boolean
    }> {
        if (!request.captchaToken) {
            logger.warn("Login attempt without CAPTCHA token", {
                email: request.email,
            })
            return {
                success: false,
                error: "CAPTCHA verification required",
                errorCode: "CAPTCHA_REQUIRED",
                statusCode: 400,
                degradedMode: false,
            }
        }

        const captchaResult = await verifyCAPTCHAWithFallback(
            request.captchaToken
        )

        if (!captchaResult.success) {
            logger.warn("CAPTCHA verification failed during login", {
                email: request.email,
                reason: captchaResult.failureReason,
                degradedMode: captchaResult.degradedMode,
            })

            if (captchaResult.degradedMode) {
                return {
                    success: false,
                    degradedMode: true,
                }
            }

            return {
                success: false,
                error: "Authentication failed",
                errorCode: "AUTH_FAILED",
                statusCode: 401,
                degradedMode: false,
            }
        }

        return {
            success: true,
        }
    }

    /**
     * Check rate limits for the given email
     * Returns an error result if rate-limited, null if allowed
     */
    private async checkRateLimit(
        email: string,
        degradedMode: boolean
    ): Promise<AuthenticationResult | null> {
        const rateLimitCheck =
            await this.rateLimiter.checkAndUpdateRateLimit(email)

        if (!rateLimitCheck.allowed) {
            logger.warn("Login attempt on rate-limited account", {
                email,
                isLocked: rateLimitCheck.isLocked,
                lockedUntil: rateLimitCheck.lockedUntil?.toISOString(),
            })

            // Log rate limit event
            await this.authAuditService
                .logRateLimitExceeded({
                    email,
                    degradedMode,
                })
                .catch((error) => {
                    logger.error("Failed to log rate limit event", {
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    })
                })

            return {
                success: false,
                error: "Too many login attempts. Please try again later.",
                errorCode: "TOO_MANY_ATTEMPTS",
                statusCode: 429,
                isLocked: true,
                unlockTimeSeconds: rateLimitCheck.lockedUntil
                    ? Math.ceil(
                          (rateLimitCheck.lockedUntil.getTime() -
                              Date.now()) /
                              1000
                      )
                    : undefined,
            }
        }

        return null
    }

    /**
     * Validate email and password input
     * Returns an error result if invalid, null if valid
     */
    private async validateInput(
        request: LoginRequest
    ): Promise<AuthenticationResult | null> {
        if (!request.email || typeof request.email !== "string") {
            logger.warn("Invalid email in login request", {
                email: request.email,
            })

            await this.rateLimiter.recordFailure(request.email).catch(() => {
                // ignore
            })

            return {
                success: false,
                error: "Authentication failed",
                errorCode: "AUTH_FAILED",
                statusCode: 401,
            }
        }

        try {
            validatePasswordInput(request.password)
        } catch (error) {
            logger.warn("Invalid password in login request", {
                email: request.email,
                error:
                    error instanceof Error ? error.message : String(error),
            })

            await this.rateLimiter.recordFailure(request.email).catch(() => {
                // ignore
            })

            return {
                success: false,
                error: "Authentication failed",
                errorCode: "AUTH_FAILED",
                statusCode: 401,
            }
        }

        return null
    }

    /**
     * Look up user by email
     * Returns user data or error result
     */
    private async lookupUser(
        email: string
    ): Promise<{
        user?: {
            id: string
            email: string
            password_hash: string
        }
        errorResult?: AuthenticationResult
    }> {
        try {
            const user = await this.authRepository.findUserByEmail(email)

            if (!user) {
                logger.warn("User not found during login", {
                    email,
                })

                await this.rateLimiter.recordFailure(email).catch(() => {
                    // ignore
                })

                return {
                    errorResult: {
                        success: false,
                        error: "Authentication failed",
                        errorCode: "AUTH_FAILED",
                        statusCode: 401,
                    },
                }
            }

            return { user }
        } catch (error) {
            logger.error("Database error during login", {
                email,
                error:
                    error instanceof Error ? error.message : String(error),
            })

            await this.rateLimiter.recordFailure(email).catch(() => {
                // ignore
            })

            return {
                errorResult: {
                    success: false,
                    error: "Authentication failed",
                    errorCode: "AUTH_FAILED",
                    statusCode: 401,
                },
            }
        }
    }

    /**
     * Validate password against stored hash
     * Returns validation result
     */
    private async validateUserPassword(
        password: string,
        passwordHash: string
    ): Promise<PasswordValidationResult> {
        try {
            const validationResult = await validatePassword(
                password,
                passwordHash
            ) as unknown as PasswordValidationResult

            if (!validationResult.valid) {
                logger.warn("Invalid password during login", {
                    algorithmType: validationResult.algorithmType,
                })
            }

            return validationResult
        } catch (error) {
            logger.error("Password validation error", {
                error:
                    error instanceof Error ? error.message : String(error),
            })
            return { valid: false }
        }
    }

    /**
     * Normalize response time to prevent timing attacks
     */
    private async normalizeAndReturn(
        result: AuthenticationResult,
        operationStartTime: number,
        targetResponseTimeMs: number = 500
    ): Promise<AuthenticationResult> {
        try {
            const operationTimeMs = Date.now() - operationStartTime
            await normalizeResponseTime(operationTimeMs, targetResponseTimeMs)
        } catch (error) {
            logger.debug("Response time normalization error", {
                error: error instanceof Error ? error.message : String(error),
            })
        }
        return result
    }
}
