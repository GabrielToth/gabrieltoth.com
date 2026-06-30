/**
 * Registration Service
 * Purpose: Handle new user registration with CAPTCHA validation, password hashing,
 * and user creation. Extracted from AuthenticationService for SRP and testability.
 *
 * Requirements covered:
 * - Requirement 1: Argon2id Password Hashing
 * - Requirement 3: Pepper Security Layer
 * - Requirement 6: Password Hash Validation
 * - Requirement 8: Input Validation
 * - Requirement 9: Security Against Attack Vectors
 * - Requirement 14: Error Handling and Logging
 * - Requirement 20: CAPTCHA Protection Against Automated Attacks
 */

import { verifyCAPTCHAWithFallback } from "@/lib/auth/captcha-verifier"
import { logger } from "@/lib/logger"
import {
    hashPasswordArgon2id,
    normalizeResponseTime,
    validatePasswordInput,
} from "./index"
import type {
    AuthenticationResult,
    RegistrationRequest,
} from "./authentication-service"
import type {
    IAuthAuditService,
    IAuthRepository,
    IRateLimiter,
    ISecurityConfig,
} from "./auth-service-types"

/**
 * Result of password hashing with metadata
 */
interface HashResultWithMeta {
    hash: string
    algorithm: string
    timeTakenMs: number
    performanceWarning: boolean
}

/**
 * Registration Service
 *
 * Handles the registration flow:
 * 1. CAPTCHA validation
 * 2. Input validation
 * 3. Email existence check
 * 4. Password hashing with Argon2id
 * 5. User creation
 * 6. Audit logging
 * 7. Response time normalization
 */
export class RegistrationService {
    constructor(
        private readonly authRepository: IAuthRepository,
        private readonly authAuditService: IAuthAuditService,
        private readonly rateLimiter: IRateLimiter,
        private readonly securityConfig: ISecurityConfig
    ) {}

