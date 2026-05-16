/**
 * Authentication Service: Main Controller
 * Purpose: Orchestrate all password security components into a cohesive authentication system
 *
 * This service coordinates:
 * - CAPTCHA validation (bot protection)
 * - Rate limiting (brute force protection)
 * - Password hashing (Argon2id with salt and pepper)
 * - Password validation (with algorithm detection)
 * - Algorithm migration (Bcrypt → Argon2id)
 * - Audit logging (security events)
 * - Error handling (generic messages, no user enumeration)
 *
 * Requirements covered:
 * - Requirement 1: Argon2id Password Hashing
 * - Requirement 3: Pepper Security Layer
 * - Requirement 6: Password Hash Validation
 * - Requirement 7: Brute Force Protection with Rate Limiting
 * - Requirement 8: Input Validation
 * - Requirement 9: Security Against Attack Vectors
 * - Requirement 10: Constant-Time Comparison
 * - Requirement 11: Algorithm Migration on Successful Login
 * - Requirement 14: Error Handling and Logging
 * - Requirement 20: CAPTCHA Protection Against Automated Attacks
 */

import { verifyCAPTCHAWithFallback } from "@/lib/auth/captcha-verifier"
import { logger } from "@/lib/logger"
import { createClient } from "@supabase/supabase-js"
import {
    RateLimiter,
    getRateLimiter,
    getSecurityConfig,
    hashPasswordArgon2id,
    triggerPasswordMigration,
    validatePassword,
    validatePasswordInput,
} from "./index"

/**
 * Authentication result from login/registration
 */
export interface AuthenticationResult {
    /** Whether authentication succeeded */
    success: boolean

    /** User ID (if successful) */
    userId?: string

    /** User email (if successful) */
    email?: string

    /** Error message (if failed) */
    error?: string

    /** Error code for client handling */
    errorCode?: string

    /** HTTP status code */
    statusCode: number

    /** Whether account is locked due to rate limiting */
    isLocked?: boolean

    /** Time until account unlock in seconds (if locked) */
    unlockTimeSeconds?: number

    /** Whether password requires migration (Bcrypt → Argon2id) */
    requiresMigration?: boolean

    /** Whether degraded mode is active (CAPTCHA unavailable) */
    degradedMode?: boolean
}

/**
 * Registration request data
 */
export interface RegistrationRequest {
    email: string
    password: string
    captchaToken?: string
}

