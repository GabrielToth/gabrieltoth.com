/**
 * Session Tokens Tests
 * Tests for token generation, validation, rotation, and cookie storage
 *
 * Validates: Requirements 5.1, 5.2, 5.3, 5.5, 5.6, 5.7
 */

import * as db from "@/lib/db"
import * as cryptoUtils from "@/lib/crypto-utils"
import { logger } from "@/lib/logger"
import { fc } from "@fast-check/vitest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { cookies } from "next/headers"
import {
    generateSessionToken,
    generateRememberMeToken,
    validateSessionToken,
    validateRememberMeToken,
    refreshSessionToken,
    storeSessionToken,
} from "./session-tokens"

// Mock the database module
vi.mock("@/lib/db", () => ({
    db: {
        queryOne: vi.fn(),
        query: vi.fn(),
        transaction: vi.fn(),
    },
}))

// Mock the logger module
vi.mock("@/lib/logger", () => ({
    logger: {
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}))

// Mock next/headers
vi.mock("next/headers", () => ({
    cookies: vi.fn(async () => ({
        set: vi.fn(),
        get: vi.fn(),
    })),
}))

describe("Session Token Management", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("generateSessionToken()", () => {
        it("should generate a cryptographically secure token", () => {
            const token = generateSessionToken()

            expect(token).toBeDefined()
            expect(typeof token).toBe("string")
            expect(token.length).toBe(64) // 32 bytes = 64 hex characters
            expect(/^[0-9a-f]+$/.test(token)).toBe(true)
        })

        it("should generate unique tokens on each call", () => {
            const token1 = generateSessionToken()
            const token2 = generateSessionToken()

            expect(token1).not.toBe(token2)
        })

        it("should propagate error when CSPRNG fails", () => {
            const cryptoError = new Error("CSPRNG unavailable")
            vi.spyOn(cryptoUtils, "generateRandomHex").mockImplementationOnce(
                () => {
                    throw cryptoError
                }
            )

            expect(() => generateSessionToken()).toThrow("CSPRNG unavailable")
            expect(logger.error).toHaveBeenCalledWith(
                "Failed to generate session token",
                expect.objectContaining({
                    context: "Auth",
                    error: cryptoError,
                })
            )
        })

        it("Property 7: Session Token Generation - For any call, system generates unique 32-byte token", async () => {
            await fc.assert(
                fc.asyncProperty(fc.integer({ min: 1, max: 50 }), async () => {
                    const token = generateSessionToken()

                    expect(token).toBeDefined()
                    expect(typeof token).toBe("string")
                    expect(token.length).toBe(64)
                    expect(/^[0-9a-f]+$/.test(token)).toBe(true)
                }),
                { numRuns: 50 }
            )
        })
    })

    describe("generateRememberMeToken()", () => {
        it("should generate a cryptographically secure token", () => {
            const token = generateRememberMeToken()

            expect(token).toBeDefined()
            expect(typeof token).toBe("string")
            expect(token.length).toBe(64)
            expect(/^[0-9a-f]+$/.test(token)).toBe(true)
        })

        it("should generate unique tokens on each call", () => {
            const token1 = generateRememberMeToken()
            const token2 = generateRememberMeToken()

            expect(token1).not.toBe(token2)
        })

        it("should propagate error when CSPRNG fails", () => {
            const cryptoError = new Error("CSPRNG unavailable")
            vi.spyOn(cryptoUtils, "generateRandomHex").mockImplementationOnce(
                () => {
                    throw cryptoError
                }
            )

            expect(() => generateRememberMeToken()).toThrow(
                "CSPRNG unavailable"
            )
            expect(logger.error).toHaveBeenCalledWith(
                "Failed to generate Remember Me token",
                expect.objectContaining({
                    context: "Auth",
                    error: cryptoError,
                })
            )
        })

        it("Property 8: Remember Me Token Generation - For any call, system generates unique 32-byte token", async () => {
            await fc.assert(
                fc.asyncProperty(fc.integer({ min: 1, max: 50 }), async () => {
                    const token = generateRememberMeToken()

                    expect(token).toBeDefined()
                    expect(typeof token).toBe("string")
                    expect(token.length).toBe(64)
                    expect(/^[0-9a-f]+$/.test(token)).toBe(true)
                }),
                { numRuns: 50 }
            )
        })
    })

    describe("storeSessionToken()", () => {
        it("should throw error when token is empty", async () => {
            await expect(storeSessionToken("")).rejects.toThrow(
                "Invalid session token provided"
            )
        })

        it("should throw error when token is null", async () => {
            await expect(storeSessionToken(null as any)).rejects.toThrow(
                "Invalid session token provided"
            )
        })

        it("should throw error when token is not a string", async () => {
            await expect(storeSessionToken(123 as any)).rejects.toThrow(
                "Invalid session token provided"
            )
        })

        it("should store session token in a secure cookie on success", async () => {
            const token = "valid-token-for-cookie"
            const mockedCookies = vi.mocked(cookies)

            await storeSessionToken(token)

            expect(mockedCookies).toHaveBeenCalledTimes(1)
            const cookieStore = await mockedCookies.mock.results[0].value
            expect(cookieStore.set).toHaveBeenCalledWith(
                "session_token",
                token,
                expect.objectContaining({
                    httpOnly: true,
                    sameSite: "lax",
                    path: "/",
                })
            )
        })

        it("should throw error when cookies() fails", async () => {
            const token = "valid-token"
            const cookieError = new Error("Cookie store unavailable")
            const mockedCookies = vi.mocked(cookies)

            mockedCookies.mockRejectedValueOnce(cookieError)

            await expect(storeSessionToken(token)).rejects.toThrow(
                "Cookie store unavailable"
            )
        })
    })

    describe("validateSessionToken()", () => {
        it("should return true when token is valid and not expired", async () => {
            const token = "valid-session-token"
            const now = new Date()
            const futureDate = new Date(now.getTime() + 30 * 60 * 1000)

            vi.mocked(db.db.queryOne).mockResolvedValueOnce({
                id: "token-id",
                user_id: "user-id",
                token_hash: token,
                expires_at: futureDate,
            })

            const result = await validateSessionToken(token)

            expect(result).toBe(true)
        })

        it("should return false when token not found", async () => {
            const token = "non-existent-token"

            vi.mocked(db.db.queryOne).mockResolvedValueOnce(null)

            const result = await validateSessionToken(token)

            expect(result).toBe(false)
        })

        it("should return false when token is expired", async () => {
            const token = "expired-token"
            const now = new Date()
            const pastDate = new Date(now.getTime() - 60 * 60 * 1000)

            vi.mocked(db.db.queryOne).mockResolvedValueOnce({
                id: "token-id",
                user_id: "user-id",
                token_hash: token,
                expires_at: pastDate,
            })

            const result = await validateSessionToken(token)

            expect(result).toBe(false)
        })

        it("should return false when token is empty", async () => {
            const result = await validateSessionToken("")

            expect(result).toBe(false)
            expect(vi.mocked(db.db.queryOne)).not.toHaveBeenCalled()
        })

        it("should return false when token is null", async () => {
            const result = await validateSessionToken(null as any)

            expect(result).toBe(false)
            expect(vi.mocked(db.db.queryOne)).not.toHaveBeenCalled()
        })

        it("should return false when token is undefined", async () => {
            const result = await validateSessionToken(undefined as any)

            expect(result).toBe(false)
            expect(vi.mocked(db.db.queryOne)).not.toHaveBeenCalled()
        })

        it("should return false when token is not a string", async () => {
            const result = await validateSessionToken(123 as any)

            expect(result).toBe(false)
            expect(vi.mocked(db.db.queryOne)).not.toHaveBeenCalled()
        })

        it("should return false when token expired exactly 1ms before now", async () => {
            vi.useFakeTimers()
            const fixedNow = new Date("2024-06-01T12:00:00.000Z")
            vi.setSystemTime(fixedNow)

            const token = "boundary-session-token"

            vi.mocked(db.db.queryOne).mockResolvedValueOnce({
                id: "token-id",
                user_id: "user-id",
                token_hash: token,
                expires_at: new Date(fixedNow.getTime() - 1),
            })

            const result = await validateSessionToken(token)

            expect(result).toBe(false)
            vi.useRealTimers()
        })

        it("should return true when token expires exactly at now", async () => {
            vi.useFakeTimers()
            const fixedNow = new Date("2024-06-01T12:00:00.000Z")
            vi.setSystemTime(fixedNow)

            const token = "boundary-session-token-valid"

            vi.mocked(db.db.queryOne).mockResolvedValueOnce({
                id: "token-id",
                user_id: "user-id",
                token_hash: token,
                expires_at: fixedNow,
            })

            const result = await validateSessionToken(token)

            expect(result).toBe(true)
            vi.useRealTimers()
        })

        it("should throw error when database operation fails", async () => {
            const token = "valid-token"
            const dbError = new Error("Database connection failed")

            vi.mocked(db.db.queryOne).mockRejectedValueOnce(dbError)

            await expect(validateSessionToken(token)).rejects.toThrow(
                "Database connection failed"
            )
        })

        it("Property 11: Session Token Validation - For any valid non-expired token, system accepts it", async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.tuple(
                        fc
                            .string({ minLength: 64, maxLength: 64 })
                            .map(() => generateSessionToken()),
                        fc.integer({ min: 1, max: 60 })
                    ),
                    async ([token, minutesFromNow]) => {
                        const now = new Date()
                        const futureDate = new Date(
                            now.getTime() + minutesFromNow * 60 * 1000
                        )

                        vi.mocked(db.db.queryOne).mockResolvedValueOnce({
                            id: "token-id",
                            user_id: "user-id",
                            token_hash: token,
                            expires_at: futureDate,
                        })

                        const result = await validateSessionToken(token)

                        expect(result).toBe(true)

                        vi.clearAllMocks()
                    }
                ),
                { numRuns: 30 }
            )
        })
    })

    describe("validateRememberMeToken()", () => {
        it("should return true when token is valid and not expired", async () => {
            const token = "valid-remember-me-token"
            const now = new Date()
            const futureDate = new Date(
                now.getTime() + 15 * 24 * 60 * 60 * 1000
            )

            vi.mocked(db.db.queryOne).mockResolvedValueOnce({
                id: "token-id",
                user_id: "user-id",
                token_hash: token,
                expires_at: futureDate,
            })

            const result = await validateRememberMeToken(token)

            expect(result).toBe(true)
        })

        it("should return false when token not found", async () => {
            const token = "non-existent-token"

            vi.mocked(db.db.queryOne).mockResolvedValueOnce(null)

            const result = await validateRememberMeToken(token)

            expect(result).toBe(false)
        })

        it("should return false when token is expired", async () => {
            const token = "expired-token"
            const now = new Date()
            const pastDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)

            vi.mocked(db.db.queryOne).mockResolvedValueOnce({
                id: "token-id",
                user_id: "user-id",
                token_hash: token,
                expires_at: pastDate,
            })

            const result = await validateRememberMeToken(token)

            expect(result).toBe(false)
        })

        it("should return false when token is empty", async () => {
            const result = await validateRememberMeToken("")

            expect(result).toBe(false)
            expect(vi.mocked(db.db.queryOne)).not.toHaveBeenCalled()
        })

        it("should return false when token is null", async () => {
            const result = await validateRememberMeToken(null as any)

            expect(result).toBe(false)
            expect(vi.mocked(db.db.queryOne)).not.toHaveBeenCalled()
        })

        it("should return false when token is undefined", async () => {
            const result = await validateRememberMeToken(undefined as any)

            expect(result).toBe(false)
            expect(vi.mocked(db.db.queryOne)).not.toHaveBeenCalled()
        })

        it("should return false when token is not a string", async () => {
            const result = await validateRememberMeToken(123 as any)

            expect(result).toBe(false)
            expect(vi.mocked(db.db.queryOne)).not.toHaveBeenCalled()
        })

        it("should return false when token expired exactly 1ms before now", async () => {
            vi.useFakeTimers()
            const fixedNow = new Date("2024-06-01T12:00:00.000Z")
            vi.setSystemTime(fixedNow)

            const token = "boundary-remember-me-token"

            vi.mocked(db.db.queryOne).mockResolvedValueOnce({
                id: "token-id",
                user_id: "user-id",
                token_hash: token,
                expires_at: new Date(fixedNow.getTime() - 1),
            })

            const result = await validateRememberMeToken(token)

            expect(result).toBe(false)
            vi.useRealTimers()
        })

        it("should return true when token expires exactly at now", async () => {
            vi.useFakeTimers()
            const fixedNow = new Date("2024-06-01T12:00:00.000Z")
            vi.setSystemTime(fixedNow)

            const token = "boundary-remember-me-token-valid"

            vi.mocked(db.db.queryOne).mockResolvedValueOnce({
                id: "token-id",
                user_id: "user-id",
                token_hash: token,
                expires_at: fixedNow,
            })

            const result = await validateRememberMeToken(token)

            expect(result).toBe(true)
            vi.useRealTimers()
        })

        it("should throw error when database operation fails", async () => {
            const token = "valid-token"
            const dbError = new Error("Database connection failed")

            vi.mocked(db.db.queryOne).mockRejectedValueOnce(dbError)

            await expect(validateRememberMeToken(token)).rejects.toThrow(
                "Database connection failed"
            )
        })

        it("Property 13: Remember Me Token Validation - For any valid non-expired token, system accepts it", async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.tuple(
                        fc
                            .string({ minLength: 64, maxLength: 64 })
                            .map(() => generateRememberMeToken()),
                        fc.integer({ min: 1, max: 30 })
                    ),
                    async ([token, daysFromNow]) => {
                        const now = new Date()
                        const futureDate = new Date(
                            now.getTime() + daysFromNow * 24 * 60 * 60 * 1000
                        )

                        vi.mocked(db.db.queryOne).mockResolvedValueOnce({
                            id: "token-id",
                            user_id: "user-id",
                            token_hash: token,
                            expires_at: futureDate,
                        })

                        const result = await validateRememberMeToken(token)

                        expect(result).toBe(true)

                        vi.clearAllMocks()
                    }
                ),
                { numRuns: 30 }
            )
        })
    })

    describe("refreshSessionToken()", () => {
        it("should return new token and expiration when token is valid", async () => {
            const token = "valid-token"
            const now = new Date()
            const futureDate = new Date(now.getTime() + 30 * 60 * 1000)
            const newExpiration = new Date(now.getTime() + 60 * 60 * 1000)

            vi.mocked(db.db.queryOne).mockResolvedValueOnce({
                id: "token-id",
                user_id: "user-id",
                expires_at: futureDate,
            })

            vi.mocked(db.db.transaction).mockImplementationOnce(
                async (fn: any) => {
                    return fn({
                        query: async () => ({
                            rows: [
                                {
                                    token_hash: "new-rotated-token",
                                    expires_at: newExpiration,
                                },
                            ],
                        }),
                    })
                }
            )

            const result = await refreshSessionToken(token)

            expect(result).toBeDefined()
            expect(result).toHaveProperty("token")
            expect(result).toHaveProperty("expiresAt")
            expect(result!.expiresAt).toEqual(newExpiration)
        })

        it("should return null when token not found", async () => {
            const token = "non-existent-token"

            vi.mocked(db.db.queryOne).mockResolvedValueOnce(null)

            const result = await refreshSessionToken(token)

            expect(result).toBeNull()
        })

        it("should return null when token is expired", async () => {
            const token = "expired-token"
            const now = new Date()
            const pastDate = new Date(now.getTime() - 60 * 60 * 1000)

            vi.mocked(db.db.queryOne).mockResolvedValueOnce({
                id: "token-id",
                user_id: "user-id",
                expires_at: pastDate,
            })

            const result = await refreshSessionToken(token)

            expect(result).toBeNull()
        })

        it("should return null when token is empty", async () => {
            const result = await refreshSessionToken("")

            expect(result).toBeNull()
            expect(vi.mocked(db.db.queryOne)).not.toHaveBeenCalled()
        })

        it("should return null when token is null", async () => {
            const result = await refreshSessionToken(null as any)

            expect(result).toBeNull()
            expect(vi.mocked(db.db.queryOne)).not.toHaveBeenCalled()
        })

        it("should return null when token is undefined", async () => {
            const result = await refreshSessionToken(undefined as any)

            expect(result).toBeNull()
            expect(vi.mocked(db.db.queryOne)).not.toHaveBeenCalled()
        })

        it("should return null when token is not a string", async () => {
            const result = await refreshSessionToken(123 as any)

            expect(result).toBeNull()
            expect(vi.mocked(db.db.queryOne)).not.toHaveBeenCalled()
        })

        it("should return null when token expired exactly 1ms before now", async () => {
            vi.useFakeTimers()
            const fixedNow = new Date("2024-06-01T12:00:00.000Z")
            vi.setSystemTime(fixedNow)

            const token = "boundary-refresh-token"

            vi.mocked(db.db.queryOne).mockResolvedValueOnce({
                id: "token-id",
                user_id: "user-id",
                expires_at: new Date(fixedNow.getTime() - 1),
            })

            const result = await refreshSessionToken(token)

            expect(result).toBeNull()
            vi.useRealTimers()
        })

        it("should refresh when token expires exactly at now", async () => {
            vi.useFakeTimers()
            const fixedNow = new Date("2024-06-01T12:00:00.000Z")
            vi.setSystemTime(fixedNow)

            const token = "boundary-refresh-token-valid"
            const newExpiration = new Date(fixedNow.getTime() + 60 * 60 * 1000)

            vi.mocked(db.db.queryOne).mockResolvedValueOnce({
                id: "token-id",
                user_id: "user-id",
                expires_at: fixedNow,
            })

            vi.mocked(db.db.transaction).mockImplementationOnce(
                async (fn: any) => {
                    return fn({
                        query: async () => ({
                            rows: [
                                {
                                    token_hash: "new-rotated-token",
                                    expires_at: newExpiration,
                                },
                            ],
                        }),
                    })
                }
            )

            const result = await refreshSessionToken(token)

            expect(result).toBeDefined()
            expect(result!.expiresAt).toEqual(newExpiration)
            vi.useRealTimers()
        })

        it("should throw error when transaction returns null", async () => {
            const token = "valid-token"
            const now = new Date()
            const futureDate = new Date(now.getTime() + 30 * 60 * 1000)

            vi.mocked(db.db.queryOne).mockResolvedValueOnce({
                id: "token-id",
                user_id: "user-id",
                expires_at: futureDate,
            })

            vi.mocked(db.db.transaction).mockImplementationOnce(
                async (fn: any) => {
                    return fn({
                        query: async () => ({ rows: [] }),
                    })
                }
            )

            await expect(refreshSessionToken(token)).rejects.toThrow(
                "Failed to rotate session token"
            )
        })

        it("should throw error when database operation fails", async () => {
            const token = "valid-token"
            const dbError = new Error("Database connection failed")

            vi.mocked(db.db.queryOne).mockRejectedValueOnce(dbError)

            await expect(refreshSessionToken(token)).rejects.toThrow(
                "Database connection failed"
            )
        })

        it("Property 15: Session Token Refresh - For any valid non-expired token, system rotates and extends expiration", async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.tuple(
                        fc
                            .string({ minLength: 64, maxLength: 64 })
                            .map(() => generateSessionToken()),
                        fc.integer({ min: 1, max: 60 })
                    ),
                    async ([token, minutesFromNow]) => {
                        const now = new Date()
                        const futureDate = new Date(
                            now.getTime() + minutesFromNow * 60 * 1000
                        )
                        const newExpiration = new Date(
                            now.getTime() + 60 * 60 * 1000
                        )

                        vi.mocked(db.db.queryOne).mockResolvedValueOnce({
                            id: "token-id",
                            user_id: "user-id",
                            expires_at: futureDate,
                        })

                        vi.mocked(db.db.transaction).mockImplementationOnce(
                            async (fn: any) => {
                                return fn({
                                    query: async () => ({
                                        rows: [
                                            {
                                                token_hash: "new-token",
                                                expires_at: newExpiration,
                                            },
                                        ],
                                    }),
                                })
                            }
                        )

                        const result = await refreshSessionToken(token)

                        expect(result).toBeDefined()
                        expect(result).toHaveProperty("token")
                        expect(result).toHaveProperty("expiresAt")

                        vi.clearAllMocks()
                    }
                ),
                { numRuns: 30 }
            )
        })
    })
})
