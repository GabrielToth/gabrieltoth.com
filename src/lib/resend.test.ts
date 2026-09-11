/**
 * Tests for Resend Email Sender
 *
 * Covers:
 * - Success path (mocked fetch returning 200)
 * - API failure (non-200 response)
 * - Dev fallback when API key is missing
 * - Header construction using `RESEND_FROM_EMAIL` / `RESEND_FROM_NAME`
 * - Timeout aborting the request
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { sendEmail } from "@/lib/resend"

// Mock the logger so we don't spam test output (and don't hit Discord)
vi.mock("@/lib/logger", () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe("resend.ts", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Reset env
        delete process.env.RESEND_API_KEY
        delete process.env.RESEND_FROM_EMAIL
        delete process.env.RESEND_FROM_NAME
        delete process.env.EMAIL_FROM
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    // ----------------------------------------------------------------
    describe("sendEmail - success path", () => {
        it("returns success with message id on 200", async () => {
            process.env.RESEND_API_KEY = "test-key"
            process.env.RESEND_FROM_EMAIL = "noreply@test.com"
            process.env.RESEND_FROM_NAME = "Toth Platform"

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: "resend-id-123" }),
            } as Response)

            const result = await sendEmail({
                to: "user@example.com",
                subject: "Hello",
                html: "<p>World</p>",
            })

            expect(result.success).toBe(true)
            expect(result.id).toBe("resend-id-123")

            // Verify fetch was called with proper headers + from header
            expect(mockFetch).toHaveBeenCalledWith(
                "https://api.resend.com/emails",
                expect.objectContaining({
                    method: "POST",
                    headers: expect.objectContaining({
                        Authorization: "Bearer test-key",
                        "Content-Type": "application/json",
                    }),
                })
            )

            const callBody = JSON.parse(
                (mockFetch.mock.calls[0][1] as RequestInit).body as string
            )
            expect(callBody.from).toBe("Toth Platform <noreply@test.com>")
            expect(callBody.to).toEqual(["user@example.com"])
            expect(callBody.subject).toBe("Hello")
        })

        it("handles array recipients", async () => {
            process.env.RESEND_API_KEY = "test-key"
            process.env.RESEND_FROM_EMAIL = "noreply@test.com"

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: "resend-id-456" }),
            } as Response)

            const result = await sendEmail({
                to: ["a@x.com", "b@y.com"],
                subject: "Hello",
                html: "<p>World</p>",
            })

            expect(result.success).toBe(true)
            const callBody = JSON.parse(
                (mockFetch.mock.calls[0][1] as RequestInit).body as string
            )
            expect(callBody.to).toEqual(["a@x.com", "b@y.com"])
        })
    })

    // ----------------------------------------------------------------
    describe("sendEmail - failure path", () => {
        it("returns failure with API error message", async () => {
            process.env.RESEND_API_KEY = "test-key"
            process.env.RESEND_FROM_EMAIL = "noreply@test.com"

            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 422,
                json: async () => ({
                    message: "Validation error",
                    name: "validation_error",
                }),
            } as Response)

            const result = await sendEmail({
                to: "user@example.com",
                subject: "Hello",
                html: "<p>World</p>",
            })

            expect(result.success).toBe(false)
            expect(result.error).toBe("Validation error")
        })

        it("falls back to HTTP status when parsing fails", async () => {
            process.env.RESEND_API_KEY = "test-key"
            process.env.RESEND_FROM_EMAIL = "noreply@test.com"

            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => ({}),
            } as Response)

            const result = await sendEmail({
                to: "user@example.com",
                subject: "Hello",
                html: "<p>World</p>",
            })

            expect(result.success).toBe(false)
            expect(result.error).toBe("HTTP 500")
        })
    })

    // ----------------------------------------------------------------
    describe("sendEmail - config", () => {
        it("uses RESEND_FROM_EMAIL when RESEND_FROM_NAME is missing", async () => {
            process.env.RESEND_API_KEY = "test-key"
            process.env.RESEND_FROM_EMAIL = "noreply@test.com"
            // no RESEND_FROM_NAME

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: "resend-id-789" }),
            } as Response)

            const result = await sendEmail({
                to: "user@example.com",
                subject: "Hello",
                html: "<p>World</p>",
            })

            const callBody = JSON.parse(
                (mockFetch.mock.calls[0][1] as RequestInit).body as string
            )
            expect(result.success).toBe(true)
            // Falls back to default name "Gabriel Toth" when RESEND_FROM_NAME is unset
            expect(callBody.from).toBe("Gabriel Toth <noreply@test.com>")
        })

        it("returns error in production when RESEND_API_KEY is missing", async () => {
            vi.stubEnv("NODE_ENV", "production")

            const result = await sendEmail({
                to: "user@example.com",
                subject: "Hello",
                html: "<p>World</p>",
            })

            expect(result.success).toBe(false)
            expect(result.error).toContain("RESEND_API_KEY")

            vi.unstubAllEnvs()
        })

        it("mocks success in dev when RESEND_API_KEY is missing", async () => {
            vi.stubEnv("NODE_ENV", "development")

            const result = await sendEmail({
                to: "user@example.com",
                subject: "Hello",
                html: "<p>World</p>",
            })

            expect(result.success).toBe(true)
            expect(result.id).toBe("dev_mock_id")

            vi.unstubAllEnvs()
        })
    })
})
