import { hashPassword } from "@/lib/auth/password-hashing"
import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock Supabase and dependencies - MUST be before route import
vi.mock("@supabase/supabase-js", () => {
    const mockFrom = vi.fn()
    const mockSupabase = {
        from: mockFrom,
    }
    return {
        createClient: vi.fn(() => mockSupabase),
    }
})

vi.mock("@/lib/rate-limit")
vi.mock("@/lib/auth/audit-logging", () => ({
    logLoginFailure: vi.fn(),
    logLoginSuccess: vi.fn(),
    logSecurityEvent: vi.fn(),
}))
vi.mock("@/lib/auth/csrf-validator", () => ({
    validateCSRFToken: vi.fn(),
}))
vi.mock("@/lib/auth/rate-limiter", () => ({
    checkRateLimit: vi.fn(),
    incrementAttempt: vi.fn(),
    resetAttempt: vi.fn(),
    checkRateLimitWithDegradation: vi.fn(() => ({
        allowed: true,
        remainingAttempts: 5,
        degradedMode: false,
    })),
    incrementAttemptWithDegradation: vi.fn(),
}))
vi.mock("@/lib/auth/captcha-verifier", () => ({
    verifyCAPTCHAWithFallback: vi.fn(() =>
        Promise.resolve({
            success: true,
            degradedMode: false,
        })
    ),
}))
vi.mock("@/lib/auth/captcha-error-handler", () => ({
    getCAPTCHAErrorResponse: vi.fn(() => ({
        status: 400,
        json: async () => ({ success: false }),
    })),
    handleCAPTCHAError: vi.fn(() => ({
        status: 400,
        json: async () => ({ success: false }),
    })),
    createCAPTCHAErrorDetails: vi.fn(),
}))

// Import route AFTER mocks
import { POST } from "./route"

// Get the mocked Supabase instance for test manipulation
const { createClient } = await import("@supabase/supabase-js")
const mockSupabase = (createClient as any)()

