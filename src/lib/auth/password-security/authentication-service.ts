/**
 * Authentication Service: Main Controller
 * Purpose: Orchestrate all password security components into a cohesive authentication system
 *
 * This service coordinates:
 * - CAPTCHA validation (bot protection)
 * - Rate limiting (brute force protection)
 * - Password hashing (Argon2id with salt and pepper)
 * - Password validation (with algorithm detection)
 * - Audit logging (security events)
 * - Error handling (generic messages, no user enumeration)
 */

import { verifyCAPTCHAWithFallback } from "@/lib/auth/captcha-verifier"
import { logger } from "@/lib/logger"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import {
    RateLimiter,
    getRateLimiter,
    getSecurityConfig,
    hashPasswordArgon2id,
    normalizeResponseTime,
    validatePassword,
    validatePasswordInput,
} from "./index"
import { AuthRepository } from "./auth-repository"
import { AuthAuditService } from "./auth-audit-service"

export interface AuthenticationResult {
    success: boolean
    userId?: string
    email?: string
    error?: string
    errorCode?: string
    statusCode: number
    isLocked?: boolean
    unlockTimeSeconds?: number
    degradedMode?: boolean
}

export interface RegistrationRequest {
    email: string
    password: string
    captchaToken?: string
}

export interface LoginRequest {
    email: string
    password: string
    captchaToken?: string
}

/**
 * Authentication Service
 * Main controller orchestrating all password security components
 */
export class AuthenticationService {
    private supabase: SupabaseClient<any>
    private rateLimiter: RateLimiter
    private config: ReturnType<typeof getSecurityConfig>
    private repository: AuthRepository
    private auditService: AuthAuditService

    constructor() {
        // Initialize Supabase client
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!url || !serviceKey) {
            throw new Error(
                "Missing Supabase configuration. " +
                    "Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set."
            )
        }

