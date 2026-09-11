/**
 * Tests for Twilio Verify Service
 *
 * Covers:
 * - Configuration validation (required env vars present)
 * - Phone number normalization to E.164
 * - Correct Basic auth header construction
 * - Success / failure paths for sendVerificationCode
 * - Success / failure paths for checkVerificationCode
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { sendVerificationCode, checkVerificationCode } from "@/lib/twilio"

// Mock logger to silence test output
vi.mock("@/lib/logger", () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

describe("twilio.ts", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        delete process.env.TWILIO_ACCOUNT_SID
        delete process.env.TWILIO_AUTH_TOKEN
        delete process.env.TWILIO_VERIFY_SERVICE_SID
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    // ================================================================
    // CONFIG VALIDATION
    // ================================================================
    describe("configuration validation", () => {
        it("returns error when ACCOUNT_SID is missing", async () => {
            process.env.TWILIO_AUTH_TOKEN = "tok"
            process.env.TWILIO_VERIFY_SERVICE_SID = "VAxxx"

            const result = await sendVerificationCode("+5511999999999")
            expect(result.success).toBe(false)
            expect(result.error).toContain("TWILIO_ACCOUNT_SID")
        })

        it("returns error when AUTH_TOKEN is missing", async () => {
            process.env.TWILIO_ACCOUNT_SID = "AC-test"
            process.env.TWILIO_VERIFY_SERVICE_SID = "VAxxx"

            const result = await sendVerificationCode("+5511999999999")
            expect(result.success).toBe(false)
            expect(result.error).toContain("TWILIO_AUTH_TOKEN")
        })

        it("returns error when VERIFY_SERVICE_SID is missing", async () => {
            process.env.TWILIO_ACCOUNT_SID = "AC-test"
            process.env.TWILIO_AUTH_TOKEN = "tok"

            const result = await sendVerificationCode("+5511999999999")
            expect(result.success).toBe(false)
            expect(result.error).toContain("TWILIO_VERIFY_SERVICE_SID")

            const check = await checkVerificationCode(
                "+5511999999999",
                "123456"
            )
            expect(check.success).toBe(false)
            expect(check.error).toContain("TWILIO_VERIFY_SERVICE_SID")
        })
    })

    // ================================================================
    // PHONE NORMALIZATION (E.164)
    // ================================================================
    describe("phone normalization", () => {
        beforeEach(() => {
            process.env.TWILIO_ACCOUNT_SID = "AC-test"
            process.env.TWILIO_AUTH_TOKEN = "tok"
            process.env.TWILIO_VERIFY_SERVICE_SID = "VAxxx"
        })

        it("normalizes number without + prefix", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ sid: "VE-1", status: "pending" }),
            } as Response)

            await sendVerificationCode("5511993313606")

            const callUrl = mockFetch.mock.calls[0][0] as string
            const callBody = mockFetch.mock.calls[0][1]?.body as string

            // Body param "To" already contains the E.164 normalized number
            // In URLSearchParams form: "To=+5511993313606"
            expect(callBody).toContain("To=%2B5511993313606")
            expect(callBody).toContain("Channel=sms")
        })

        it("keeps + prefix already present", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ sid: "VE-2", status: "pending" }),
            } as Response)

            await sendVerificationCode("+14155551234")

            const callBody = mockFetch.mock.calls[0][1]?.body as string
            expect(callBody).toContain("To=%2B14155551234")
        })

        it("strips non-digit characters from phone", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ sid: "VE-3", status: "pending" }),
            } as Response)

            await sendVerificationCode("+55 (11) 99331-3606")

            const callBody = mockFetch.mock.calls[0][1]?.body as string
            expect(callBody).toContain("To=%2B5511993313606")
        })
    })

    // ================================================================
    // SEND VERIFICATION
    // ================================================================
    describe("sendVerificationCode", () => {
        beforeEach(() => {
            process.env.TWILIO_ACCOUNT_SID = "AC-test"
            process.env.TWILIO_AUTH_TOKEN = "tok"
            process.env.TWILIO_VERIFY_SERVICE_SID = "VAxxx"
        })

        it("returns success + sid on 200", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    sid: "VE-abc",
                    status: "pending",
                    to: "+5511999999999",
                }),
            } as Response)

            const result = await sendVerificationCode("+5511999999999")

            expect(result.success).toBe(true)
            expect(result.sid).toBe("VE-abc")
            expect(result.status).toBe("pending")

            // Check Basic auth header was built correctly
            const headers = mockFetch.mock.calls[0][1]?.headers
            expect(headers?.Authorization).toMatch(/^Basic /)

            const expectedAuth = `Basic ${Buffer.from("AC-test:tok").toString("base64")}`
            expect(headers?.Authorization).toBe(expectedAuth)
        })

        it("returns error on non-200 response", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 403,
                json: async () => ({
                    message: "Trial account restriction",
                }),
            } as Response)

            const result = await sendVerificationCode("+5511999999999")

            expect(result.success).toBe(false)
            expect(result.error).toBe("Trial account restriction")
        })

        it("handles fetch timeout gracefully", async () => {
            mockFetch.mockRejectedValueOnce(
                new Error("The operation was aborted")
            )

            const result = await sendVerificationCode("+5511999999999")
            expect(result.success).toBe(false)
            expect(result.error).toBeDefined()
        })
    })

    // ================================================================
    // CHECK VERIFICATION
    // ================================================================
    describe("checkVerificationCode", () => {
        beforeEach(() => {
            process.env.TWILIO_ACCOUNT_SID = "AC-test"
            process.env.TWILIO_AUTH_TOKEN = "tok"
            process.env.TWILIO_VERIFY_SERVICE_SID = "VAxxx"
        })

        it("returns success when status is 'approved'", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    status: "approved",
                    valid: true,
                }),
            } as Response)

            const result = await checkVerificationCode(
                "+5511999999999",
                "123456"
            )

            expect(result.success).toBe(true)
            expect(result.status).toBe("approved")
        })

        it("returns false when status is 'pending'", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ status: "pending" }),
            } as Response)

            const result = await checkVerificationCode(
                "+5511999999999",
                "123456"
            )

            expect(result.success).toBe(false)
            expect(result.status).toBe("pending")
        })

        it("rejects blank code", async () => {
            const result = await checkVerificationCode("+5511999999999", "")
            expect(result.success).toBe(false)
            expect(result.error).toContain("required")
        })

        it("returns error on non-200 from Verify", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: async () => ({
                    message: "Verification not found",
                }),
            } as Response)

            const result = await checkVerificationCode(
                "+5511999999999",
                "123456"
            )

            expect(result.success).toBe(false)
            expect(result.error).toBe("Verification not found")
        })
    })
})
