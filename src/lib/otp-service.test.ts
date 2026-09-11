/**
 * Tests for OTP Service (SMS with Twilio Verify + Email fallback)
 *
 * Covers:
 * - SMS path when phone is provided and Twilio is configured
 * - Email fallback when phone is missing or Twilio fails
 * - IP-based rate limiting
 * - verifyOtp with in-memory store
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Silence logger noise
vi.mock("@/lib/logger", () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}))

// Control Twilio behavior
const mockSendVerificationCode = vi.fn()
const mockCheckVerificationCode = vi.fn()
vi.mock("@/lib/twilio", () => ({
    sendVerificationCode: (...args: unknown[]) =>
        mockSendVerificationCode(...args),
    checkVerificationCode: (...args: unknown[]) =>
        mockCheckVerificationCode(...args),
}))

// Control Resend email
const mockSendVerificationEmail = vi.fn()
vi.mock("@/lib/auth/email-service", () => ({
    sendVerificationEmail: (...args: unknown[]) =>
        mockSendVerificationEmail(...args),
}))

// Control rate limiter
const mockRateLimit = vi.fn()
vi.mock("@/lib/auth/rate-limiter", () => ({
    checkRateLimitWithDegradation: (...args: unknown[]) =>
        mockRateLimit(...args),
}))

// Import after mocks
import { sendOtp, verifyOtp, generateTestOtp } from "@/lib/otp-service"

describe("otp-service.ts", () => {
    beforeEach(() => {
        vi.clearAllMocks()

        // By default, rate-limiter allows
        mockRateLimit.mockResolvedValue({
            allowed: true,
            remainingAttempts: 5,
            degradedMode: false,
        })
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    // ================================================================
    describe("sendOtp - SMS path", () => {
        it("sends SMS when phone is provided", async () => {
            mockSendVerificationCode.mockResolvedValueOnce({
                success: true,
                sid: "VE-sms-1",
                status: "pending",
            })

            const result = await sendOtp({
                phone: "+5511993313606",
                email: "user@example.com",
                locale: "en",
                ipAddress: "1.2.3.4",
            })

            expect(result.success).toBe(true)
            expect(result.channel).toBe("sms")
            expect(result.sid).toBe("VE-sms-1")
            expect(mockSendVerificationCode).toHaveBeenCalledWith(
                "+5511993313606"
            )
            expect(mockSendVerificationEmail).not.toHaveBeenCalled()
        })

        it("returns the rate-limit error when IP is blocked", async () => {
            mockRateLimit.mockResolvedValue({
                allowed: false,
                remainingAttempts: 0,
                degradedMode: false,
            })

            const result = await sendOtp({
                phone: "+5511999999999",
                email: "user@example.com",
                ipAddress: "9.9.9.9",
            })

            expect(result.success).toBe(false)
            expect(result.channel).toBe("email")
            expect(result.error).toBe("Too many requests")
        })
    })

    // ================================================================
    describe("sendOtp - Email fallback", () => {
        it("falls back to email when SMS fails", async () => {
            mockSendVerificationCode.mockResolvedValueOnce({
                success: false,
                error: "Twilio trial restriction",
            })
            mockSendVerificationEmail.mockResolvedValueOnce(true)

            const result = await sendOtp({
                phone: "+5511999999999",
                email: "user@example.com",
                locale: "en",
                ipAddress: "10.0.0.1",
            })

            expect(result.success).toBe(true)
            expect(result.channel).toBe("email")
            expect(mockSendVerificationEmail).toHaveBeenCalledWith(
                "user@example.com",
                expect.any(String)
            )
        })

        it("sends email directly when phone is missing", async () => {
            mockSendVerificationEmail.mockResolvedValueOnce(true)

            const result = await sendOtp({
                email: "user@example.com",
                locale: "pt-BR",
                ipAddress: "10.0.0.2",
            })

            expect(result.success).toBe(true)
            expect(result.channel).toBe("email")
            expect(mockSendVerificationCode).not.toHaveBeenCalled()
            expect(mockSendVerificationEmail).toHaveBeenCalledWith(
                "user@example.com",
                expect.stringContaining(
                    "/pt-BR/auth/verify-otp?email=user%40example.com"
                )
            )
        })

        it("returns the Twilio error when both SMS and email fail", async () => {
            mockSendVerificationCode.mockResolvedValueOnce({
                success: false,
                error: "Twilio error",
            })
            mockSendVerificationEmail.mockResolvedValueOnce(false)

            const result = await sendOtp({
                phone: "+5511999999999",
                email: "user@example.com",
                ipAddress: "10.0.0.3",
            })

            expect(result.success).toBe(false)
            expect(result.channel).toBe("email")
            expect(result.error).toBe("Twilio error")
        })
    })

    // ================================================================
    describe("verifyOtp - in-memory code", () => {
        it("accepts a stored in-memory code (test flow)", async () => {
            const { code } = generateTestOtp("+5511993313606", "user@x.com")

            const result = await verifyOtp({
                phone: "+5511993313606",
                code,
                ipAddress: "1.1.1.1",
            })

            expect(result.valid).toBe(true)
        })

        it("rejects wrong code", async () => {
            generateTestOtp("+5511993313606", "user@x.com")

            const result = await verifyOtp({
                phone: "+5511993313606",
                code: "000000",
                ipAddress: "1.1.1.1",
            })

            expect(result.valid).toBe(false)
            expect(result.error).toBe("Invalid code")
        })

        it("requires phone number for verification", async () => {
            const result = await verifyOtp({
                code: "123456",
                ipAddress: "1.1.1.2",
            })

            expect(result.valid).toBe(false)
            expect(result.error).toBe("Phone number required for verification")
        })

        it("rejects a code of wrong length", async () => {
            const result = await verifyOtp({
                phone: "+5511993313606",
                code: "12345", // 5 digits, expected 6
                ipAddress: "1.1.1.3",
            })

            expect(result.valid).toBe(false)
            expect(result.error).toBe("Invalid code format")
        })
    })

    // ================================================================
    describe("verifyOtp - Twilio Verify", () => {
        it("delegates to Twilio when store is empty and Twilio configured", async () => {
            process.env.TWILIO_ACCOUNT_SID = "AC-test"
            process.env.TWILIO_AUTH_TOKEN = "tok"

            mockCheckVerificationCode.mockResolvedValueOnce({
                success: true,
                status: "approved",
            })

            const result = await verifyOtp({
                phone: "+5511999999999",
                code: "654321",
                ipAddress: "2.2.2.2",
            })

            expect(result.valid).toBe(true)
            expect(mockCheckVerificationCode).toHaveBeenCalledWith(
                "+5511999999999",
                "654321"
            )
        })

        it("returns the Twilio failure message", async () => {
            process.env.TWILIO_ACCOUNT_SID = "AC-test"
            process.env.TWILIO_AUTH_TOKEN = "tok"

            mockCheckVerificationCode.mockResolvedValueOnce({
                success: false,
                error: "Invalid or expired code",
            })

            const result = await verifyOtp({
                phone: "+5511998888888",
                code: "123456",
                ipAddress: "2.2.2.3",
            })

            expect(result.valid).toBe(false)
            expect(result.error).toBe("Invalid or expired code")
        })
    })
})
