/**
 * Tests for OAuth State Signer (HMAC-based state tokens)
 *
 * Tests generateState() and verifyState() from state-signer.ts
 * Coverage: generateState, verifyState (all branches)
 */

import { describe, expect, it, beforeEach, afterEach } from "vitest"
import { generateState, verifyState } from "./state-signer"

describe("state-signer", () => {
    const originalEnv = { ...process.env }

    beforeEach(() => {
        // Ensure a signing key is set for tests
        process.env.OAUTH_STATE_SECRET = "test-signing-key-for-hmac-tests-123"
    })

    afterEach(() => {
        process.env = { ...originalEnv }
    })

    describe("generateState", () => {
        it("should return a token in base64url.base64url format", () => {
            const result = generateState("user-1", "facebook")

            expect(result.token).toContain(".")
            const parts = result.token.split(".")
            expect(parts).toHaveLength(2)
            expect(parts[0]).toMatch(/^[A-Za-z0-9_-]+$/)
            expect(parts[1]).toMatch(/^[A-Za-z0-9_-]+$/)
        })

        it("should include a payload with userId, platform, nonce, and iat", () => {
            const result = generateState("user-1", "facebook")

            expect(result.payload.userId).toBe("user-1")
            expect(result.payload.platform).toBe("facebook")
            expect(result.payload.nonce).toBeDefined()
            expect(result.payload.nonce.length).toBeGreaterThan(0)
            expect(result.payload.iat).toBeGreaterThan(0)
        })

        it("should include optional locale when provided", () => {
            const result = generateState("user-1", "facebook", "pt-BR")

            expect(result.payload.locale).toBe("pt-BR")
        })

        it("should include optional redirectTo when provided", () => {
            const result = generateState(
                "user-1",
                "facebook",
                undefined,
                "/dashboard"
            )

            expect(result.payload.redirectTo).toBe("/dashboard")
        })

        it("should generate unique tokens on successive calls", () => {
            const result1 = generateState("user-1", "facebook")
            const result2 = generateState("user-1", "facebook")

            expect(result1.token).not.toBe(result2.token)
        })

        it("should throw when no signing key is configured", () => {
            delete process.env.OAUTH_STATE_SECRET
            delete process.env.TOKEN_ENCRYPTION_KEY

            expect(() => generateState("user-1", "facebook")).toThrow(
                /OAUTH_STATE_SECRET/
            )
        })
    })

    describe("verifyState", () => {
        it("should return { valid: true } for a valid token", () => {
            const { token } = generateState("user-1", "facebook")
            const result = verifyState(token)

            expect(result.valid).toBe(true)
            expect(result.payload).not.toBeNull()
        })

        it("should decode the original payload correctly", () => {
            const { token } = generateState(
                "user-1",
                "facebook",
                "en-US",
                "/callback"
            )
            const result = verifyState(token)

            expect(result.payload?.userId).toBe("user-1")
            expect(result.payload?.platform).toBe("facebook")
            expect(result.payload?.locale).toBe("en-US")
            expect(result.payload?.redirectTo).toBe("/callback")
        })

        it("should return { valid: false } for a tampered token", () => {
            const { token } = generateState("user-1", "facebook")
            const parts = token.split(".")
            const tamperedToken = `${parts[0]}.invalidsignature`

            const result = verifyState(tamperedToken)

            expect(result.valid).toBe(false)
            expect(result.payload).toBeNull()
            expect(result.error).toMatch(/signature/i)
        })

        it("should return { valid: false } for an expired token (age > 1h)", () => {
            // Manually create a token with an old timestamp
            const oldPayload = {
                userId: "user-1",
                platform: "facebook",
                nonce: "testnonce",
                iat: Date.now() - 61 * 60 * 1000, // 61 minutes ago
            }

            // We need to sign it properly but with expired iat
            const crypto = require("crypto")
            const payloadBase64 = Buffer.from(
                JSON.stringify(oldPayload)
            ).toString("base64url")
            const hmac = crypto.createHmac(
                "sha256",
                process.env.OAUTH_STATE_SECRET!
            )
            hmac.update(payloadBase64)
            const signature = hmac.digest().toString("base64url")
            const expiredToken = `${payloadBase64}.${signature}`

            const result = verifyState(expiredToken)

            expect(result.valid).toBe(false)
            expect(result.error).toMatch(/expired/i)
        })

        it("should return { valid: false } for a malformed token", () => {
            const result = verifyState("not-a-valid-token")

            expect(result.valid).toBe(false)
            expect(result.error).toMatch(/format/i)
        })

        it("should return { valid: false } for a token with only one part", () => {
            const result = verifyState("justapart")

            expect(result.valid).toBe(false)
        })

        it("should return { valid: false } for a token with three parts", () => {
            const result = verifyState("part1.part2.part3")

            expect(result.valid).toBe(false)
        })

        it("should return { valid: false, error } when signing key is missing", () => {
            const { token } = generateState("user-1", "facebook")

            // Remove key and verify
            delete process.env.OAUTH_STATE_SECRET
            delete process.env.TOKEN_ENCRYPTION_KEY

            const result = verifyState(token)

            expect(result.valid).toBe(false)
            expect(result.error).toMatch(/key/i)
        })

        it("should propagate locale from the payload", () => {
            const { token } = generateState("user-1", "facebook", "de-DE")
            const result = verifyState(token)

            expect(result.valid).toBe(true)
            expect(result.payload?.locale).toBe("de-DE")
        })

        it("should handle empty token string", () => {
            const result = verifyState("")

            expect(result.valid).toBe(false)
            expect(result.error).toMatch(/format/i)
        })
    })
})