        this.supabase = createClient<any>(url, serviceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        })

        // Initialize configuration
        this.config = getSecurityConfig()

        // Initialize rate limiter with configuration
        this.rateLimiter = getRateLimiter(this.config.rateLimiting)

        // Initialize repository and audit service
        this.repository = new AuthRepository(this.supabase)
        this.auditService = new AuthAuditService(this.supabase)
    }

    /**
     * Register a new user with email and password
     */
    async register(
        request: RegistrationRequest
    ): Promise<AuthenticationResult> {
        const operationStartTime = Date.now()
        try {
            // ================================================================
            // STEP 1: VALIDATE CAPTCHA
            // ================================================================

            if (!request.captchaToken) {
                logger.warn("Registration attempt without CAPTCHA token", {
                    email: request.email,
                })
                return this.normalizeAndReturn(
                    {
                        success: false,
                        error: "CAPTCHA verification required",
                        errorCode: "CAPTCHA_REQUIRED",
                        statusCode: 400,
                    },
                    operationStartTime
                )
            }

            const captchaResult = await verifyCAPTCHAWithFallback(
                request.captchaToken
            )

            if (!captchaResult.success) {
                logger.warn("CAPTCHA verification failed during registration", {
                    email: request.email,
                    reason: captchaResult.failureReason,
                    degradedMode: captchaResult.degradedMode,
                })
                return this.normalizeAndReturn(
                    {
                        success: false,
                        error: "Registration failed",
                        errorCode: "REGISTRATION_FAILED",
                        statusCode: 400,
                        degradedMode: captchaResult.degradedMode,
                    },
                    operationStartTime
                )
            }

            // ================================================================
            // STEP 2: VALIDATE INPUT
            // ================================================================

            if (!request.email || typeof request.email !== "string") {
                logger.warn("Invalid email in registration request", {
                    email: request.email,
                })
                return this.normalizeAndReturn(
                    {
                        success: false,
                        error: "Invalid email format",
                        errorCode: "INVALID_EMAIL",
                        statusCode: 400,
                    },
                    operationStartTime
                )
            }

            try {
                validatePasswordInput(request.password)
            } catch (error) {
                logger.warn("Invalid password in registration request", {
                    email: request.email,
                    error:
                        error instanceof Error ? error.message : String(error),
                })
                return this.normalizeAndReturn(
                    {
                        success: false,
                        error: "Invalid password format",
                        errorCode: "INVALID_PASSWORD",
                        statusCode: 400,
                    },
                    operationStartTime
                )
            }

            // ================================================================
            // STEP 3: CHECK IF EMAIL EXISTS
            // ================================================================

            let emailExists = false
            try {
                emailExists = await this.repository.userExistsByEmail(
                    request.email
                )
            } catch (error) {
                return this.normalizeAndReturn(
                    {
                        success: false,
                        error: "Registration failed",
                        errorCode: "DATABASE_ERROR",
                        statusCode: 500,
                    },
                    operationStartTime
                )
            }

            if (emailExists) {
                logger.warn("Registration attempt with existing email", {
                    email: request.email,
                })
                return this.normalizeAndReturn(
                    {
                        success: false,
                        error: "Registration failed",
                        errorCode: "REGISTRATION_FAILED",
                        statusCode: 409,
                    },
                    operationStartTime
                )
            }

            // ================================================================
            // STEP 4: HASH PASSWORD WITH ARGON2ID
            // ================================================================

            let hashResult: any
            try {
                hashResult = await hashPasswordArgon2id(request.password)
                if (hashResult.performanceWarning) {
                    logger.warn("Password hashing performance warning", {
                        email: request.email,
                        timeTakenMs: hashResult.timeTakenMs,
                    })
                }
            } catch (error) {
                logger.error("Password hashing error during registration", {
                    email: request.email,
                    error:
                        error instanceof Error ? error.message : String(error),
                })
                return this.normalizeAndReturn(
                    {
                        success: false,
                        error: "Registration failed",
                        errorCode: "HASHING_ERROR",
                        statusCode: 500,
                    },
                    operationStartTime
                )
            }

            // ================================================================
            // STEP 5: CREATE USER RECORD
            // ================================================================

            let newUser: any
            try {
                newUser = await this.repository.createUser({
                    email: request.email,
                    passwordHash: hashResult.hash,
                    passwordAlgorithm: hashResult.algorithm,
                })
            } catch (error) {
                return this.normalizeAndReturn(
                    {
                        success: false,
                        error: "Registration failed",
                        errorCode: "DATABASE_ERROR",
                        statusCode: 500,
                    },
                    operationStartTime
                )
            }

            // ================================================================
            // STEP 6: LOG REGISTRATION EVENT
            // ================================================================

            await this.auditService.logRegistration({
                email: request.email,
                userId: newUser.id,
                algorithm: hashResult.algorithm,
                hashTimeTakenMs: hashResult.timeTakenMs,
            })

            // ================================================================
            // STEP 7: RETURN SUCCESS & NORMALIZE
            // ================================================================

            logger.info("User registered successfully", {
                userId: newUser.id,
                email: request.email,
            })

            return this.normalizeAndReturn(
                {
                    success: true,
                    userId: newUser.id,
                    email: newUser.email,
                    statusCode: 201,
                },
                operationStartTime
            )
        } catch (error) {
            logger.error("Unexpected error during registration", {
                error: error instanceof Error ? error.message : String(error),
            })
            return this.normalizeAndReturn(
                {
                    success: false,
                    error: "Registration failed",
                    errorCode: "INTERNAL_ERROR",
                    statusCode: 500,
                },
                operationStartTime
            )
        }
    }

    /**
     * Authenticate user with email and password
     */
    async login(request: LoginRequest): Promise<AuthenticationResult> {
        const operationStartTime = Date.now()
        try {
            // ================================================================
            // STEP 1: VALIDATE CAPTCHA
            // ================================================================

            let degradedMode = false

            if (!request.captchaToken) {
                logger.warn("Login attempt without CAPTCHA token", {
                    email: request.email,
                })
                return this.normalizeAndReturn(
                    {
                        success: false,
                        error: "CAPTCHA verification required",
                        errorCode: "CAPTCHA_REQUIRED",
                        statusCode: 400,
                    },
                    operationStartTime
                )
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
                    degradedMode = true
                } else {
                    return this.normalizeAndReturn(
                        {
                            success: false,
                            error: "Authentication failed",
                            errorCode: "AUTH_FAILED",
                            statusCode: 401,
                        },
                        operationStartTime
                    )
                }
            }

            // ================================================================
            // STEP 2: CHECK RATE LIMITS
            // ================================================================

            const rateLimitCheck =
                await this.rateLimiter.checkAndUpdateRateLimit(request.email)

            if (!rateLimitCheck.allowed) {
                logger.warn("Login attempt on rate-limited account", {
                    email: request.email,
                    isLocked: rateLimitCheck.isLocked,
                    lockedUntil: rateLimitCheck.lockedUntil?.toISOString(),
                })

                await this.auditService.logRateLimitExceeded({
                    email: request.email,
                    degradedMode,
                })

                return this.normalizeAndReturn(
                    {
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
                    },
                    operationStartTime
                )
            }

            // ================================================================
            // STEP 3: VALIDATE INPUT
            // ================================================================

            if (!request.email || typeof request.email !== "string") {
                logger.warn("Invalid email in login request", {
                    email: request.email,
                })
                await this.rateLimiter.recordFailure(request.email)
                return this.normalizeAndReturn(
                    {
                        success: false,
                        error: "Authentication failed",
                        errorCode: "AUTH_FAILED",
                        statusCode: 401,
                    },
                    operationStartTime
                )
            }

            try {
                validatePasswordInput(request.password)
            } catch (error) {
                logger.warn("Invalid password in login request", {
                    email: request.email,
                    error:
                        error instanceof Error ? error.message : String(error),
                })
                await this.rateLimiter.recordFailure(request.email)
                return this.normalizeAndReturn(
                    {
                        success: false,
                        error: "Authentication failed",
                        errorCode: "AUTH_FAILED",
                        statusCode: 401,
                    },
                    operationStartTime
                )
            }

            // ================================================================
            // STEP 4: LOOK UP USER
            // ================================================================

            let user: any
            try {
                user = await this.repository.findUserByEmail(request.email)
                if (!user) {
                    logger.warn("User not found during login", {
                        email: request.email,
                    })
                    await this.rateLimiter.recordFailure(request.email)
                    return this.normalizeAndReturn(
                        {
                            success: false,
                            error: "Authentication failed",
                            errorCode: "AUTH_FAILED",
                            statusCode: 401,
                        },
                        operationStartTime
                    )
                }
            } catch (error) {
                await this.rateLimiter.recordFailure(request.email)
                return this.normalizeAndReturn(
                    {
                        success: false,
                        error: "Authentication failed",
                        errorCode: "AUTH_FAILED",
                        statusCode: 401,
                    },
                    operationStartTime
                )
            }

            // ================================================================
            // STEP 5: VALIDATE PASSWORD
            // ================================================================

            let validationResult: any
            try {
                validationResult = await validatePassword(
                    request.password,
                    user.password_hash
                )
            } catch (error) {
                logger.error("Password validation error", {
                    email: request.email,
                    error:
                        error instanceof Error ? error.message : String(error),
                })
                await this.rateLimiter.recordFailure(request.email)
                return this.normalizeAndReturn(
                    {
                        success: false,
                        error: "Authentication failed",
                        errorCode: "AUTH_FAILED",
                        statusCode: 401,
                    },
                    operationStartTime
                )
            }

            if (!validationResult.valid) {
                logger.warn("Invalid password during login", {
                    email: request.email,
                    algorithmType: validationResult.algorithmType,
                })
                await this.rateLimiter.recordFailure(request.email)
                return this.normalizeAndReturn(
                    {
                        success: false,
                        error: "Authentication failed",
                        errorCode: "AUTH_FAILED",
                        statusCode: 401,
                    },
                    operationStartTime
                )
            }

            // ================================================================
            // STEP 6: RESET RATE LIMIT COUNTER
            // ================================================================

            try {
                await this.rateLimiter.recordSuccess(request.email)
            } catch (error) {
                logger.error("Failed to reset rate limit counter", {
                    email: request.email,
                    error:
                        error instanceof Error ? error.message : String(error),
                })
            }

            // ================================================================
            // STEP 7: LOG AUTHENTICATION EVENT
            // ================================================================

            await this.auditService.logAuthSuccess({
                email: request.email,
                userId: user.id,
                algorithm: validationResult.algorithmType,
                degradedMode,
            })

            // ================================================================
            // STEP 8: RETURN SUCCESS & NORMALIZE
            // ================================================================

            logger.info("User authenticated successfully", {
                userId: user.id,
                email: request.email,
                algorithmType: validationResult.algorithmType,
            })

            return this.normalizeAndReturn(
                {
                    success: true,
                    userId: user.id,
                    email: user.email,
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

    getRateLimiter(): RateLimiter {
        return this.rateLimiter
    }

    getSecurityConfig() {
        return this.config
    }
}

let authServiceInstance: AuthenticationService | null = null

export function getAuthenticationService(): AuthenticationService {
    if (!authServiceInstance) {
        authServiceInstance = new AuthenticationService()
    }
    return authServiceInstance
}
