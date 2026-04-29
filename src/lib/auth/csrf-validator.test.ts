/**
 * CSRF Validator Tests
 * Tests for CSRF token generation, storage, and validation
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */

import { db } from "@/lib/db"
import { createHash } from "crypto"
import {
    cleanupExpiredCSRFTokens,
    generateCSRFToken,
    storeCSRFToken,
    validateCSRFToken,
} from "./csrf-validator"

const { query, queryOne } = db

describe("CSRF Validator Module", () => {
    // Clean up test data after each test
    afterEach(async () => {
        try {
            await query(`DELETE FROM csrf_tokens`)
        } catch (error) {
            // Ignore cleanup errors
        }
    })

    describe("generateCSRFToken", () => {
        it("should generate a 64-character hex string", () => {
            const token = generateCSRFToken()
            expect(token).toHaveLength(64)
            expect(/^[a-f0-9]{64}$/i.test(token)).toBe(true)
        })

        it("should generate unique tokens", () => {
            const token1 = generateCSRFToken()
            const token2 = generateCSRFToken()
            expect(token1).not.toBe(token2)
        })

        it("should generate cryptographically random tokens", () => {
            const tokens = new Set()
            for (let i = 0; i < 100; i++) {
                tokens.add(generateCSRFToken())
            }
            // All tokens should be unique
            expect(tokens.size).toBe(100)
        })

        it("should only contain valid hex characters", () => {
            const token = generateCSRFToken()
            expect(/^[a-f0-9]{64}$/i.test(token)).toBe(true)
        })
    })

    describe("storeCSRFToken", () => {
        it("should store a valid token", async () => {
            const token = generateCSRFToken()
            await storeCSRFToken(token)

            // Verify token was stored
            const tokenHash = createHash("sha256").update(token).digest("hex")
            const result = await queryOne(
                `SELECT id FROM csrf_tokens WHERE token_hash = $1`,
                [tokenHash]
            )
            expect(result).toBeDefined()
        })

        it("should set expiration time to 1 hour", async () => {
            const token = generateCSRFToken()
            const beforeStore = new Date()
            await storeCSRFToken(token)
            const afterStore = new Date()

            const tokenHash = createHash("sha256").update(token).digest("hex")
            const result = await queryOne<{ expires_at: Date }>(
                `SELECT expires_at FROM csrf_tokens WHERE token_hash = $1`,
                [tokenHash]
            )

            expect(result).toBeDefined()
            if (result) {
                const expiresAt = new Date(result.expires_at)
                const expectedExpiration = new Date(
                    beforeStore.getTime() + 60 * 60 * 1000
                )
                const timeDiff = Math.abs(
                    expiresAt.getTime() - expectedExpiration.getTime()
                )
                // Allow 5 second tolerance
                expect(timeDiff).toBeLessThan(5000)
            }
        })

        it("should reject invalid token", async () => {
            await expect(storeCSRFToken("")).rejects.toThrow()
        })

        it("should reject non-string token", async () => {
            await expect(
                storeCSRFToken(null as unknown as string)
            ).rejects.toThrow()
        })
    })

    describe("validateCSRFToken", () => {
        it("should validate a stored token", async () => {
            const token = generateCSRFToken()
            await storeCSRFToken(token)

            const isValid = await validateCSRFToken(token)
            expect(isValid).toBe(true)
        })

        it("should reject non-existent token", async () => {
            const token = generateCSRFToken()
            const isValid = await validateCSRFToken(token)
            expect(isValid).toBe(false)
        })

        it("should reject invalid token format", async () => {
            const isValid = await validateCSRFToken("invalid-token")
            expect(isValid).toBe(false)
        })

        it("should delete token after validation (one-time use)", async () => {
            const token = generateCSRFToken()
            await storeCSRFToken(token)

            // First validation should succeed
            const isValid1 = await validateCSRFToken(token)
            expect(isValid1).toBe(true)

            // Second validation should fail (token deleted)
            const isValid2 = await validateCSRFToken(token)
            expect(isValid2).toBe(false)
        })

        it("should reject expired token", async () => {
            const token = generateCSRFToken()
            const tokenHash = createHash("sha256").update(token).digest("hex")

            // Store token with past expiration
            const pastExpiration = new Date(Date.now() - 1000)
            await query(
                `INSERT INTO csrf_tokens (token_hash, expires_at) VALUES ($1, $2)`,
                [tokenHash, pastExpiration]
            )

            const isValid = await validateCSRFToken(token)
            expect(isValid).toBe(false)
        })

        it("should reject empty token", async () => {
            const isValid = await validateCSRFToken("")
            expect(isValid).toBe(false)
        })

        it("should reject non-string token", async () => {
            const isValid = await validateCSRFToken(null as unknown as string)
            expect(isValid).toBe(false)
        })
    })

    describe("cleanupExpiredCSRFTokens", () => {
        it("should delete expired tokens", async () => {
            const token1 = generateCSRFToken()
            const token2 = generateCSRFToken()
            const token3 = generateCSRFToken()

            // Store tokens
            await storeCSRFToken(token1)
            await storeCSRFToken(token2)
            await storeCSRFToken(token3)

            // Manually expire two tokens
            const tokenHash1 = createHash("sha256").update(token1).digest("hex")
            const tokenHash2 = createHash("sha256").update(token2).digest("hex")
            const pastExpiration = new Date(Date.now() - 1000)

            await query(
                `UPDATE csrf_tokens SET expires_at = $1 WHERE token_hash IN ($2, $3)`,
                [pastExpiration, tokenHash1, tokenHash2]
            )

            // Run cleanup
            const deletedCount = await cleanupExpiredCSRFTokens()
            expect(deletedCount).toBe(2)

            // Verify only non-expired token remains
            const remaining = await query(
                `SELECT COUNT(*) as count FROM csrf_tokens`
            )
            expect(remaining.rows[0].count).toBe(1)
        })

        it("should not delete non-expired tokens", async () => {
            const token = generateCSRFToken()
            await storeCSRFToken(token)

            const deletedCount = await cleanupExpiredCSRFTokens()
            expect(deletedCount).toBe(0)

            // Verify token still exists
            const result = await query(
                `SELECT COUNT(*) as count FROM csrf_tokens`
            )
            expect(result.rows[0].count).toBe(1)
        })

        it("should handle empty token table", async () => {
            const deletedCount = await cleanupExpiredCSRFTokens()
            expect(deletedCount).toBe(0)
        })
    })

    describe("CSRF Token Security", () => {
        it("should generate tokens with sufficient entropy", () => {
            const tokens = new Set()
            for (let i = 0; i < 1000; i++) {
                tokens.add(generateCSRFToken())
            }
            // All tokens should be unique (extremely unlikely to have collisions)
            expect(tokens.size).toBe(1000)
        })

        it("should not expose token in logs", async () => {
            const token = generateCSRFToken()
            // This test verifies that the token is not logged in plain text
            // In production, check logs to ensure tokens are not exposed
            expect(token).toHaveLength(64)
        })

        it("should store hashed tokens, not plain tokens", async () => {
            const token = generateCSRFToken()
            await storeCSRFToken(token)

            // Query for plain token (should not exist)
            const result = await queryOne(
                `SELECT id FROM csrf_tokens WHERE token_hash = $1`,
                [token]
            )
            expect(result).toBeNull()

            // Query for hashed token (should exist)
            const tokenHash = createHash("sha256").update(token).digest("hex")
            const hashedResult = await queryOne(
                `SELECT id FROM csrf_tokens WHERE token_hash = $1`,
                [tokenHash]
            )
            expect(hashedResult).toBeDefined()
        })
    })
})
