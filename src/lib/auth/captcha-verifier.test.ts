/**
 * Unit Tests: CAPTCHA Token Verification
 *
 * Tests cover:
 * - Valid token verification
 * - Invalid token rejection
 * - Token expiration (5 minute window)
 * - Missing token handling
 * - Network error handling
 * - Generic error messages
 * - Configuration validation
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
    getCAPTCHAProvider,
    isCAPTCHAConfigured,
    verifyCAPTCHA,
    verifyCAPTCHAWithFallback,
} from "./captcha-verifier"

// Mock fetch globally
global.fetch = vi.fn()

describe("CAPTCHA Verifier", () => {
    beforeEach(() => {
        // Set up environment variables
        process.env.CAPTCHA_SECRET_KEY = "test-secret-key"
        process.env.CAPTCHA_PROVIDER = "cloudflare"
        process.env.CAPTCHA_TOKEN_EXPIRATION_MINUTES = "5"

        // Clear all mocks
        vi.clearAllMocks()
    })

    afterEach(() => {
        // Clean up environment
        delete process.env.CAPTCHA_SECRET_KEY
        delete process.env.CAPTCHA_PROVIDER
        delete process.env.CAPTCHA_TOKEN_EXPIRATION_MINUTES
    })

    describe("verifyCAPTCHA", () => {
        it("should verify valid CAPTCHA token", async () => {
            const now = new Date()
            const challengeTs = new Date(now.getTime() - 60000).toISOString() // 1 minute ago

            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    challenge_ts: challengeTs,
                    hostname: "example.com",
                    score: 0.9,
                }),
            } as unknown as Response)

            const result = await verifyCAPTCHA("valid-token")

            expect(result.success).toBe(true)
            expect(result.challengeTs).toBe(challengeTs)
            expect(result.hostname).toBe("example.com")
            expect(result.score).toBe(0.9)
        })

        it("should reject invalid CAPTCHA token", async () => {
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: false,
                    error_codes: ["invalid-input-response"],
                    hostname: "example.com",
                }),
            } as unknown as Response)

            const result = await verifyCAPTCHA("invalid-token")

            expect(result.success).toBe(false)
            expect(result.errorCodes).toContain("invalid-input-response")
        })

        it("should reject expired CAPTCHA token", async () => {
            const now = new Date()
            // Token from 10 minutes ago (expires after 5 minutes)
            const challengeTs = new Date(
                now.getTime() - 10 * 60 * 1000
            ).toISOString()

            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    challenge_ts: challengeTs,
                    hostname: "example.com",
                }),
            } as unknown as Response)

            const result = await verifyCAPTCHA("expired-token")

            expect(result.success).toBe(false)
            expect(result.failureReason).toBe("Token expired")
        })

        it("should handle missing token", async () => {
            const result = await verifyCAPTCHA(undefined)

            expect(result.success).toBe(false)
            expect(result.failureReason).toBe("Token is missing")
        })

        it("should handle null token", async () => {
            const result = await verifyCAPTCHA(null)

            expect(result.success).toBe(false)
            expect(result.failureReason).toBe("Token is missing")
        })

        it("should handle empty string token", async () => {
            const result = await verifyCAPTCHA("")

            expect(result.success).toBe(false)
            expect(result.failureReason).toBe("Token is missing")
        })

        it("should handle network errors", async () => {
            vi.mocked(global.fetch).mockRejectedValueOnce(
                new Error("Network error")
            )

            await expect(verifyCAPTCHA("token")).rejects.toThrow(
                "CAPTCHA service unavailable"
            )
        })

        it("should handle API errors", async () => {
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: "Internal Server Error",
            } as unknown as Response)

            await expect(verifyCAPTCHA("token")).rejects.toThrow(
                "Invalid response from CAPTCHA service"
            )
        })

        it("should handle invalid JSON response", async () => {
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                json: async () => {
                    throw new Error("Invalid JSON")
                },
            } as unknown as Response)

            await expect(verifyCAPTCHA("token")).rejects.toThrow(
                "Invalid response from CAPTCHA service"
            )
        })

        it("should handle missing CAPTCHA_SECRET_KEY", async () => {
            delete process.env.CAPTCHA_SECRET_KEY

            await expect(verifyCAPTCHA("token")).rejects.toThrow(
                "CAPTCHA_SECRET_KEY environment variable is not configured"
            )
        })

        it("should send correct request to Cloudflare", async () => {
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    challenge_ts: new Date().toISOString(),
                }),
            } as unknown as Response)

            await verifyCAPTCHA("test-token")

            expect(global.fetch).toHaveBeenCalledWith(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        secret: "test-secret-key",
                        response: "test-token",
                    }),
                }
            )
        })

        it("should accept token at expiration boundary", async () => {
            const now = new Date()
            // Token from exactly 5 minutes ago minus 100ms buffer (to account for async execution)
            const challengeTs = new Date(
                now.getTime() - 5 * 60 * 1000 + 100
            ).toISOString()

            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    challenge_ts: challengeTs,
                    hostname: "example.com",
                }),
            } as unknown as Response)

            const result = await verifyCAPTCHA("boundary-token")

            // Should be accepted (just under 5 minute boundary)
            expect(result.success).toBe(true)
        })

        it("should accept token just before expiration", async () => {
            const now = new Date()
            // Token from 4 minutes 59 seconds ago
            const challengeTs = new Date(
                now.getTime() - 4 * 60 * 1000 - 59 * 1000
            ).toISOString()

            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    challenge_ts: challengeTs,
                    hostname: "example.com",
                }),
            } as unknown as Response)

            const result = await verifyCAPTCHA("fresh-token")

            expect(result.success).toBe(true)
        })
    })

    describe("verifyCAPTCHAWithFallback", () => {
        it("should return success for valid token", async () => {
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    challenge_ts: new Date().toISOString(),
                }),
            } as unknown as Response)

            const result = await verifyCAPTCHAWithFallback("valid-token")

            expect(result.success).toBe(true)
            expect(result.degradedMode).toBe(false)
        })

        it("should return failure for invalid token", async () => {
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: false,
                    error_codes: ["invalid-input-response"],
                }),
            } as unknown as Response)

            const result = await verifyCAPTCHAWithFallback("invalid-token")

            expect(result.success).toBe(false)
            expect(result.degradedMode).toBe(false)
            expect(result.errorCodes).toContain("invalid-input-response")
        })

        it("should return failure with degraded mode on network error (no throw)", async () => {
            vi.mocked(global.fetch).mockRejectedValueOnce(
                new Error("Network error")
            )

            const result = await verifyCAPTCHAWithFallback("token")

            expect(result.success).toBe(false)
            expect(result.degradedMode).toBe(true)
            expect(result.failureReason).toBe("CAPTCHA service unavailable")
        })

        it("should return failure with degraded mode on API error (no throw)", async () => {
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: "Internal Server Error",
            } as unknown as Response)

            const result = await verifyCAPTCHAWithFallback("token")

            expect(result.success).toBe(false)
            expect(result.degradedMode).toBe(true)
            expect(result.failureReason).toBe("CAPTCHA service unavailable")
        })

        it("should return failure with degraded mode on missing configuration (no throw)", async () => {
            delete process.env.CAPTCHA_SECRET_KEY

            const result = await verifyCAPTCHAWithFallback("token")

            expect(result.success).toBe(false)
            expect(result.degradedMode).toBe(true)
            expect(result.failureReason).toBe("CAPTCHA service unavailable")
        })
    })

    describe("isCAPTCHAConfigured", () => {
        it("should return true when CAPTCHA_SECRET_KEY is set", () => {
            process.env.CAPTCHA_SECRET_KEY = "test-key"

            expect(isCAPTCHAConfigured()).toBe(true)
        })

        it("should return false when CAPTCHA_SECRET_KEY is not set", () => {
            delete process.env.CAPTCHA_SECRET_KEY

            expect(isCAPTCHAConfigured()).toBe(false)
        })
    })

    describe("getCAPTCHAProvider", () => {
        it("should return configured provider", () => {
            process.env.CAPTCHA_PROVIDER = "google"

            expect(getCAPTCHAProvider()).toBe("google")
        })

        it("should default to cloudflare", () => {
            delete process.env.CAPTCHA_PROVIDER

            expect(getCAPTCHAProvider()).toBe("cloudflare")
        })
    })
})
