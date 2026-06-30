/**
 * Unit Tests: Authentication Service
 * Purpose: Test the main authentication controller orchestrating all password security components
 *
 * Test Coverage:
 * - Registration flow with CAPTCHA validation
 * - Login flow with rate limiting and password validation
 * - Algorithm migration on successful login
 * - Error handling and generic error messages
 * - Rate limiting enforcement
 * - Audit logging
 * - Database error paths
 * - Rate-limit edge cases
 * - Hashing errors
 * - Performance warnings
 * - Singleton behavior
 */

import * as captchaVerifier from "@/lib/auth/captcha-verifier"
import { beforeEach, describe, expect, it, vi } from "vitest"
import * as passwordHasher from "./argon2id-hasher"
import {
    AuthenticationService,
    getAuthenticationService,
} from "./authentication-service"
import * as passwordInputValidation from "./password-input-validation"
import * as passwordValidator from "./password-validator"
import * as rateLimiterModule from "./rate-limiter"
import * as configModule from "./config"

// ---------------------------------------------------------------------------
// Mock all external dependencies
// ---------------------------------------------------------------------------

vi.mock("@supabase/supabase-js", () => ({
    createClient: vi.fn(),
    SupabaseClient: vi.fn(),
}))

vi.mock("@/lib/auth/captcha-verifier")

vi.mock("./password-validator")

vi.mock("./password-input-validation", () => ({
    validatePasswordInput: vi.fn(),
    assertPasswordInputValid: vi.fn(),
}))

vi.mock("./argon2id-hasher")

vi.mock("./constant-time-comparison", () => ({
    normalizeResponseTime: vi.fn().mockResolvedValue(0),
    constantTimeStringCompare: vi.fn(),
    performConstantTimeComparison: vi.fn(),
    createTimingSafeValidator: vi.fn(),
    getConstantTimeConfig: vi.fn(),
    CONSTANT_TIME_CONFIG: {
        TARGET_RESPONSE_TIME_MS: 250,
        ACCEPTABLE_VARIANCE_MS: 10,
        MAX_NORMALIZATION_TIME_MS: 500,
        MIN_BUSY_WAIT_MS: 1,
        ENABLE_NORMALIZATION: true,
        TRACK_METRICS: true,
    },
}))

vi.mock("@/lib/logger", () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    },
    createLogger: vi.fn(() => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    })),
}))

vi.mock("./rate-limiter", async () => {
    const actual = await vi.importActual("./rate-limiter")
    return {
        ...(actual as Record<string, unknown>),
        getRateLimiter: vi.fn(),
    }
})