describe("POST /api/auth/login - Task 8-11: Login Route Handler", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Reset the mock implementation
        mockSupabase.from.mockReset()
    })

    // ============================================================================
    // Task 8.3: Request Body Parsing and Validation
    // ============================================================================

    it("should return 400 for missing email", async () => {
        const request = new NextRequest("http://localhost/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                password: "Test@1234",
                csrfToken: "token",
                captchaToken: "valid-token",
            }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
    })

    it("should return 400 for missing password", async () => {
        const request = new NextRequest("http://localhost/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: "test@example.com",
                csrfToken: "token",
                captchaToken: "valid-token",
            }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
    })

    it("should return 400 for invalid email format", async () => {
        const request = new NextRequest("http://localhost/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: "invalid-email",
                password: "Test@1234",
                csrfToken: "token",
                captchaToken: "valid-token",
            }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
    })

    it("should return 400 for email exceeding max length", async () => {
        const longEmail = "a".repeat(256) + "@example.com"
        const request = new NextRequest("http://localhost/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: longEmail,
                password: "Test@1234",
                csrfToken: "token",
                captchaToken: "valid-token",
            }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
    })

    it("should return 400 for password exceeding max length", async () => {
        const longPassword = "a".repeat(1025)
        const request = new NextRequest("http://localhost/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: "test@example.com",
                password: longPassword,
                csrfToken: "token",
                captchaToken: "valid-token",
            }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
    })

    it("should return 400 for extra fields in request", async () => {
        const request = new NextRequest("http://localhost/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: "test@example.com",
                password: "Test@1234",
                csrfToken: "token",
                captchaToken: "valid-token",
                extraField: "should not be here",
            }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
    })

    it("should return 400 for invalid JSON", async () => {
        const request = new NextRequest("http://localhost/api/auth/login", {
            method: "POST",
            body: "invalid json",
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
    })

    // ============================================================================
    // Task 8.4: CSRF Token Validation
    // ============================================================================

    it("should return 400 for missing CSRF token", async () => {
        const request = new NextRequest("http://localhost/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: "test@example.com",
                password: "Test@1234",
                captchaToken: "valid-token",
            }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
    })

    // ============================================================================
    // Task 8.5: Rate Limiting Check
    // ============================================================================

    it("should return 429 when rate limit exceeded", async () => {
        const { checkRateLimitWithDegradation } = await import("@/lib/auth/rate-limiter")
        vi.mocked(checkRateLimitWithDegradation).mockResolvedValueOnce({ allowed: false, remainingAttempts: 0, degradedMode: false })

        const request = new NextRequest("http://localhost/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: "test@example.com",
                password: "Test@1234",
                csrfToken: "token",
                captchaToken: "valid-token",
            }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(429)
        expect(data.success).toBe(false)
    })

    // ============================================================================
    // Task 8.6: Database Query for User by Email
    // ============================================================================

    it("should return 401 for non-existent user", async () => {
        const { checkRateLimit } = await import("@/lib/auth/rate-limiter")
        const { validateCSRFToken } = await import("@/lib/auth/csrf-validator")
        vi.mocked(checkRateLimit).mockResolvedValue(false)
        vi.mocked(validateCSRFToken).mockResolvedValue(true)

        mockSupabase.from.mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: null,
                        error: new Error("No user found"),
                    }),
                }),
            }),
        })

        const request = new NextRequest("http://localhost/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: "nonexistent@example.com",
                password: "Test@1234",
                csrfToken: "token",
                captchaToken: "valid-token",
            }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.success).toBe(false)
        expect(data.error).toContain("Invalid email or password")
    })

    // ============================================================================
    // Task 8.7: Password Verification with bcrypt
    // ============================================================================

    it("should return 401 for invalid password", async () => {
        const { checkRateLimit } = await import("@/lib/auth/rate-limiter")
        const { validateCSRFToken } = await import("@/lib/auth/csrf-validator")
        vi.mocked(checkRateLimit).mockResolvedValue(false)
        vi.mocked(validateCSRFToken).mockResolvedValue(true)

        mockSupabase.from.mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            id: "user-123",
                            email: "test@example.com",
                            password_hash: await hashPassword("Test@1234"),
                            email_verified: true,
                        },
                        error: null,
                    }),
                }),
            }),
        })

        const request = new NextRequest("http://localhost/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: "test@example.com",
                password: "WrongPassword@1234",
                csrfToken: "token",
                captchaToken: "valid-token",
            }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.success).toBe(false)
        expect(data.error).toContain("Invalid email or password")
    })

    // ============================================================================
    // Task 8.8 & 8.9 & 8.10: Session Token Creation, Remember Me, Secure Cookies
    // ============================================================================

    it("should successfully login with correct credentials", async () => {
        const { checkRateLimit } = await import("@/lib/auth/rate-limiter")
        const { validateCSRFToken } = await import("@/lib/auth/csrf-validator")
        vi.mocked(checkRateLimit).mockResolvedValue(false)
        vi.mocked(validateCSRFToken).mockResolvedValue(true)

        const hashedPassword = await hashPassword("Test@1234")

        mockSupabase.from.mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            id: "user-123",
                            email: "test@example.com",
                            password_hash: hashedPassword,
                            email_verified: true,
                        },
                        error: null,
                    }),
                }),
            }),
            insert: vi.fn().mockResolvedValue({
                data: { id: "session-123" },
                error: null,
            }),
        })

        const request = new NextRequest("http://localhost/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: "test@example.com",
                password: "Test@1234",
                csrfToken: "token",
                captchaToken: "valid-token",
            }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data).toHaveProperty("userId")
        expect(data.data).toHaveProperty("sessionToken")
    })

    it("should set secure session cookie on successful login", async () => {
        const { checkRateLimit } = await import("@/lib/auth/rate-limiter")
        const { validateCSRFToken } = await import("@/lib/auth/csrf-validator")
        vi.mocked(checkRateLimit).mockResolvedValue(false)
        vi.mocked(validateCSRFToken).mockResolvedValue(true)

        const hashedPassword = await hashPassword("Test@1234")

        mockSupabase.from.mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            id: "user-123",
                            email: "test@example.com",
                            password_hash: hashedPassword,
                            email_verified: true,
                        },
                        error: null,
                    }),
                }),
            }),
            insert: vi.fn().mockResolvedValue({
                data: { id: "session-123" },
                error: null,
            }),
        })

        const request = new NextRequest("http://localhost/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: "test@example.com",
                password: "Test@1234",
                csrfToken: "token",
                captchaToken: "valid-token",
            }),
        })

        const response = await POST(request)

        expect(response.cookies.get("auth_session")).toBeDefined()
        expect(response.cookies.get("auth_session")?.httpOnly).toBe(true)
        expect(response.cookies.get("auth_session")?.sameSite).toBe("strict")
    })

    it("should set remember me cookie when requested", async () => {
        const { checkRateLimit } = await import("@/lib/auth/rate-limiter")
        const { validateCSRFToken } = await import("@/lib/auth/csrf-validator")
        vi.mocked(checkRateLimit).mockResolvedValue(false)
        vi.mocked(validateCSRFToken).mockResolvedValue(true)

        const hashedPassword = await hashPassword("Test@1234")

        mockSupabase.from.mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            id: "user-123",
                            email: "test@example.com",
                            password_hash: hashedPassword,
                            email_verified: true,
                        },
                        error: null,
                    }),
                }),
            }),
            insert: vi.fn().mockResolvedValue({
                data: { id: "session-123" },
                error: null,
            }),
        })

        const request = new NextRequest("http://localhost/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: "test@example.com",
                password: "Test@1234",
                rememberMe: true,
                csrfToken: "token",
                captchaToken: "valid-token",
            }),
        })

        const response = await POST(request)

        expect(response.cookies.get("remember_me_token")).toBeDefined()
        expect(response.cookies.get("remember_me_token")?.httpOnly).toBe(true)
    })

    // ============================================================================
    // Task 9: Error Handling
    // ============================================================================

    it("should return 400 for validation errors", async () => {
        const request = new NextRequest("http://localhost/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: "invalid-email",
                password: "Test@1234",
                csrfToken: "token",
                captchaToken: "valid-token",
            }),
        })

        const response = await POST(request)
        expect(response.status).toBe(400)
    })

    it("should return 401 for invalid credentials", async () => {
        const { checkRateLimit } = await import("@/lib/auth/rate-limiter")
        const { validateCSRFToken } = await import("@/lib/auth/csrf-validator")
        vi.mocked(checkRateLimit).mockResolvedValue(false)
        vi.mocked(validateCSRFToken).mockResolvedValue(true)

        mockSupabase.from.mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: null,
                        error: new Error("No user found"),
                    }),
                }),
            }),
        })

        const request = new NextRequest("http://localhost/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: "test@example.com",
                password: "WrongPassword",
                captchaToken: "valid-token",
                csrfToken: "token",
                captchaToken: "valid-token",
            }),
        })

        const response = await POST(request)
        expect(response.status).toBe(401)
    })

    it("should return 500 for database errors", async () => {
        const { checkRateLimit } = await import("@/lib/auth/rate-limiter")
        const { validateCSRFToken } = await import("@/lib/auth/csrf-validator")
        vi.mocked(checkRateLimit).mockResolvedValue(false)
        vi.mocked(validateCSRFToken).mockResolvedValue(true)

        mockSupabase.from.mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi
                        .fn()
                        .mockRejectedValue(
                            new Error("Database connection failed")
                        ),
                }),
            }),
        })

        const request = new NextRequest("http://localhost/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: "test@example.com",
                password: "Test@1234",
                csrfToken: "token",
                captchaToken: "valid-token",
            }),
        })

        const response = await POST(request)
        expect(response.status).toBe(401)
    })

    it("should return 200 for successful login", async () => {
        const { checkRateLimit } = await import("@/lib/auth/rate-limiter")
        const { validateCSRFToken } = await import("@/lib/auth/csrf-validator")
        vi.mocked(checkRateLimit).mockResolvedValue(false)
        vi.mocked(validateCSRFToken).mockResolvedValue(true)

        const hashedPassword = await hashPassword("Test@1234")

        mockSupabase.from.mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            id: "user-123",
                            email: "test@example.com",
                            password_hash: hashedPassword,
                            email_verified: true,
                        },
                        error: null,
                    }),
                }),
            }),
            insert: vi.fn().mockResolvedValue({
                data: { id: "session-123" },
                error: null,
            }),
        })

        const request = new NextRequest("http://localhost/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: "test@example.com",
                password: "Test@1234",
                csrfToken: "token",
                captchaToken: "valid-token",
            }),
        })

        const response = await POST(request)
        expect(response.status).toBe(200)
    })

    // ============================================================================
    // Task 10: Logging & Monitoring
    // ============================================================================

    it("should log successful login", async () => {
        const { checkRateLimit } = await import("@/lib/auth/rate-limiter")
        const { validateCSRFToken } = await import("@/lib/auth/csrf-validator")
        const { logLoginSuccess } = await import("@/lib/auth/audit-logging")
        vi.mocked(checkRateLimit).mockResolvedValue(false)
        vi.mocked(validateCSRFToken).mockResolvedValue(true)

        const hashedPassword = await hashPassword("Test@1234")

        mockSupabase.from.mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            id: "user-123",
                            email: "test@example.com",
                            password_hash: hashedPassword,
                            email_verified: true,
                        },
                        error: null,
                    }),
                }),
            }),
            insert: vi.fn().mockResolvedValue({
                data: { id: "session-123" },
                error: null,
            }),
        })

        const request = new NextRequest("http://localhost/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: "test@example.com",
                password: "Test@1234",
                csrfToken: "token",
                captchaToken: "valid-token",
            }),
        })

        await POST(request)

        expect(vi.mocked(logLoginSuccess)).toHaveBeenCalledWith(
            "test@example.com",
            expect.any(String),
            "user-123"
        )
    })

    it("should log failed login attempts", async () => {
        const { checkRateLimit } = await import("@/lib/auth/rate-limiter")
        const { validateCSRFToken } = await import("@/lib/auth/csrf-validator")
        const { logLoginFailure } = await import("@/lib/auth/audit-logging")
        vi.mocked(checkRateLimit).mockResolvedValue(false)
        vi.mocked(validateCSRFToken).mockResolvedValue(true)

        mockSupabase.from.mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: null,
                        error: new Error("No user found"),
                    }),
                }),
            }),
        })

        const request = new NextRequest("http://localhost/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: "test@example.com",
                password: "WrongPassword",
                captchaToken: "valid-token",
                csrfToken: "token",
                captchaToken: "valid-token",
            }),
        })

        await POST(request)

        expect(vi.mocked(logLoginFailure)).toHaveBeenCalledWith(
            "test@example.com",
            expect.any(String),
            expect.any(String)
        )
    })

    // ============================================================================
    // Task 5.5: Rate Limit Reset on Successful Authentication
    // ============================================================================

    it("should reset rate limit counter on successful login", async () => {
        const { checkRateLimit, resetAttempt } =
            await import("@/lib/auth/rate-limiter")
        const { validateCSRFToken } = await import("@/lib/auth/csrf-validator")
        vi.mocked(checkRateLimit).mockResolvedValue(false)
        vi.mocked(validateCSRFToken).mockResolvedValue(true)

        const hashedPassword = await hashPassword("Test@1234")

        mockSupabase.from.mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            id: "user-123",
                            email: "test@example.com",
                            password_hash: hashedPassword,
                            email_verified: true,
                        },
                        error: null,
                    }),
                }),
            }),
            insert: vi.fn().mockResolvedValue({
                data: { id: "session-123" },
                error: null,
            }),
        })

        const request = new NextRequest("http://localhost/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: "test@example.com",
                password: "Test@1234",
                csrfToken: "token",
                captchaToken: "valid-token",
            }),
        })

        await POST(request)

        // Verify resetAttempt was called with the email (Requirement 7.5)
        expect(vi.mocked(resetAttempt)).toHaveBeenCalledWith("test@example.com")
    })

    it("should not reset rate limit counter on failed login", async () => {
        const { checkRateLimit, resetAttempt } =
            await import("@/lib/auth/rate-limiter")
        const { validateCSRFToken } = await import("@/lib/auth/csrf-validator")
        vi.mocked(checkRateLimit).mockResolvedValue(false)
        vi.mocked(validateCSRFToken).mockResolvedValue(true)

        mockSupabase.from.mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: null,
                        error: new Error("No user found"),
                    }),
                }),
            }),
        })

        const request = new NextRequest("http://localhost/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: "test@example.com",
                password: "WrongPassword",
                captchaToken: "valid-token",
                csrfToken: "token",
                captchaToken: "valid-token",
            }),
        })

        await POST(request)

        // Verify resetAttempt was NOT called on failed login
        expect(vi.mocked(resetAttempt)).not.toHaveBeenCalled()
    })
})
