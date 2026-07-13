/**
 * Session Core Tests
 * Tests for session creation, validation, removal, and cookie operations
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */

import * as db from "@/lib/db"
import * as cryptoUtils from "@/lib/crypto-utils"
import { logger } from "@/lib/logger"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { Session } from "@/types/auth"
import {
    createSession,
    validateSession,
    removeSession,
    getSessionFromCookie,
    setAuthSessionCookie,
} from "./session-core"

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

describe("Session Management", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("createSession()", () => {
        it("should create a new session with unique session_id", async () => {
            const userId = "user-id-1"
            const expectedSession: Session = {
                id: "session-id-1",
                user_id: userId,
                session_id: "test-session-id",
                created_at: new Date("2024-01-01T00:00:00Z"),
                expires_at: new Date("2024-01-31T00:00:00Z"),
            }

            vi.mocked(db.db.queryOne).mockResolvedValueOnce(expectedSession)

            const result = await createSession(userId)

            expect(result).toEqual(expectedSession)
            expect(result.session_id).toBeDefined()
            expect(typeof result.session_id).toBe("string")
        })

        it("should throw error when user ID is empty", async () => {
            await expect(createSession("")).rejects.toThrow(
                "Invalid user ID provided"
            )
        })

        it("should throw error when user ID is null", async () => {
            await expect(createSession(null as any)).rejects.toThrow(
                "Invalid user ID provided"
            )
        })

        it("should throw error when user ID is undefined", async () => {
            await expect(createSession(undefined as any)).rejects.toThrow(
                "Invalid user ID provided"
            )
        })

        it("should throw error when user ID is not a string", async () => {
            await expect(createSession(123 as any)).rejects.toThrow(
                "Invalid user ID provided"
            )
        })

        it("should throw error when database returns null after insert", async () => {
            const userId = "user-id-1"

            vi.mocked(db.db.queryOne).mockResolvedValueOnce(null)

            await expect(createSession(userId)).rejects.toThrow(
                "Failed to create session record"
            )

            expect(db.db.queryOne).toHaveBeenCalledTimes(1)
        })

        it("should throw error when database operation fails", async () => {
            const userId = "user-id-1"
            const dbError = new Error("Database connection failed")

            vi.mocked(db.db.queryOne).mockRejectedValueOnce(dbError)

            await expect(createSession(userId)).rejects.toThrow(
                "Database connection failed"
            )
        })

        it("should retry with new token on unique constraint violation", async () => {
            const userId = "user-id-1"
            const uniqueError = Object.assign(
                new Error(
                    'duplicate key value violates unique constraint "sessions_token_key"'
                ),
                { code: "23505" }
            )

            const expectedSession: Session = {
                id: "session-id-1",
                user_id: userId,
                session_id: "new-session-token",
                created_at: new Date("2024-01-01T00:00:00Z"),
                expires_at: new Date("2024-01-31T00:00:00Z"),
            }

            // First call fails with unique violation, second succeeds
            vi.mocked(db.db.queryOne)
                .mockRejectedValueOnce(uniqueError)
                .mockResolvedValueOnce(expectedSession)

            const result = await createSession(userId)

            expect(result).toEqual(expectedSession)
            expect(db.db.queryOne).toHaveBeenCalledTimes(2)
            expect(logger.warn).toHaveBeenCalledWith(
                "Session token collision detected, retrying with new token",
                expect.objectContaining({
                    context: "Auth",
                    data: expect.objectContaining({ userId, attempt: 1 }),
                })
            )
        })

        it("should throw after exhausting retries on persistent unique violations", async () => {
            const userId = "user-id-1"
            const uniqueError = Object.assign(
                new Error(
                    'duplicate key value violates unique constraint "sessions_token_key"'
                ),
                { code: "23505" }
            )

            // All 3 attempts fail with unique violation
            vi.mocked(db.db.queryOne)
                .mockRejectedValueOnce(uniqueError)
                .mockRejectedValueOnce(uniqueError)
                .mockRejectedValueOnce(uniqueError)

            await expect(createSession(userId)).rejects.toThrow(
                "Failed to create session after multiple attempts"
            )

            expect(db.db.queryOne).toHaveBeenCalledTimes(3)
        })
    })

    describe("validateSession()", () => {
        it("should return session when valid and not expired", async () => {
            const sessionId = "valid-session-id"
            const now = new Date()
            const futureDate = new Date(
                now.getTime() + 10 * 24 * 60 * 60 * 1000
            )

            const expectedSession: Session = {
                id: "session-id-1",
                user_id: "user-id-1",
                session_id: sessionId,
                created_at: now,
                expires_at: futureDate,
            }

            vi.mocked(db.db.queryOne).mockResolvedValueOnce(expectedSession)

            const result = await validateSession(sessionId)

            expect(result).toEqual(expectedSession)
        })

        it("should return null when session not found", async () => {
            const sessionId = "non-existent-session-id"

            vi.mocked(db.db.queryOne).mockResolvedValueOnce(null)

            const result = await validateSession(sessionId)

            expect(result).toBeNull()
        })

        it("should return null when session is expired", async () => {
            const sessionId = "expired-session-id"
            const now = new Date()
            const pastDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)

            const expiredSession: Session = {
                id: "session-id-1",
                user_id: "user-id-1",
                session_id: sessionId,
                created_at: new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000),
                expires_at: pastDate,
            }

            vi.mocked(db.db.queryOne).mockResolvedValueOnce(expiredSession)

            const result = await validateSession(sessionId)

            expect(result).toBeNull()
        })
    })

    describe("removeSession()", () => {
        it("should return true when session is successfully deleted", async () => {
            const sessionId = "session-to-delete"

            vi.mocked(db.db.query).mockResolvedValueOnce({
                rowCount: 1,
                rows: [],
                command: "DELETE",
                oid: 0,
                fields: [],
            } as any)

            const result = await removeSession(sessionId)

            expect(result).toBe(true)
        })

        it("should return false when session not found", async () => {
            const sessionId = "non-existent-session"

            vi.mocked(db.db.query).mockResolvedValueOnce({
                rowCount: 0,
                rows: [],
                command: "DELETE",
                oid: 0,
                fields: [],
            } as any)

            const result = await removeSession(sessionId)

            expect(result).toBe(false)
        })

        it("should throw error when session ID is empty", async () => {
            await expect(removeSession("")).rejects.toThrow(
                "Invalid session ID provided"
            )
        })

        it("should throw error when session ID is null", async () => {
            await expect(removeSession(null as any)).rejects.toThrow(
                "Invalid session ID provided"
            )
        })

        it("should throw error when session ID is not a string", async () => {
            await expect(removeSession(123 as any)).rejects.toThrow()
        })

        it("should call database with correct SQL query", async () => {
            const sessionId = "test-session-id"

            vi.mocked(db.db.query).mockResolvedValueOnce({
                rowCount: 1,
                rows: [],
                command: "DELETE",
                oid: 0,
                fields: [],
            } as any)

            await removeSession(sessionId)

            expect(db.db.query).toHaveBeenCalledWith(
                "DELETE FROM sessions WHERE token_hash = $1",
                [sessionId]
            )
        })

        it("should handle database errors gracefully", async () => {
            const sessionId = "test-session-id"
            const dbError = new Error("Database connection failed")

            vi.mocked(db.db.query).mockRejectedValueOnce(dbError)

            await expect(removeSession(sessionId)).rejects.toThrow(
                "Database connection failed"
            )
        })
    })

    describe("getSessionFromCookie()", () => {
        it("should return session when valid cookie exists", async () => {
            const sessionId = "valid-session-id"
            const now = new Date()
            const futureDate = new Date(
                now.getTime() + 10 * 24 * 60 * 60 * 1000
            )

            const expectedSession: Session = {
                id: "session-id-1",
                user_id: "user-id-1",
                session_id: sessionId,
                created_at: now,
                expires_at: futureDate,
            }

            const mockRequest = {
                cookies: {
                    get: vi.fn().mockReturnValue({ value: sessionId }),
                },
            } as any

            vi.mocked(db.db.queryOne).mockResolvedValueOnce(expectedSession)

            const result = await getSessionFromCookie(mockRequest)

            expect(result).toEqual(expectedSession)
            expect(mockRequest.cookies.get).toHaveBeenCalledWith("auth_session")
        })

        it("should return null when no session cookie exists", async () => {
            const mockRequest = {
                cookies: {
                    get: vi.fn().mockReturnValue(undefined),
                },
            } as any

            const result = await getSessionFromCookie(mockRequest)

            expect(result).toBeNull()
            expect(mockRequest.cookies.get).toHaveBeenCalledWith("auth_session")
        })

        it("should return null when session cookie has no value", async () => {
            const mockRequest = {
                cookies: {
                    get: vi.fn().mockReturnValue({ value: "" }),
                },
            } as any

            const result = await getSessionFromCookie(mockRequest)

            expect(result).toBeNull()
        })

        it("should return null when session is invalid", async () => {
            const sessionId = "invalid-session-id"

            const mockRequest = {
                cookies: {
                    get: vi.fn().mockReturnValue({ value: sessionId }),
                },
            } as any

            vi.mocked(db.db.queryOne).mockResolvedValueOnce(null)

            const result = await getSessionFromCookie(mockRequest)

            expect(result).toBeNull()
        })

        it("should return null when session is expired", async () => {
            const sessionId = "expired-session-id"
            const now = new Date()
            const pastDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)

            const expiredSession: Session = {
                id: "session-id-1",
                user_id: "user-id-1",
                session_id: sessionId,
                created_at: new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000),
                expires_at: pastDate,
            }

            const mockRequest = {
                cookies: {
                    get: vi.fn().mockReturnValue({ value: sessionId }),
                },
            } as any

            vi.mocked(db.db.queryOne).mockResolvedValueOnce(expiredSession)

            const result = await getSessionFromCookie(mockRequest)

            expect(result).toBeNull()
        })

        it("should handle database errors gracefully", async () => {
            const sessionId = "test-session-id"
            const dbError = new Error("Database connection failed")

            const mockRequest = {
                cookies: {
                    get: vi.fn().mockReturnValue({ value: sessionId }),
                },
            } as any

            vi.mocked(db.db.queryOne).mockRejectedValueOnce(dbError)

            const result = await getSessionFromCookie(mockRequest)

            expect(result).toBeNull()
        })

        it("should parse cookie correctly from request", async () => {
            const sessionId = "test-session-id-123"
            const now = new Date()
            const futureDate = new Date(
                now.getTime() + 10 * 24 * 60 * 60 * 1000
            )

            const expectedSession: Session = {
                id: "session-id-1",
                user_id: "user-id-1",
                session_id: sessionId,
                created_at: now,
                expires_at: futureDate,
            }

            const mockRequest = {
                cookies: {
                    get: vi.fn().mockReturnValue({ value: sessionId }),
                },
            } as any

            vi.mocked(db.db.queryOne).mockResolvedValueOnce(expectedSession)

            const result = await getSessionFromCookie(mockRequest)

            expect(result).toEqual(expectedSession)
            expect(mockRequest.cookies.get).toHaveBeenCalledTimes(1)
            expect(mockRequest.cookies.get).toHaveBeenCalledWith("auth_session")
        })
    })

    describe("validateSession() - Comprehensive Edge Cases", () => {
        it("should return null when session ID is not a string", async () => {
            const result = await validateSession(123 as any)

            expect(result).toBeNull()
            expect(db.db.queryOne).not.toHaveBeenCalled()
        })

        it("should return null when session ID is null", async () => {
            const result = await validateSession(null as any)

            expect(result).toBeNull()
            expect(db.db.queryOne).not.toHaveBeenCalled()
        })

        it("should return null when session ID is undefined", async () => {
            const result = await validateSession(undefined as any)

            expect(result).toBeNull()
            expect(db.db.queryOne).not.toHaveBeenCalled()
        })

        it("should return null when session ID is empty string", async () => {
            const result = await validateSession("")

            expect(result).toBeNull()
            expect(db.db.queryOne).not.toHaveBeenCalled()
        })

        it("should call database with correct SQL query", async () => {
            const sessionId = "test-session-id"
            const now = new Date()
            const futureDate = new Date(
                now.getTime() + 10 * 24 * 60 * 60 * 1000
            )

            const expectedSession: Session = {
                id: "session-id-1",
                user_id: "user-id-1",
                session_id: sessionId,
                created_at: now,
                expires_at: futureDate,
            }

            vi.mocked(db.db.queryOne).mockResolvedValueOnce(expectedSession)

            await validateSession(sessionId)

            expect(db.db.queryOne).toHaveBeenCalledWith(
                expect.stringContaining("SELECT"),
                [sessionId]
            )
            expect(db.db.queryOne).toHaveBeenCalledWith(
                expect.stringContaining("FROM sessions"),
                [sessionId]
            )
            expect(db.db.queryOne).toHaveBeenCalledWith(
                expect.stringContaining("WHERE token_hash = $1"),
                [sessionId]
            )
        })

        it("should handle database errors by throwing", async () => {
            const sessionId = "test-session-id"
            const dbError = new Error("Database connection failed")

            vi.mocked(db.db.queryOne).mockRejectedValueOnce(dbError)

            await expect(validateSession(sessionId)).rejects.toThrow(
                "Database connection failed"
            )
        })

        it("should validate expiration with exact boundary (expired by 1ms)", async () => {
            const sessionId = "boundary-session-id"
            const now = new Date()
            const expiredByOneMs = new Date(now.getTime() - 1)

            const expiredSession: Session = {
                id: "session-id-1",
                user_id: "user-id-1",
                session_id: sessionId,
                created_at: new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000),
                expires_at: expiredByOneMs,
            }

            vi.mocked(db.db.queryOne).mockResolvedValueOnce(expiredSession)

            const result = await validateSession(sessionId)

            expect(result).toBeNull()
        })

        it("should validate expiration with exact boundary (valid by 1ms)", async () => {
            const sessionId = "boundary-session-id"
            const now = new Date()
            const validByOneMs = new Date(now.getTime() + 1)

            const validSession: Session = {
                id: "session-id-1",
                user_id: "user-id-1",
                session_id: sessionId,
                created_at: now,
                expires_at: validByOneMs,
            }

            vi.mocked(db.db.queryOne).mockResolvedValueOnce(validSession)

            const result = await validateSession(sessionId)

            expect(result).toEqual(validSession)
        })
    })

    describe("setAuthSessionCookie()", () => {
        it("should set the auth_session cookie with the given token", async () => {
            const token = "valid-session-token"
            const { cookies } = await import("next/headers")
            const mockedCookies = vi.mocked(cookies)

            await setAuthSessionCookie(token)

            expect(mockedCookies).toHaveBeenCalledTimes(1)
            const cookieStore = await mockedCookies.mock.results[0].value
            expect(cookieStore.set).toHaveBeenCalledWith(
                "auth_session",
                token,
                expect.objectContaining({
                    httpOnly: true,
                    sameSite: "lax",
                    path: "/",
                })
            )
        })

        it("should throw error when token is empty", async () => {
            await expect(setAuthSessionCookie("")).rejects.toThrow(
                "Invalid session token provided"
            )
        })

        it("should throw error when token is null", async () => {
            await expect(setAuthSessionCookie(null as any)).rejects.toThrow(
                "Invalid session token provided"
            )
        })

        it("should throw error when cookies() fails", async () => {
            const token = "valid-token"
            const cookieError = new Error("Cookie store unavailable")
            const { cookies } = await import("next/headers")
            const mockedCookies = vi.mocked(cookies)

            mockedCookies.mockRejectedValueOnce(cookieError)

            await expect(setAuthSessionCookie(token)).rejects.toThrow(
                "Cookie store unavailable"
            )
        })
    })
})