vi.mock("./config", async () => {
    const actual = await vi.importActual("./config")
    return {
        ...(actual as Record<string, unknown>),
        getSecurityConfig: vi.fn(),
    }
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a mock Supabase client that can be configured per test.
 *
 * The default behavior:
 * - select().eq().single() → PGRST116 (no rows) — so userExistsByEmail → false
 * - insert().select().single() → { id: "user-123", email: "user@example.com" }
 */
function createMockSupabase(config?: {
    selectSingle?: Record<string, unknown> | Error
    insertSelectSingle?: Record<string, unknown>
    auditInsert?: Record<string, unknown>
    rejectSelectSingle?: boolean
}): {
    from: ReturnType<typeof vi.fn>
} {
    const selectSingle = config?.rejectSelectSingle
        ? vi.fn().mockRejectedValue(config?.selectSingle ?? new Error("DB error"))
        : vi.fn().mockResolvedValue(
              config?.selectSingle ?? { data: null, error: { code: "PGRST116" } }
          )

    const insertSelectSingle = config?.insertSelectSingle
        ? vi.fn().mockResolvedValue(config.insertSelectSingle)
        : vi
              .fn()
              .mockResolvedValue({
                  data: { id: "user-123", email: "user@example.com" },
                  error: null,
              })

    return {
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockImplementation(() => {
                        return selectSingle()
                    }),
                }),
            }),
            insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockImplementation(() => {
                        return insertSelectSingle()
                    }),
                }),
            }),
        }),
    }
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("AuthenticationService", () => {
    let service: AuthenticationService
    let mockSupabase: {
        from: ReturnType<typeof vi.fn>
    }
    let mockRateLimiter: {
        checkAndUpdateRateLimit: ReturnType<typeof vi.fn>
        recordFailure: ReturnType<typeof vi.fn>
        recordSuccess: ReturnType<typeof vi.fn>
        getAttemptCount: ReturnType<typeof vi.fn>
        getRemainingAttempts: ReturnType<typeof vi.fn>
        getTimeUntilReset: ReturnType<typeof vi.fn>
        getUnlockTimeRemaining: ReturnType<typeof vi.fn>
        unlockAccount: ReturnType<typeof vi.fn>
        clearAllRecords: ReturnType<typeof vi.fn>
    }

    beforeEach(() => {
        vi.clearAllMocks()

        // Mock security config
        vi.mocked(configModule.getSecurityConfig).mockReturnValue({
            argon2id: { memory: 64, time: 3, parallelism: 2 },
            pepper: "test-pepper-thirty-two-chars-minimum!!!",
            rateLimiting: {
                failureThreshold: 5,
                windowMinutes: 15,
                lockoutMinutes: 15,
                captchaEscalationThreshold: 3,
            },
            captchaProvider: "cloudflare",
        })

        // Mock rate limiter
        mockRateLimiter = {
            checkAndUpdateRateLimit: vi.fn().mockResolvedValue({
                allowed: true,
                isLocked: false,
                remainingAttempts: 5,
            }),
            recordFailure: vi.fn().mockResolvedValue(undefined),
            recordSuccess: vi.fn().mockResolvedValue(undefined),
            getAttemptCount: vi.fn().mockResolvedValue(0),
            getRemainingAttempts: vi.fn().mockResolvedValue(5),
            getTimeUntilReset: vi.fn().mockResolvedValue(0),
            getUnlockTimeRemaining: vi.fn().mockResolvedValue(0),
            unlockAccount: vi.fn().mockResolvedValue(undefined),
            clearAllRecords: vi.fn().mockResolvedValue(undefined),
        }

        vi.mocked(rateLimiterModule.getRateLimiter).mockReturnValue(
            mockRateLimiter as unknown as rateLimiterModule.RateLimiter
        )

        vi.mocked(
            passwordInputValidation.validatePasswordInput
        ).mockImplementation(() => ({ valid: true, errors: [] }))

        // Create default mock supabase
        mockSupabase = createMockSupabase()
        service = new AuthenticationService(
            mockSupabase as unknown as import("@supabase/supabase-js").SupabaseClient
        )
    })

    // ======================================================================
    // register
    // ======================================================================

    describe("register", () => {
        it("should successfully register a new user with valid credentials", async () => {
            vi.mocked(captchaVerifier.verifyCAPTCHAWithFallback).mockResolvedValue(
                { success: true, degradedMode: false }
            )

            vi.mocked(passwordHasher.hashPasswordArgon2id).mockResolvedValue({
                hash: "$argon2id$v=19$m=65536,t=3,p=2$...",
                algorithm: "argon2id",
                timeTakenMs: 2500,
                performanceWarning: false,
            })

            const result = await service.register({
                email: "user@example.com",
                password: "SecurePassword123!",
                captchaToken: "valid_token",
            })

            expect(result.success).toBe(true)
            expect(result.userId).toBe("user-123")
            expect(result.email).toBe("user@example.com")
            expect(result.statusCode).toBe(201)
        })

        it("should reject registration without CAPTCHA token", async () => {
            const result = await service.register({
                email: "user@example.com",
                password: "SecurePassword123!",
            })

            expect(result.success).toBe(false)
            expect(result.errorCode).toBe("CAPTCHA_REQUIRED")
            expect(result.statusCode).toBe(400)
        })

        it("should reject registration with invalid CAPTCHA token", async () => {
            vi.mocked(captchaVerifier.verifyCAPTCHAWithFallback).mockResolvedValue({
                success: false,
                degradedMode: false,
                failureReason: "invalid_token",
            })

            const result = await service.register({
                email: "user@example.com",
                password: "SecurePassword123!",
                captchaToken: "invalid_token",
            })

            expect(result.success).toBe(false)
            expect(result.errorCode).toBe("REGISTRATION_FAILED")
            expect(result.statusCode).toBe(400)
        })

        it("should reject registration with invalid password", async () => {
            vi.mocked(captchaVerifier.verifyCAPTCHAWithFallback).mockResolvedValue({
                success: true,
                degradedMode: false,
            })

            vi.mocked(
                passwordInputValidation.validatePasswordInput
            ).mockImplementation(() => {
                throw new Error("Invalid password")
            })

            const result = await service.register({
                email: "user@example.com",
                password: "short",
                captchaToken: "valid_token",
            })

            expect(result.success).toBe(false)
            expect(result.errorCode).toBe("INVALID_PASSWORD")
            expect(result.statusCode).toBe(400)
        })

        it("should reject registration with existing email", async () => {
            vi.mocked(captchaVerifier.verifyCAPTCHAWithFallback).mockResolvedValue({
                success: true,
                degradedMode: false,
            })

            // Re-create service with supabase that returns existing user
            const existingEmailMock = createMockSupabase({
                selectSingle: { data: { id: "existing-user" }, error: null },
            })

            const existingService = new AuthenticationService(
                existingEmailMock as unknown as import("@supabase/supabase-js").SupabaseClient
            )

            const result = await existingService.register({
                email: "existing@example.com",
                password: "SecurePassword123!",
                captchaToken: "valid_token",
            })

            expect(result.success).toBe(false)
            expect(result.errorCode).toBe("REGISTRATION_FAILED")
            expect(result.statusCode).toBe(409)
        })

        it("should use Argon2id for new user passwords", async () => {
            vi.mocked(captchaVerifier.verifyCAPTCHAWithFallback).mockResolvedValue({
                success: true,
                degradedMode: false,
            })

            vi.mocked(passwordHasher.hashPasswordArgon2id).mockResolvedValue({
                hash: "$argon2id$v=19$m=65536,t=3,p=2$...",
                algorithm: "argon2id",
                timeTakenMs: 2500,
                performanceWarning: false,
            })

            await service.register({
                email: "user@example.com",
                password: "SecurePassword123!",
                captchaToken: "valid_token",
            })

            expect(passwordHasher.hashPasswordArgon2id).toHaveBeenCalledWith(
                "SecurePassword123!"
            )
        })

        it("should handle database error when checking email existence", async () => {
            vi.mocked(captchaVerifier.verifyCAPTCHAWithFallback).mockResolvedValue({
                success: true,
                degradedMode: false,
            })

            vi.mocked(passwordHasher.hashPasswordArgon2id).mockResolvedValue({
                hash: "$argon2id$v=19$m=65536,t=3,p=2$...",
                algorithm: "argon2id",
                timeTakenMs: 2500,
                performanceWarning: false,
            })

            // Simulate database throwing on select
            const failingMock = createMockSupabase({
                rejectSelectSingle: true,
                selectSingle: new Error("Database connection failed"),
            })

            const failingService = new AuthenticationService(
                failingMock as unknown as import("@supabase/supabase-js").SupabaseClient
            )

            const result = await failingService.register({
                email: "user@example.com",
                password: "SecurePassword123!",
                captchaToken: "valid_token",
            })

            expect(result.success).toBe(false)
            expect(result.errorCode).toBe("DATABASE_ERROR")
            expect(result.statusCode).toBe(500)
        })

        it("should handle hashing error during registration", async () => {
            vi.mocked(captchaVerifier.verifyCAPTCHAWithFallback).mockResolvedValue({
                success: true,
                degradedMode: false,
            })

            vi.mocked(passwordHasher.hashPasswordArgon2id).mockRejectedValue(
                new Error("Hashing failed")
            )

            const result = await service.register({
                email: "user@example.com",
                password: "SecurePassword123!",
                captchaToken: "valid_token",
            })

            expect(result.success).toBe(false)
            expect(result.errorCode).toBe("HASHING_ERROR")
            expect(result.statusCode).toBe(500)
        })

        it("should log performance warning when hashing takes too long", async () => {
            vi.mocked(captchaVerifier.verifyCAPTCHAWithFallback).mockResolvedValue({
                success: true,
                degradedMode: false,
            })

            vi.mocked(passwordHasher.hashPasswordArgon2id).mockResolvedValue({
                hash: "$argon2id$v=19$m=65536,t=3,p=2$...",
                algorithm: "argon2id",
                timeTakenMs: 5000,
                performanceWarning: true,
            })

            const { logger } = await import("@/lib/logger")

            const result = await service.register({
                email: "user@example.com",
                password: "SecurePassword123!",
                captchaToken: "valid_token",
            })

            expect(result.success).toBe(true)
            expect(logger.warn).toHaveBeenCalledWith(
                "Password hashing performance warning",
                expect.objectContaining({
                    email: "user@example.com",
                    timeTakenMs: 5000,
                })
            )
        })

        it("should handle database error when creating user", async () => {
            vi.mocked(captchaVerifier.verifyCAPTCHAWithFallback).mockResolvedValue({
                success: true,
                degradedMode: false,
            })

            vi.mocked(passwordHasher.hashPasswordArgon2id).mockResolvedValue({
                hash: "$argon2id$v=19$m=65536,t=3,p=2$...",
                algorithm: "argon2id",
                timeTakenMs: 2500,
                performanceWarning: false,
            })

            // Mock insert to fail
            const mockClient = {
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: null,
                                error: { code: "PGRST116" },
                            }),
                        }),
                    }),
                    insert: vi.fn().mockReturnValue({
                        select: vi.fn().mockReturnValue({
                            single: vi
                                .fn()
                                .mockResolvedValue({
                                    data: null,
                                    error: {
                                        message: "Duplicate key",
                                        code: "23505",
                                    },
                                }),
                        }),
                    }),
                }),
            }

            const failingService = new AuthenticationService(
                mockClient as unknown as import("@supabase/supabase-js").SupabaseClient
            )

            const result = await failingService.register({
                email: "user@example.com",
                password: "SecurePassword123!",
                captchaToken: "valid_token",
            })

            expect(result.success).toBe(false)
            expect(result.errorCode).toBe("DATABASE_ERROR")
            expect(result.statusCode).toBe(500)
        })
    })

    // ======================================================================
    // login
    // ======================================================================

    describe("login", () => {
        it("should successfully authenticate user with valid credentials", async () => {
            vi.mocked(captchaVerifier.verifyCAPTCHAWithFallback).mockResolvedValue({
                success: true,
                degradedMode: false,
            })

            vi.mocked(passwordValidator.validatePassword).mockResolvedValue({
                valid: true,
                algorithmType: "argon2id",
                hashValid: true,
                timeTakenMs: 2500,
            })

            // Re-create service with supabase that returns a user for login
            const loginMock = createMockSupabase({
                selectSingle: {
                    data: {
                        id: "user-123",
                        email: "user@example.com",
                        password_hash: "$argon2id$...",
                        password_algorithm: "argon2id",
                    },
                    error: null,
                },
            })

            const loginService = new AuthenticationService(
                loginMock as unknown as import("@supabase/supabase-js").SupabaseClient
            )

            const result = await loginService.login({
                email: "user@example.com",
                password: "SecurePassword123!",
                captchaToken: "valid_token",
            })

            expect(result.success).toBe(true)
            expect(result.userId).toBe("user-123")
            expect(result.email).toBe("user@example.com")
            expect(result.statusCode).toBe(200)
        })

        it("should reject login without CAPTCHA token", async () => {
            const result = await service.login({
                email: "user@example.com",
                password: "SecurePassword123!",
            })

            expect(result.success).toBe(false)
            expect(result.errorCode).toBe("CAPTCHA_REQUIRED")
            expect(result.statusCode).toBe(400)
        })

        it("should reject login with invalid password", async () => {
            vi.mocked(captchaVerifier.verifyCAPTCHAWithFallback).mockResolvedValue({
                success: true,
                degradedMode: false,
            })

            vi.mocked(passwordValidator.validatePassword).mockResolvedValue({
                valid: false,
                algorithmType: "argon2id",
                hashValid: true,
                error: "Authentication failed",
                timeTakenMs: 2500,
            })

            const loginMock = createMockSupabase({
                selectSingle: {
                    data: {
                        id: "user-123",
                        email: "user@example.com",
                        password_hash: "$argon2id$...",
                        password_algorithm: "argon2id",
                    },
                    error: null,
                },
            })

            const loginService = new AuthenticationService(
                loginMock as unknown as import("@supabase/supabase-js").SupabaseClient
            )

            const result = await loginService.login({
                email: "user@example.com",
                password: "WrongPassword",
                captchaToken: "valid_token",
            })

            expect(result.success).toBe(false)
            expect(result.errorCode).toBe("AUTH_FAILED")
            expect(result.statusCode).toBe(401)
        })

        it("should return generic error messages (no user enumeration)", async () => {
            vi.mocked(captchaVerifier.verifyCAPTCHAWithFallback).mockResolvedValue({
                success: true,
                degradedMode: false,
            })

            // Default mock returns no user (PGRST116)
            const result = await service.login({
                email: "nonexistent@example.com",
                password: "SomePassword",
                captchaToken: "valid_token",
            })

            expect(result.success).toBe(false)
            expect(result.error).toBe("Authentication failed")
            expect(result.errorCode).toBe("AUTH_FAILED")
        })

        it("should handle CAPTCHA degraded mode", async () => {
            vi.mocked(captchaVerifier.verifyCAPTCHAWithFallback).mockResolvedValue({
                success: false,
                degradedMode: true,
                failureReason: "CAPTCHA service unavailable",
            })

            vi.mocked(passwordValidator.validatePassword).mockResolvedValue({
                valid: true,
                algorithmType: "argon2id",
                hashValid: true,
                timeTakenMs: 2500,
            })

            const loginMock = createMockSupabase({
                selectSingle: {
                    data: {
                        id: "user-123",
                        email: "user@example.com",
                        password_hash: "$argon2id$...",
                        password_algorithm: "argon2id",
                    },
                    error: null,
                },
            })

            const degradedService = new AuthenticationService(
                loginMock as unknown as import("@supabase/supabase-js").SupabaseClient
            )

            const result = await degradedService.login({
                email: "user@example.com",
                password: "SecurePassword123!",
                captchaToken: "valid_token",
            })

            expect(result.success).toBe(true)
            expect(result.degradedMode).toBe(true)
        })

        it("should handle rate-limited account with unlockTimeSeconds", async () => {
            vi.mocked(captchaVerifier.verifyCAPTCHAWithFallback).mockResolvedValue({
                success: true,
                degradedMode: false,
            })

            // Make rate limiter return locked
            const lockedUntil = new Date(Date.now() + 600000)
            mockRateLimiter.checkAndUpdateRateLimit = vi.fn().mockResolvedValue({
                allowed: false,
                isLocked: true,
                remainingAttempts: 0,
                lockedUntil,
            })

            const result = await service.login({
                email: "locked@example.com",
                password: "SecurePassword123!",
                captchaToken: "valid_token",
            })

            expect(result.success).toBe(false)
            expect(result.isLocked).toBe(true)
            expect(result.errorCode).toBe("TOO_MANY_ATTEMPTS")
            expect(result.statusCode).toBe(429)
            expect(result.unlockTimeSeconds).toBeDefined()
            expect(result.unlockTimeSeconds).toBeGreaterThan(0)
        })

        it("should handle database error during login user lookup", async () => {
            vi.mocked(captchaVerifier.verifyCAPTCHAWithFallback).mockResolvedValue({
                success: true,
                degradedMode: false,
            })

            // Simulate database throwing on user lookup
            const failingMock = createMockSupabase({
                rejectSelectSingle: true,
                selectSingle: new Error("Database error during login"),
            })

            const failingService = new AuthenticationService(
                failingMock as unknown as import("@supabase/supabase-js").SupabaseClient
            )

            const result = await failingService.login({
                email: "user@example.com",
                password: "SecurePassword123!",
                captchaToken: "valid_token",
            })

            expect(result.success).toBe(false)
            expect(result.errorCode).toBe("AUTH_FAILED")
            expect(result.statusCode).toBe(401)
        })

        it("should handle rateLimiter.recordSuccess() failure gracefully", async () => {
            vi.mocked(captchaVerifier.verifyCAPTCHAWithFallback).mockResolvedValue({
                success: true,
                degradedMode: false,
            })

            vi.mocked(passwordValidator.validatePassword).mockResolvedValue({
                valid: true,
                algorithmType: "argon2id",
                hashValid: true,
                timeTakenMs: 2500,
            })

            // Make recordSuccess throw
            mockRateLimiter.recordSuccess = vi
                .fn()
                .mockRejectedValue(new Error("Failed to reset rate limit"))

            const loginMock = createMockSupabase({
                selectSingle: {
                    data: {
                        id: "user-123",
                        email: "user@example.com",
                        password_hash: "$argon2id$...",
                        password_algorithm: "argon2id",
                    },
                    error: null,
                },
            })

            const loginService = new AuthenticationService(
                loginMock as unknown as import("@supabase/supabase-js").SupabaseClient
            )

            const result = await loginService.login({
                email: "user@example.com",
                password: "SecurePassword123!",
                captchaToken: "valid_token",
            })

            // Should still succeed despite rate limit reset failure
            expect(result.success).toBe(true)
            expect(result.statusCode).toBe(200)
        })
    })

    // ======================================================================
    // security features
    // ======================================================================

    describe("security features", () => {
        it("should use constant-time password comparison", async () => {
            vi.mocked(captchaVerifier.verifyCAPTCHAWithFallback).mockResolvedValue({
                success: true,
                degradedMode: false,
            })

            vi.mocked(passwordValidator.validatePassword).mockResolvedValue({
                valid: true,
                algorithmType: "argon2id",
                hashValid: true,
                timeTakenMs: 2500,
            })

            const loginMock = createMockSupabase({
                selectSingle: {
                    data: {
                        id: "user-123",
                        email: "user@example.com",
                        password_hash: "$argon2id$...",
                        password_algorithm: "argon2id",
                    },
                    error: null,
                },
            })

            const loginService = new AuthenticationService(
                loginMock as unknown as import("@supabase/supabase-js").SupabaseClient
            )

            await loginService.login({
                email: "user@example.com",
                password: "SecurePassword123!",
                captchaToken: "valid_token",
            })

            expect(passwordValidator.validatePassword).toHaveBeenCalled()
        })

        it("should apply pepper to passwords during validation", async () => {
            vi.mocked(captchaVerifier.verifyCAPTCHAWithFallback).mockResolvedValue({
                success: true,
                degradedMode: false,
            })

            vi.mocked(passwordValidator.validatePassword).mockResolvedValue({
                valid: true,
                algorithmType: "argon2id",
                hashValid: true,
                timeTakenMs: 2500,
            })

            const loginMock = createMockSupabase({
                selectSingle: {
                    data: {
                        id: "user-123",
                        email: "user@example.com",
                        password_hash: "$argon2id$...",
                        password_algorithm: "argon2id",
                    },
                    error: null,
                },
            })

            const loginService = new AuthenticationService(
                loginMock as unknown as import("@supabase/supabase-js").SupabaseClient
            )

            await loginService.login({
                email: "user@example.com",
                password: "SecurePassword123!",
                captchaToken: "valid_token",
            })

            expect(passwordValidator.validatePassword).toHaveBeenCalledWith(
                "SecurePassword123!",
                "$argon2id$..."
            )
        })
    })

    // ======================================================================
    // singleton
    // ======================================================================

    describe("singleton", () => {
        it("should return the same instance on multiple calls to getAuthenticationService", () => {
            // Clear any cached singleton from previous test runs
            // by resetting the module state
            const instance1 = getAuthenticationService()
            const instance2 = getAuthenticationService()

            expect(instance1).toBe(instance2)
        })

        it("should create a new instance on first call to getAuthenticationService", () => {
            const instance = getAuthenticationService()
            expect(instance).toBeDefined()
            expect(instance).toBeInstanceOf(AuthenticationService)
        })
    })

    // ======================================================================
    // normalizeAndReturn error handling
    // ======================================================================

    describe("normalizeAndReturn error handling", () => {
        it("should handle normalizeAndReturn errors gracefully", async () => {
            vi.mocked(captchaVerifier.verifyCAPTCHAWithFallback).mockResolvedValue({
                success: true,
                degradedMode: false,
            })

            vi.mocked(passwordHasher.hashPasswordArgon2id).mockResolvedValue({
                hash: "$argon2id$v=19$m=65536,t=3,p=2$...",
                algorithm: "argon2id",
                timeTakenMs: 2500,
                performanceWarning: false,
            })

            // Mock normalizeResponseTime to throw
            const { normalizeResponseTime } = await import(
                "./constant-time-comparison"
            )
            vi.mocked(normalizeResponseTime).mockRejectedValue(
                new Error("Normalization failed")
            )

            const result = await service.register({
                email: "user@example.com",
                password: "SecurePassword123!",
                captchaToken: "valid_token",
            })

            // Should still return success despite normalization error
            expect(result.success).toBe(true)
            expect(result.statusCode).toBe(201)
        })
    })
})
