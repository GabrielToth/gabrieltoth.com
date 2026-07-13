/**
 * Session Remember Me Tests
 * Tests for Remember Me token CRUD operations and cookie storage
 *
 * Validates: Requirements 5.2, 5.4, 5.6
 */

import * as db from "@/lib/db"
import { logger } from "@/lib/logger"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { cookies } from "next/headers"
import { RememberMeToken } from "@/types/auth"
import {
    storeRememberMeToken,
    getRememberMeToken,
    deleteRememberMeToken,
    createRememberMeToken,
} from "./session-remember-me"

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

describe("Session Remember Me Token Management", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("storeRememberMeToken()", () => {
        it("should throw error when token is empty", async () => {
            await expect(storeRememberMeToken("")).rejects.toThrow(
                "Invalid Remember Me token provided"
            )
        })

        it("should throw error when token is null", async () => {
            await expect(storeRememberMeToken(null as any)).rejects.toThrow(
                "Invalid Remember Me token provided"
            )
        })

        it("should throw error when token is not a string", async () => {
            await expect(storeRememberMeToken(123 as any)).rejects.toThrow(
                "Invalid Remember Me token provided"
            )
        })

        it("should store remember me token in a secure cookie on success", async () => {
            const token = "valid-remember-me-token"
            const mockedCookies = vi.mocked(cookies)

            await storeRememberMeToken(token)

            expect(mockedCookies).toHaveBeenCalledTimes(1)
            const cookieStore = await mockedCookies.mock.results[0].value
            expect(cookieStore.set).toHaveBeenCalledWith(
                "remember_me_token",
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

            await expect(storeRememberMeToken(token)).rejects.toThrow(
                "Cookie store unavailable"
            )
        })
    })

    describe("createRememberMeToken()", () => {
        it("should create a new Remember Me token", async () => {
            const userId = "user-id-1"
            const expectedToken: RememberMeToken = {
                id: "token-id-1",
                user_id: userId,
                token_hash: "generated-token-hash",
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                created_at: new Date(),
                ip_address: null,
                user_agent: null,
            }

            vi.mocked(db.db.queryOne).mockResolvedValueOnce(expectedToken)

            const result = await createRememberMeToken(userId)

            expect(result).toEqual(expectedToken)
            expect(db.db.queryOne).toHaveBeenCalledTimes(1)
        })

        it("should create token with optional ipAddress and userAgent", async () => {
            const userId = "user-id-1"
            const ipAddress = "192.168.1.1"
            const userAgent = "TestAgent/1.0"
            const expectedToken: RememberMeToken = {
                id: "token-id-2",
                user_id: userId,
                token_hash: "generated-token-hash",
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                created_at: new Date(),
                ip_address: ipAddress,
                user_agent: userAgent,
            }

            vi.mocked(db.db.queryOne).mockResolvedValueOnce(expectedToken)

            const result = await createRememberMeToken(
                userId,
                ipAddress,
                userAgent
            )

            expect(result).toEqual(expectedToken)
            expect(result.ip_address).toBe(ipAddress)
            expect(result.user_agent).toBe(userAgent)
        })

        it("should throw error for invalid user ID", async () => {
            await expect(createRememberMeToken("")).rejects.toThrow(
                "Invalid user ID"
            )
        })

        it("should throw error when user ID is null", async () => {
            await expect(createRememberMeToken(null as any)).rejects.toThrow(
                "Invalid user ID"
            )
        })

        it("should throw error when database returns null", async () => {
            const userId = "user-id-1"

            vi.mocked(db.db.queryOne).mockResolvedValueOnce(null)

            await expect(createRememberMeToken(userId)).rejects.toThrow(
                "Failed to create Remember Me token"
            )
        })

        it("should throw error on database failure", async () => {
            const userId = "user-id-1"
            const dbError = new Error("Database connection failed")

            vi.mocked(db.db.queryOne).mockRejectedValueOnce(dbError)

            await expect(createRememberMeToken(userId)).rejects.toThrow(
                "Database connection failed"
            )
        })
    })

    describe("getRememberMeToken()", () => {
        it("should return token when valid and not expired", async () => {
            const token = "valid-remember-me-token"
            const futureDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
            const expectedToken: RememberMeToken = {
                id: "token-id-1",
                user_id: "user-id-1",
                token_hash: token,
                expires_at: futureDate,
                created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                ip_address: null,
                user_agent: null,
            }

            vi.mocked(db.db.queryOne).mockResolvedValueOnce(expectedToken)

            const result = await getRememberMeToken(token)

            expect(result).toEqual(expectedToken)
        })

        it("should return null when token not found", async () => {
            const token = "non-existent-token"

            vi.mocked(db.db.queryOne).mockResolvedValueOnce(null)

            const result = await getRememberMeToken(token)

            expect(result).toBeNull()
        })

        it("should return null and clean up when token is expired", async () => {
            const token = "expired-token"
            const pastDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            const expiredToken: RememberMeToken = {
                id: "token-id-1",
                user_id: "user-id-1",
                token_hash: token,
                expires_at: pastDate,
                created_at: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
                ip_address: null,
                user_agent: null,
            }

            vi.mocked(db.db.queryOne).mockResolvedValueOnce(expiredToken)
            vi.mocked(db.db.query).mockResolvedValueOnce({
                rowCount: 1,
                rows: [],
                command: "DELETE",
                oid: 0,
                fields: [],
            } as any)

            const result = await getRememberMeToken(token)

            expect(result).toBeNull()
            expect(db.db.query).toHaveBeenCalledWith(
                "DELETE FROM remember_me_tokens WHERE token_hash = $1",
                [token]
            )
        })

        it("should return null for invalid token", async () => {
            expect(await getRememberMeToken("")).toBeNull()
            expect(await getRememberMeToken(null as any)).toBeNull()
            expect(await getRememberMeToken(undefined as any)).toBeNull()
            expect(await getRememberMeToken(123 as any)).toBeNull()
        })

        it("should handle database errors gracefully", async () => {
            const token = "test-token"
            const dbError = new Error("Database connection failed")

            vi.mocked(db.db.queryOne).mockRejectedValueOnce(dbError)

            const result = await getRememberMeToken(token)

            expect(result).toBeNull()
            expect(logger.error).toHaveBeenCalled()
        })
    })

    describe("deleteRememberMeToken()", () => {
        it("should return true when token is successfully deleted", async () => {
            const token = "token-to-delete"

            vi.mocked(db.db.query).mockResolvedValueOnce({
                rowCount: 1,
                rows: [],
                command: "DELETE",
                oid: 0,
                fields: [],
            } as any)

            const result = await deleteRememberMeToken(token)

            expect(result).toBe(true)
        })

        it("should return false when token not found", async () => {
            const token = "non-existent-token"

            vi.mocked(db.db.query).mockResolvedValueOnce({
                rowCount: 0,
                rows: [],
                command: "DELETE",
                oid: 0,
                fields: [],
            } as any)

            const result = await deleteRememberMeToken(token)

            expect(result).toBe(false)
        })

        it("should return false for invalid token", async () => {
            expect(await deleteRememberMeToken("")).toBe(false)
            expect(await deleteRememberMeToken(null as any)).toBe(false)
            expect(await deleteRememberMeToken(undefined as any)).toBe(false)
            expect(await deleteRememberMeToken(123 as any)).toBe(false)
        })

        it("should handle database errors gracefully", async () => {
            const token = "test-token"
            const dbError = new Error("Database connection failed")

            vi.mocked(db.db.query).mockRejectedValueOnce(dbError)

            const result = await deleteRememberMeToken(token)

            expect(result).toBe(false)
            expect(logger.error).toHaveBeenCalled()
        })
    })
})