    /**
     * Register a new user
     *
     * @param request - Registration request data
     * @returns Authentication result
     */
    async register(
        request: RegistrationRequest
    ): Promise<AuthenticationResult> {
        const operationStartTime = Date.now()

        try {
            // STEP 1: Validate CAPTCHA
            const captchaResult = await this.validateCaptcha(request)
            if (captchaResult) {
                return captchaResult
            }

            // STEP 2: Validate input
            const inputResult = this.validateInput(request)
            if (inputResult) {
                return inputResult
            }

            // STEP 3: Check if email already exists
            const emailCheckResult = await this.checkEmailExists(request.email)
            if (emailCheckResult) {
                return emailCheckResult
            }

            // STEP 4: Hash password
            const hashResult = await this.hashPassword(request)
            if (hashResult.errorResult) {
                return hashResult.errorResult
            }

            // STEP 5: Create user
            const createUserResult = await this.createUser(
                request,
                hashResult.hashResult!
            )
            if (createUserResult.errorResult) {
                return createUserResult.errorResult
            }

            // STEP 6: Log registration event
            await this.logRegistration(
                request,
                createUserResult.newUser!,
                hashResult.hashResult!
            )

            // STEP 7-8: Return success with normalized response time
            logger.info("User registered successfully", {
                userId: createUserResult.newUser!.id,
                email: request.email,
            })

            return this.normalizeAndReturn(
                {
                    success: true,
                    userId: createUserResult.newUser!.id,
                    email: createUserResult.newUser!.email,
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
     * Validate CAPTCHA token
     * Returns an error result if validation fails, null if it passes
     */
    private async validateCaptcha(
        request: RegistrationRequest
    ): Promise<AuthenticationResult | null> {
        if (!request.captchaToken) {
            logger.warn("Registration attempt without CAPTCHA token", {
                email: request.email,
            })
            return {
                success: false,
                error: "CAPTCHA verification required",
                errorCode: "CAPTCHA_REQUIRED",
                statusCode: 400,
            }
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

            return {
                success: false,
                error: "Registration failed",
                errorCode: "REGISTRATION_FAILED",
                statusCode: 400,
                degradedMode: captchaResult.degradedMode,
            }
        }

        return null
    }

    /**
     * Validate email and password input
     * Returns an error result if invalid, null if valid
     */
    private validateInput(
        request: RegistrationRequest
    ): AuthenticationResult | null {
        if (!request.email || typeof request.email !== "string") {
            logger.warn("Invalid email in registration request", {
                email: request.email,
            })
            return {
                success: false,
                error: "Invalid email format",
                errorCode: "INVALID_EMAIL",
                statusCode: 400,
            }
        }

        try {
            validatePasswordInput(request.password)
        } catch (error) {
            logger.warn("Invalid password in registration request", {
                email: request.email,
                error: error instanceof Error ? error.message : String(error),
            })
            return {
                success: false,
                error: "Invalid password format",
                errorCode: "INVALID_PASSWORD",
                statusCode: 400,
            }
        }

        return null
    }

    /**
     * Check if email already exists in the system
     * Returns an error result if duplicate, null if available
     */
    private async checkEmailExists(
        email: string
    ): Promise<AuthenticationResult | null> {
        try {
            const exists = await this.authRepository.userExistsByEmail(email)

            if (exists) {
                logger.warn("Registration attempt with existing email", {
                    email,
                })
                return {
                    success: false,
                    error: "Registration failed",
                    errorCode: "REGISTRATION_FAILED",
                    statusCode: 409,
                }
            }

            return null
        } catch (error) {
            logger.error("Database error checking email existence", {
                email,
                error: error instanceof Error ? error.message : String(error),
            })
            return {
                success: false,
                error: "Registration failed",
                errorCode: "DATABASE_ERROR",
                statusCode: 500,
            }
        }
    }

    /**
     * Hash the password using Argon2id
     * Returns hash result or error
     */
    private async hashPassword(request: RegistrationRequest): Promise<{
        hashResult?: HashResultWithMeta
        errorResult?: AuthenticationResult
    }> {
        try {
            const hashResult = (await hashPasswordArgon2id(
                request.password
            )) as unknown as HashResultWithMeta

            if (hashResult.performanceWarning) {
                logger.warn("Password hashing performance warning", {
                    email: request.email,
                    timeTakenMs: hashResult.timeTakenMs,
                })
            }

            return { hashResult }
        } catch (error) {
            logger.error("Password hashing error during registration", {
                email: request.email,
                error: error instanceof Error ? error.message : String(error),
            })
            return {
                errorResult: {
                    success: false,
                    error: "Registration failed",
                    errorCode: "HASHING_ERROR",
                    statusCode: 500,
                },
            }
        }
    }

    /**
     * Create user record in the database
     */
    private async createUser(
        request: RegistrationRequest,
        hashResult: HashResultWithMeta
    ): Promise<{
        newUser?: { id: string; email: string }
        errorResult?: AuthenticationResult
    }> {
        try {
            const newUser = await this.authRepository.createUser({
                email: request.email.toLowerCase(),
                passwordHash: hashResult.hash,
                passwordAlgorithm: hashResult.algorithm,
            })

            return { newUser }
        } catch (error) {
            logger.error("Error creating user record", {
                email: request.email,
                error: error instanceof Error ? error.message : String(error),
            })
            return {
                errorResult: {
                    success: false,
                    error: "Registration failed",
                    errorCode: "DATABASE_ERROR",
                    statusCode: 500,
                },
            }
        }
    }

    /**
     * Log the registration event to audit
     */
    private async logRegistration(
        request: RegistrationRequest,
        newUser: { id: string; email: string },
        hashResult: HashResultWithMeta
    ): Promise<void> {
        try {
            await this.authAuditService.logRegistration({
                email: request.email,
                userId: newUser.id,
                algorithm: hashResult.algorithm,
                hashTimeTakenMs: hashResult.timeTakenMs,
            })
        } catch (error) {
            logger.error("Failed to log registration event", {
                email: request.email,
                error: error instanceof Error ? error.message : String(error),
            })
            // Don't fail registration if logging fails
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