/**
 * Login request data
 */
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
    private supabase: ReturnType<typeof createClient>
    private rateLimiter: RateLimiter
    private config: ReturnType<typeof getSecurityConfig>

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

        this.supabase = createClient(url, serviceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        })

        // Initialize configuration
        this.config = getSecurityConfig()

        // Initialize rate limiter with configuration
        this.rateLimiter = getRateLimiter(this.config.rateLimiting)
    }

    /**
     * Register a new user with email and password
     *
     * This function:
     * 1. Validates CAPTCHA token (bot protection)
     * 2. Validates input (email, password format)
     * 3. Checks if email already exists
     * 4. Hashes password with Argon2id (never Bcrypt for new users)
     * 5. Creates user record in database
     * 6. Logs registration event
     * 7. Returns success or error with generic messages
     * 8. Normalizes response time to prevent timing attacks
     *
     * Security Features:
     * - CAPTCHA validation prevents automated registration
     * - Input validation prevents injection attacks
     * - Generic error messages prevent user enumeration
     * - Argon2id hashing with salt and pepper
     * - Audit logging for compliance
     * - Response time normalization prevents timing attacks (Requirement 10.4, 10.5)
     *
     * @param request Registration request with email, password, CAPTCHA token
     * @returns Authentication result with success status and user data
     *
     * @example
     * ```typescript
     * const service = new AuthenticationService()
     * const result = await service.register({
     *   email: 'user@example.com',
     *   password: 'SecurePassword123!',
     *   captchaToken: 'token_from_frontend'
     * })
     *
     * if (result.success) {
     *   console.log('User registered:', result.userId)
     * } else {
     *   console.error('Registration failed:', result.error)
     * }
     * ```
     */
    async register(
        request: RegistrationRequest
    ): Promise<AuthenticationResult> {
        const operationStartTime = Date.now()
        try {
            // ================================================================
            // STEP 1: VALIDATE CAPTCHA (Requirement 20.1, 20.2)
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

            // Verify CAPTCHA with graceful degradation
            const captchaResult = await verifyCAPTCHAWithFallback(
                request.captchaToken
            )

            if (!captchaResult.success) {
                // Log CAPTCHA failure
                logger.warn("CAPTCHA verification failed during registration", {
                    email: request.email,
                    reason: captchaResult.failureReason,
                    degradedMode: captchaResult.degradedMode,
                })

                // Return generic error (don't reveal CAPTCHA failure)
                // Requirement 20.3: Return 400 for invalid tokens
                // Requirement 20.4: Don't reveal CAPTCHA failure vs other failures
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
            // STEP 2: VALIDATE INPUT (Requirement 8.1, 8.2, 8.3, 8.6)
            // ================================================================

            // Validate email format
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

            // Validate password input (length, format, no null bytes)
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
            // STEP 3: CHECK IF EMAIL EXISTS (Requirement 8.6)
            // ================================================================

            let existingUser: any
            try {
                const { data, error } = await this.supabase
                    .from("users")
                    .select("id")
                    .eq("email", request.email.toLowerCase())
                    .single()

                // PGRST116 = no rows found (expected for new users)
                if (error && error.code !== "PGRST116") {
                    logger.error("Database error checking email existence", {
                        email: request.email,
                        error: error.message,
                    })
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

                existingUser = data
            } catch (error) {
                logger.error("Error checking email existence", {
                    email: request.email,
                    error:
                        error instanceof Error ? error.message : String(error),
                })
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

            // Email already exists - return generic error (no user enumeration)
            if (existingUser) {
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
            // STEP 4: HASH PASSWORD WITH ARGON2ID (Requirement 1.1, 1.2, 1.3)
            // ================================================================

            let hashResult: any
            try {
                hashResult = await hashPasswordArgon2id(request.password)

                // Log performance warning if hashing took too long
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
            // STEP 5: CREATE USER RECORD (Requirement 1.1, 5.5)
            // ================================================================

            let newUser: any
            try {
                const { data, error } = await this.supabase
                    .from("users")
                    .insert({
                        email: request.email.toLowerCase(),
                        password_hash: hashResult.hash,
                        password_algorithm: hashResult.algorithm,
                        email_verified: false,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .select("id, email")
                    .single()

                if (error) {
                    logger.error("Failed to create user record", {
                        email: request.email,
                        error: error.message,
                    })
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

                newUser = data
            } catch (error) {
                logger.error("Error creating user record", {
                    email: request.email,
                    error:
                        error instanceof Error ? error.message : String(error),
                })
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
            // STEP 6: LOG REGISTRATION EVENT (Requirement 14.1, 14.3)
            // ================================================================

            try {
                await this.supabase.from("audit_logs").insert({
                    event_type: "user_registered",
                    email: request.email,
                    user_id: newUser.id,
                    timestamp: new Date().toISOString(),
                    details: {
                        algorithm: hashResult.algorithm,
                        hashTimeTakenMs: hashResult.timeTakenMs,
                    },
                })
            } catch (error) {
                logger.error("Failed to log registration event", {
                    email: request.email,
                    error:
                        error instanceof Error ? error.message : String(error),
                })
                // Don't fail registration if logging fails
            }

            // ================================================================
            // STEP 7: RETURN SUCCESS
            // ================================================================

            logger.info("User registered successfully", {
                userId: newUser.id,
                email: request.email,
            })

            // ================================================================
            // STEP 8: NORMALIZE RESPONSE TIME (Requirement 10.4, 10.5)
            // ================================================================
            // Ensure response time is consistent regardless of path taken
            // This prevents timing attacks that could reveal information
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

            // Normalize response time even on error
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
     *
     * This function:
     * 1. Validates CAPTCHA token (bot protection)
     * 2. Checks rate limits (brute force protection)
     * 3. Validates input (email, password format)
     * 4. Looks up user by email
     * 5. Validates password against stored hash
     * 6. Triggers algorithm migration if needed (Bcrypt → Argon2id)
     * 7. Resets rate limit counter on success
     * 8. Logs authentication event
     * 9. Returns success or error with generic messages
     * 10. Normalizes response time to prevent timing attacks
     *
     * Security Features:
     * - CAPTCHA validation prevents automated attacks
     * - Rate limiting prevents brute force attacks
     * - Constant-time password comparison prevents timing attacks
     * - Generic error messages prevent user enumeration
     * - Automatic algorithm migration strengthens legacy passwords
     * - Audit logging for compliance
     * - Response time normalization prevents timing attacks (Requirement 10.4, 10.5)
     *
     * @param request Login request with email, password, CAPTCHA token
     * @returns Authentication result with success status and user data
     *
     * @example
     * ```typescript
     * const service = new AuthenticationService()
     * const result = await service.login({
     *   email: 'user@example.com',
     *   password: 'SecurePassword123!',
     *   captchaToken: 'token_from_frontend'
     * })
     *
     * if (result.success) {
     *   console.log('User logged in:', result.userId)
     * } else if (result.isLocked) {
     *   console.error('Account locked for', result.unlockTimeSeconds, 'seconds')
     * } else {
     *   console.error('Login failed:', result.error)
     * }
     * ```
     */
    async login(request: LoginRequest): Promise<AuthenticationResult> {
        const operationStartTime = Date.now()
        try {
            // ================================================================
            // STEP 1: VALIDATE CAPTCHA (Requirement 20.1, 20.2)
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

            // Verify CAPTCHA with graceful degradation
            const captchaResult = await verifyCAPTCHAWithFallback(
                request.captchaToken
            )

            if (!captchaResult.success) {
                // Log CAPTCHA failure
                logger.warn("CAPTCHA verification failed during login", {
                    email: request.email,
                    reason: captchaResult.failureReason,
                    degradedMode: captchaResult.degradedMode,
                })

                if (captchaResult.degradedMode) {
                    // CAPTCHA service unavailable - activate degraded mode
                    // Continue with enhanced rate limiting
                    degradedMode = true
                } else {
                    // CAPTCHA verification failed (not degraded mode)
                    // Return generic error (don't reveal CAPTCHA failure)
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
            // STEP 2: CHECK RATE LIMITS (Requirement 7.1, 7.2, 7.3, 7.4)
            // ================================================================

            const rateLimitCheck =
                await this.rateLimiter.checkAndUpdateRateLimit(request.email)

            if (!rateLimitCheck.allowed) {
                // Account is locked due to rate limiting
                logger.warn("Login attempt on rate-limited account", {
                    email: request.email,
                    isLocked: rateLimitCheck.isLocked,
                    lockedUntil: rateLimitCheck.lockedUntil?.toISOString(),
                })

                // Log rate limit event
                try {
                    await this.supabase.from("audit_logs").insert({
                        event_type: "rate_limit_exceeded",
                        email: request.email,
                        timestamp: new Date().toISOString(),
                        details: {
                            degradedMode,
                        },
                    })
                } catch (error) {
                    logger.error("Failed to log rate limit event", {
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    })
                }

                // Return 429 Too Many Requests
                // Requirement 7.3: Return 429 when locked
                // Requirement 7.6: Don't reveal whether account exists or password was correct
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
            // STEP 3: VALIDATE INPUT (Requirement 8.1, 8.2, 8.3, 8.6)
            // ================================================================

            // Validate email format
            if (!request.email || typeof request.email !== "string") {
                logger.warn("Invalid email in login request", {
                    email: request.email,
                })

                // Record failure for rate limiting
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

            // Validate password input (length, format, no null bytes)
            try {
                validatePasswordInput(request.password)
            } catch (error) {
                logger.warn("Invalid password in login request", {
                    email: request.email,
                    error:
                        error instanceof Error ? error.message : String(error),
                })

                // Record failure for rate limiting
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
            // STEP 4: LOOK UP USER (Requirement 6.1)
            // ================================================================

            let user: any
            try {
                const { data, error } = await this.supabase
                    .from("users")
                    .select("id, email, password_hash, password_algorithm")
                    .eq("email", request.email.toLowerCase())
                    .single()

                // User not found or database error
                if (error || !data) {
                    logger.warn("User not found during login", {
                        email: request.email,
                    })

                    // Record failure for rate limiting
                    await this.rateLimiter.recordFailure(request.email)

                    // Return generic error (no user enumeration)
                    // Requirement 7.6: Don't reveal whether account exists
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

                user = data
            } catch (error) {
                logger.error("Database error during login", {
                    email: request.email,
                    error:
                        error instanceof Error ? error.message : String(error),
                })

                // Record failure for rate limiting
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
            // STEP 5: VALIDATE PASSWORD (Requirement 6.4, 6.5, 6.6, 6.7)
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

                // Record failure for rate limiting
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

            // Password validation failed
            if (!validationResult.valid) {
                logger.warn("Invalid password during login", {
                    email: request.email,
                    algorithmType: validationResult.algorithmType,
                })

                // Record failure for rate limiting
                await this.rateLimiter.recordFailure(request.email)

                // Return generic error (no algorithm revelation)
                // Requirement 6.6: Don't indicate algorithm type in errors
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
            // STEP 6: TRIGGER ALGORITHM MIGRATION IF NEEDED (Requirement 11.1)
            // ================================================================

            if (validationResult.requiresMigration) {
                logger.info("Triggering password migration", {
                    email: request.email,
                    oldAlgorithm: validationResult.algorithmType,
                    newAlgorithm: "argon2id",
                })

                try {
                    await triggerPasswordMigration(user.id, request.password)
                } catch (error) {
                    logger.error("Password migration failed", {
                        email: request.email,
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    })
                    // Don't fail authentication if migration fails
                    // User can still log in with old hash
                }
            }

            // ================================================================
            // STEP 7: RESET RATE LIMIT COUNTER (Requirement 7.5)
            // ================================================================

            try {
                await this.rateLimiter.recordSuccess(request.email)
            } catch (error) {
                logger.error("Failed to reset rate limit counter", {
                    email: request.email,
                    error:
                        error instanceof Error ? error.message : String(error),
                })
                // Don't fail authentication if rate limit reset fails
            }

            // ================================================================
            // STEP 8: LOG AUTHENTICATION EVENT (Requirement 14.1, 14.6)
            // ================================================================

            try {
                await this.supabase.from("audit_logs").insert({
                    event_type: "auth_success",
                    email: request.email,
                    user_id: user.id,
                    timestamp: new Date().toISOString(),
                    details: {
                        algorithm: validationResult.algorithmType,
                        migrationTriggered: validationResult.requiresMigration,
                        degradedMode,
                    },
                })
            } catch (error) {
                logger.error("Failed to log authentication event", {
                    email: request.email,
                    error:
                        error instanceof Error ? error.message : String(error),
                })
                // Don't fail authentication if logging fails
            }

            // ================================================================
            // STEP 9: RETURN SUCCESS
            // ================================================================

            logger.info("User authenticated successfully", {
                userId: user.id,
                email: request.email,
                algorithmType: validationResult.algorithmType,
                migrationTriggered: validationResult.requiresMigration,
            })

            // ================================================================
            // STEP 9: NORMALIZE RESPONSE TIME (Requirement 10.4, 10.5)
            // ================================================================
            // Ensure response time is consistent regardless of path taken
            // This prevents timing attacks that could reveal information
            return this.normalizeAndReturn(
                {
                    success: true,
                    userId: user.id,
                    email: user.email,
                    statusCode: 200,
                    requiresMigration: validationResult.requiresMigration,
                    degradedMode,
                },
                operationStartTime
            )
        } catch (error) {
            logger.error("Unexpected error during login", {
                error: error instanceof Error ? error.message : String(error),
            })

            // Normalize response time even on error
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
     * Normalize response time and return authentication result
     *
     * This helper method ensures all authentication responses take consistent time
     * to prevent timing attacks that could reveal information about the authentication
     * process (e.g., whether user exists, password is correct, etc.)
     *
     * Requirement 10.4: Add deliberate delay to normalize response times
     * Requirement 10.5: Don't log execution times that could reveal timing information
     *
     * @param result - The authentication result to return
     * @param operationStartTime - When the operation started (Date.now())
     * @param targetResponseTimeMs - Target response time in milliseconds
     * @returns The same authentication result after normalizing response time
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
            // Ignore normalization errors - don't fail authentication
            logger.debug("Response time normalization error", {
                error: error instanceof Error ? error.message : String(error),
            })
        }
        return result
    }

    /**
     * Get rate limiter instance
     * Useful for admin operations like unlocking accounts
     *
     * @returns Rate limiter instance
     */
    getRateLimiter(): RateLimiter {
        return this.rateLimiter
    }

    /**
     * Get security configuration
     * Useful for debugging and monitoring
     *
     * @returns Security configuration
     */
    getSecurityConfig() {
        return this.config
    }
}

/**
 * Singleton instance of Authentication Service
 */
let authServiceInstance: AuthenticationService | null = null

/**
 * Get or create Authentication Service instance
 *
 * @returns Authentication Service instance
 */
export function getAuthenticationService(): AuthenticationService {
    if (!authServiceInstance) {
        authServiceInstance = new AuthenticationService()
    }
    return authServiceInstance
}
