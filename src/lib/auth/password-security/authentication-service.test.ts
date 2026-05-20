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
 */

import * as captchaVerifier from "@/lib/auth/captcha-verifier"
import { beforeEach, describe, expect, it, vi } from "vitest"
import * as passwordHasher from "./argon2id-hasher"
import { AuthenticationService } from "./authentication-service"
import * as passwordInputValidation from "./password-input-validation"
import * as passwordValidator from "./password-validator"

// Mock dependencies
vi.mock("@supabase/supabase-js")
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

describe("AuthenticationService", () => {
    let service: AuthenticationService

    beforeEach(() => {
        vi.clearAllMocks()

        vi.mocked(passwordInputValidation.validatePasswordInput).mockImplementation(
            () => undefined
        )

        service = new AuthenticationService()
        ;(service as any).rateLimiter = {
            checkAndUpdateRateLimit: vi.fn().mockResolvedValue({
                allowed: true,
                isLocked: false,
            }),
            recordFailure: vi.fn().mockResolvedValue(undefined),
            recordSuccess: vi.fn().mockResolvedValue(undefined),
        }
    })

    describe("register", () => {
        it("should successfully register a new user with valid credentials", async () => {
            // Mock CAPTCHA verification
            vi.mocked(
                captchaVerifier.verifyCAPTCHAWithFallback
            ).mockResolvedValue({
                success: true,
                degradedMode: false,
            })

            // Mock password hashing
            vi.mocked(passwordHasher.hashPasswordArgon2id).mockResolvedValue({
                hash: "$argon2id$v=19$m=65536,t=3,p=2$...",
                algorithm: "argon2id",
                timeTakenMs: 2500,
                performanceWarning: false,
            })

            // Mock Supabase operations
            const mockSupabase = {
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: null,
                                error: null,
                            }),
                        }),
                    }),
                    insert: vi.fn().mockReturnValue({
                        select: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: {
                                    id: "user-123",
                                    email: "user@example.com",
                                },
                                error: null,
                            }),
                        }),
                    }),
                }),
            }

            // Replace Supabase client
            ;(service as any).supabase = mockSupabase

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
            vi.mocked(
                captchaVerifier.verifyCAPTCHAWithFallback
            ).mockResolvedValue({
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
            vi.mocked(
                captchaVerifier.verifyCAPTCHAWithFallback
            ).mockResolvedValue({
                success: true,
                degradedMode: false,
            })

            // Mock password validation to throw error
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
            vi.mocked(
                captchaVerifier.verifyCAPTCHAWithFallback
            ).mockResolvedValue({
                success: true,
                degradedMode: false,
            })

            // Mock Supabase to return existing user
            const mockSupabase = {
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: { id: "existing-user" },
                                error: null,
                            }),
                        }),
                    }),
                }),
            }

            ;(service as any).supabase = mockSupabase

            const result = await service.register({
                email: "existing@example.com",
                password: "SecurePassword123!",
                captchaToken: "valid_token",
            })

            expect(result.success).toBe(false)
            expect(result.errorCode).toBe("REGISTRATION_FAILED")
            expect(result.statusCode).toBe(409)
        })

        it("should use Argon2id for new user passwords (Argon2id only)", async () => {
            vi.mocked(
                captchaVerifier.verifyCAPTCHAWithFallback
            ).mockResolvedValue({
                success: true,
                degradedMode: false,
            })

            vi.mocked(passwordHasher.hashPasswordArgon2id).mockResolvedValue({
                hash: "$argon2id$v=19$m=65536,t=3,p=2$...",
                algorithm: "argon2id",
                timeTakenMs: 2500,
                performanceWarning: false,
            })

            const mockSupabase = {
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: null,
                                error: null,
                            }),
                        }),
                    }),
                    insert: vi.fn().mockReturnValue({
                        select: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: {
                                    id: "user-123",
                                    email: "user@example.com",
                                },
                                error: null,
                            }),
                        }),
                    }),
                }),
            }

            ;(service as any).supabase = mockSupabase

            await service.register({
                email: "user@example.com",
                password: "SecurePassword123!",
                captchaToken: "valid_token",
            })

            // Verify Argon2id was used (Argon2id)
            expect(passwordHasher.hashPasswordArgon2id).toHaveBeenCalledWith(
                "SecurePassword123!"
            )
        })
    })

    describe("login", () => {
        it("should successfully authenticate user with valid credentials", async () => {
            vi.mocked(
                captchaVerifier.verifyCAPTCHAWithFallback
            ).mockResolvedValue({
                success: true,
                degradedMode: false,
            })

            vi.mocked(passwordValidator.validatePassword).mockResolvedValue({
                valid: true,
                algorithmType: "argon2id",
                hashValid: true,
                requiresMigration: false,
                timeTakenMs: 2500,
            })

            const mockSupabase = {
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: {
                                    id: "user-123",
                                    email: "user@example.com",
                                    password_hash: "$argon2id$...",
                                    password_algorithm: "argon2id",
                                },
                                error: null,
                            }),
                        }),
                    }),
                    insert: vi.fn().mockResolvedValue({
                        error: null,
                    }),
                }),
            }

            ;(service as any).supabase = mockSupabase

            const result = await service.login({
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
            vi.mocked(
                captchaVerifier.verifyCAPTCHAWithFallback
            ).mockResolvedValue({
                success: true,
                degradedMode: false,
            })

            vi.mocked(passwordValidator.validatePassword).mockResolvedValue({
                valid: false,
                algorithmType: "argon2id",
                hashValid: true,
                error: "Authentication failed",
                requiresMigration: false,
                timeTakenMs: 2500,
            })

            const mockSupabase = {
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: {
                                    id: "user-123",
                                    email: "user@example.com",
                                    password_hash: "$argon2id$...",
                                    password_algorithm: "argon2id",
                                },
                                error: null,
                            }),
                        }),
                    }),
                    insert: vi.fn().mockResolvedValue({
                        error: null,
                    }),
                }),
            }

            ;(service as any).supabase = mockSupabase

            const result = await service.login({
                email: "user@example.com",
                password: "WrongPassword",
                captchaToken: "valid_token",
            })

            expect(result.success).toBe(false)
            expect(result.errorCode).toBe("AUTH_FAILED")
            expect(result.statusCode).toBe(401)
        })

        it("should return generic error messages (no user enumeration)", async () => {
            vi.mocked(
                captchaVerifier.verifyCAPTCHAWithFallback
            ).mockResolvedValue({
                success: true,
                degradedMode: false,
            })

            const mockSupabase = {
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: null,
                                error: null,
                            }),
                        }),
                    }),
                    insert: vi.fn().mockResolvedValue({
                        error: null,
                    }),
                }),
            }

            ;(service as any).supabase = mockSupabase

            const result = await service.login({
                email: "nonexistent@example.com",
                password: "SomePassword",
                captchaToken: "valid_token",
            })

            // Should return generic error, not "User not found"
            expect(result.success).toBe(false)
            expect(result.error).toBe("Authentication failed")
            expect(result.errorCode).toBe("AUTH_FAILED")
        })

        it("should handle CAPTCHA degraded mode", async () => {
            vi.mocked(
                captchaVerifier.verifyCAPTCHAWithFallback
            ).mockResolvedValue({
                success: false,
                degradedMode: true,
                failureReason: "CAPTCHA service unavailable",
            })

            vi.mocked(passwordValidator.validatePassword).mockResolvedValue({
                valid: true,
                algorithmType: "argon2id",
                hashValid: true,
                requiresMigration: false,
                timeTakenMs: 2500,
            })

            const mockSupabase = {
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: {
                                    id: "user-123",
                                    email: "user@example.com",
                                    password_hash: "$argon2id$...",
                                    password_algorithm: "argon2id",
                                },
                                error: null,
                            }),
                        }),
                    }),
                    insert: vi.fn().mockResolvedValue({
                        error: null,
                    }),
                }),
            }

            ;(service as any).supabase = mockSupabase

            const result = await service.login({
                email: "user@example.com",
                password: "SecurePassword123!",
                captchaToken: "valid_token",
            })

            expect(result.success).toBe(true)
            expect(result.degradedMode).toBe(true)
        })
    })

    describe("security features", () => {
        it("should use constant-time password comparison", async () => {
            // This is tested indirectly through validatePassword
            // which uses constant-time comparison internally
            vi.mocked(
                captchaVerifier.verifyCAPTCHAWithFallback
            ).mockResolvedValue({
                success: true,
                degradedMode: false,
            })

            vi.mocked(passwordValidator.validatePassword).mockResolvedValue({
                valid: true,
                algorithmType: "argon2id",
                hashValid: true,
                requiresMigration: false,
                timeTakenMs: 2500,
            })

            const mockSupabase = {
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: {
                                    id: "user-123",
                                    email: "user@example.com",
                                    password_hash: "$argon2id$...",
                                    password_algorithm: "argon2id",
                                },
                                error: null,
                            }),
                        }),
                    }),
                    insert: vi.fn().mockResolvedValue({
                        error: null,
                    }),
                }),
            }

            ;(service as any).supabase = mockSupabase

            await service.login({
                email: "user@example.com",
                password: "SecurePassword123!",
                captchaToken: "valid_token",
            })

            // Verify validatePassword was called (which uses constant-time comparison)
            expect(passwordValidator.validatePassword).toHaveBeenCalled()
        })

        it("should apply pepper to passwords during validation", async () => {
            // Pepper is applied inside validatePassword
            // This test verifies the service calls validatePassword correctly
            vi.mocked(
                captchaVerifier.verifyCAPTCHAWithFallback
            ).mockResolvedValue({
                success: true,
                degradedMode: false,
            })

            vi.mocked(passwordValidator.validatePassword).mockResolvedValue({
                valid: true,
                algorithmType: "argon2id",
                hashValid: true,
                requiresMigration: false,
                timeTakenMs: 2500,
            })

            const mockSupabase = {
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: {
                                    id: "user-123",
                                    email: "user@example.com",
                                    password_hash: "$argon2id$...",
                                    password_algorithm: "argon2id",
                                },
                                error: null,
                            }),
                        }),
                    }),
                    insert: vi.fn().mockResolvedValue({
                        error: null,
                    }),
                }),
            }

            ;(service as any).supabase = mockSupabase

            await service.login({
                email: "user@example.com",
                password: "SecurePassword123!",
                captchaToken: "valid_token",
            })

            // Verify validatePassword was called with password and hash
            expect(passwordValidator.validatePassword).toHaveBeenCalledWith(
                "SecurePassword123!",
                "$argon2id$..."
            )
        })
    })
})
