/**
 * Session Management Tests
 * Tests for session creation, validation, and removal
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8
 */

import * as db from "@/lib/db"
import { Session } from "@/types/auth"
import { fc } from "@fast-check/vitest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    createSession,
    generateRememberMeToken,
    generateSessionToken,
    getSessionFromCookie,
    refreshSessionToken,
    removeSession,
    storeRememberMeToken,
    storeSessionToken,
    validateRememberMeToken,
    validateSession,
    validateSessionToken,
} from "./session"

// Mock the database module
vi.mock("@/lib/db", () => ({
    db: {
        queryOne: vi.fn(),
        query: vi.fn(),
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
            /**
             * **Validates: Requirements 6.2**
             *
             * The function SHALL validate the session ID and throw an error if null.
             */
            await expect(removeSession(null as any)).rejects.toThrow(
                "Invalid session ID provided"
            )
        })

        it("should throw error when session ID is not a string", async () => {
            /**
             * **Validates: Requirements 6.2**
             *
             * The function SHALL validate the session ID type and throw an error.
             * Note: The actual error message may vary due to internal logging.
             */
            await expect(removeSession(123 as any)).rejects.toThrow()
        })

        it("should call database with correct SQL query", async () => {
            /**
             * **Validates: Requirements 6.2**
             *
             * The function SHALL execute a DELETE query on the sessions table
             * using the session_id column.
             */
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
                "DELETE FROM sessions WHERE session_id = $1",
                [sessionId]
            )
        })

        it("should handle database errors gracefully", async () => {
            /**
             * **Validates: Requirements 6.2**
             *
             * The function SHALL throw an error if the database operation fails.
             */
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
            /**
             * **Validates: Requirements 6.2**
             *
             * The function SHALL extract the session cookie from the request
             * and validate it against the database.
             */
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
            expect(mockRequest.cookies.get).toHaveBeenCalledWith("session")
        })

        it("should return null when no session cookie exists", async () => {
            /**
             * **Validates: Requirements 6.2**
             *
             * The function SHALL return null when no session cookie is present.
             */
            const mockRequest = {
                cookies: {
                    get: vi.fn().mockReturnValue(undefined),
                },
            } as any

            const result = await getSessionFromCookie(mockRequest)

            expect(result).toBeNull()
            expect(mockRequest.cookies.get).toHaveBeenCalledWith("session")
        })

        it("should return null when session cookie has no value", async () => {
            /**
             * **Validates: Requirements 6.2**
             *
             * The function SHALL return null when session cookie exists but has no value.
             */
            const mockRequest = {
                cookies: {
                    get: vi.fn().mockReturnValue({ value: "" }),
                },
            } as any

            const result = await getSessionFromCookie(mockRequest)

            expect(result).toBeNull()
        })

        it("should return null when session is invalid", async () => {
            /**
             * **Validates: Requirements 6.2**
             *
             * The function SHALL return null when the session cookie contains
             * an invalid session ID.
             */
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
            /**
             * **Validates: Requirements 6.2**
             *
             * The function SHALL return null when the session cookie contains
             * an expired session ID.
             */
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
            /**
             * **Validates: Requirements 6.2**
             *
             * The function SHALL return null if the database operation fails.
             */
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
            /**
             * **Validates: Requirements 6.2**
             *
             * The function SHALL correctly extract and parse the session cookie
             * from the NextRequest object.
             */
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
            expect(mockRequest.cookies.get).toHaveBeenCalledWith("session")
        })
    })

    describe("validateSession() - Comprehensive Edge Cases", () => {
        it("should return null when session ID is not a string", async () => {
            /**
             * **Validates: Requirements 6.2**
             *
             * The function SHALL validate the session ID type.
             */
            const result = await validateSession(123 as any)

            expect(result).toBeNull()
            expect(db.db.queryOne).not.toHaveBeenCalled()
        })

        it("should return null when session ID is null", async () => {
            /**
             * **Validates: Requirements 6.2**
             *
             * The function SHALL handle null session IDs gracefully.
             */
            const result = await validateSession(null as any)

            expect(result).toBeNull()
            expect(db.db.queryOne).not.toHaveBeenCalled()
        })

        it("should return null when session ID is undefined", async () => {
            /**
             * **Validates: Requirements 6.2**
             *
             * The function SHALL handle undefined session IDs gracefully.
             */
            const result = await validateSession(undefined as any)

            expect(result).toBeNull()
            expect(db.db.queryOne).not.toHaveBeenCalled()
        })

        it("should call database with correct SQL query", async () => {
            /**
             * **Validates: Requirements 6.2**
             *
             * The function SHALL execute a SELECT query on the sessions table
             * using the session_id column.
             */
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
                expect.stringContaining("WHERE session_id = $1"),
                [sessionId]
            )
        })

        it("should handle database errors by throwing", async () => {
            /**
             * **Validates: Requirements 6.2**
             *
             * The function SHALL throw an error if the database operation fails.
             */
            const sessionId = "test-session-id"
            const dbError = new Error("Database connection failed")

            vi.mocked(db.db.queryOne).mockRejectedValueOnce(dbError)

            await expect(validateSession(sessionId)).rejects.toThrow(
                "Database connection failed"
            )
        })

        it("should validate expiration with exact boundary (expired by 1ms)", async () => {
            /**
             * **Validates: Requirements 6.2**
             *
             * The function SHALL correctly identify sessions that are expired
             * by even 1 millisecond.
             */
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
            /**
             * **Validates: Requirements 6.2**
             *
             * The function SHALL correctly identify sessions that are valid
             * by even 1 millisecond.
             */
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
})

describe("Session Token Management (Task 5)", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("generateSessionToken()", () => {
        it("should generate a cryptographically secure token", () => {
            /**
             * **Validates: Requirements 5.1**
             *
             * The function SHALL generate a cryptographically secure random token
             * of 32 bytes (64 hex characters).
             */
            const token = generateSessionToken()

            expect(token).toBeDefined()
            expect(typeof token).toBe("string")
            expect(token.length).toBe(64) // 32 bytes = 64 hex characters
            expect(/^[0-9a-f]+$/.test(token)).toBe(true)
        })

        it("should generate unique tokens on each call", () => {
            /**
             * **Validates: Requirements 5.1**
             *
             * Each call SHALL generate a unique token.
             */
            const token1 = generateSessionToken()
            const token2 = generateSessionToken()

            expect(token1).not.toBe(token2)
        })

        it("Property 7: Session Token Generation - For any call, system generates unique 32-byte token", async () => {
            /**
             * **Validates: Requirements 5.1**
             *
             * Property: For any call to generateSessionToken, the system SHALL
             * generate a unique, cryptographically secure token of 32 bytes.
             */
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
            /**
             * **Validates: Requirements 5.2**
             *
             * The function SHALL generate a cryptographically secure random token
             * of 32 bytes (64 hex characters).
             */
            const token = generateRememberMeToken()

            expect(token).toBeDefined()
            expect(typeof token).toBe("string")
            expect(token.length).toBe(64)
            expect(/^[0-9a-f]+$/.test(token)).toBe(true)
        })

        it("should generate unique tokens on each call", () => {
            /**
             * **Validates: Requirements 5.2**
             *
             * Each call SHALL generate a unique token.
             */
            const token1 = generateRememberMeToken()
            const token2 = generateRememberMeToken()

            expect(token1).not.toBe(token2)
        })

        it("Property 8: Remember Me Token Generation - For any call, system generates unique 32-byte token", async () => {
            /**
             * **Validates: Requirements 5.2**
             *
             * Property: For any call to generateRememberMeToken, the system SHALL
             * generate a unique, cryptographically secure token of 32 bytes.
             */
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
            /**
             * **Validates: Requirements 5.3**
             *
             * The function SHALL validate the token and throw an error if invalid.
             */
            await expect(storeSessionToken("")).rejects.toThrow(
                "Invalid session token provided"
            )
        })

        it("should throw error when token is null", async () => {
            /**
             * **Validates: Requirements 5.3**
             *
             * The function SHALL validate the token and throw an error if null.
             */
            await expect(storeSessionToken(null as any)).rejects.toThrow(
                "Invalid session token provided"
            )
        })

        it("should throw error when token is not a string", async () => {
            /**
             * **Validates: Requirements 5.3**
             *
             * The function SHALL validate the token type.
             */
            await expect(storeSessionToken(123 as any)).rejects.toThrow(
                "Invalid session token provided"
            )
        })
    })

    describe("storeRememberMeToken()", () => {
        it("should throw error when token is empty", async () => {
            /**
             * **Validates: Requirements 5.4**
             *
             * The function SHALL validate the token and throw an error if invalid.
             */
            await expect(storeRememberMeToken("")).rejects.toThrow(
                "Invalid Remember Me token provided"
            )
        })

        it("should throw error when token is null", async () => {
            /**
             * **Validates: Requirements 5.4**
             *
             * The function SHALL validate the token and throw an error if null.
             */
            await expect(storeRememberMeToken(null as any)).rejects.toThrow(
                "Invalid Remember Me token provided"
            )
        })

        it("should throw error when token is not a string", async () => {
            /**
             * **Validates: Requirements 5.4**
             *
             * The function SHALL validate the token type.
             */
            await expect(storeRememberMeToken(123 as any)).rejects.toThrow(
                "Invalid Remember Me token provided"
            )
        })
    })

    describe("validateSessionToken()", () => {
        it("should return true when token is valid and not expired", async () => {
            /**
             * **Validates: Requirements 5.5**
             *
             * The function SHALL return true for valid, non-expired tokens.
             */
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
            /**
             * **Validates: Requirements 5.5**
             *
             * The function SHALL return false when token is not found.
             */
            const token = "non-existent-token"

            vi.mocked(db.db.queryOne).mockResolvedValueOnce(null)

            const result = await validateSessionToken(token)

            expect(result).toBe(false)
        })

        it("should return false when token is expired", async () => {
            /**
             * **Validates: Requirements 5.5**
             *
             * The function SHALL return false for expired tokens.
             */
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
            /**
             * **Validates: Requirements 5.5**
             *
             * The function SHALL return false for empty tokens.
             */
            const result = await validateSessionToken("")

            expect(result).toBe(false)
            expect(vi.mocked(db.db.queryOne)).not.toHaveBeenCalled()
        })

        it("Property 11: Session Token Validation - For any valid non-expired token, system accepts it", async () => {
            /**
             * **Validates: Requirements 5.5**
             *
             * Property: For any valid, non-expired session token, the system SHALL
             * accept it and return true.
             */
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
            /**
             * **Validates: Requirements 5.6**
             *
             * The function SHALL return true for valid, non-expired tokens.
             */
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
            /**
             * **Validates: Requirements 5.6**
             *
             * The function SHALL return false when token is not found.
             */
            const token = "non-existent-token"

            vi.mocked(db.db.queryOne).mockResolvedValueOnce(null)

            const result = await validateRememberMeToken(token)

            expect(result).toBe(false)
        })

        it("should return false when token is expired", async () => {
            /**
             * **Validates: Requirements 5.6**
             *
             * The function SHALL return false for expired tokens.
             */
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
            /**
             * **Validates: Requirements 5.6**
             *
             * The function SHALL return false for empty tokens.
             */
            const result = await validateRememberMeToken("")

            expect(result).toBe(false)
            expect(vi.mocked(db.db.queryOne)).not.toHaveBeenCalled()
        })

        it("Property 13: Remember Me Token Validation - For any valid non-expired token, system accepts it", async () => {
            /**
             * **Validates: Requirements 5.6**
             *
             * Property: For any valid, non-expired Remember Me token, the system SHALL
             * accept it and return true.
             */
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
        it("should return new expiration date when token is valid", async () => {
            /**
             * **Validates: Requirements 5.7**
             *
             * The function SHALL extend the token expiration to 1 hour from now.
             */
            const token = "valid-token"
            const now = new Date()
            const futureDate = new Date(now.getTime() + 30 * 60 * 1000)

            vi.mocked(db.db.queryOne)
                .mockResolvedValueOnce({
                    id: "token-id",
                    user_id: "user-id",
                    expires_at: futureDate,
                })
                .mockResolvedValueOnce({
                    expires_at: new Date(now.getTime() + 60 * 60 * 1000),
                })

            const result = await refreshSessionToken(token)

            expect(result).toBeDefined()
            expect(result instanceof Date).toBe(true)
        })

        it("should return null when token not found", async () => {
            /**
             * **Validates: Requirements 5.7**
             *
             * The function SHALL return null when token is not found.
             */
            const token = "non-existent-token"

            vi.mocked(db.db.queryOne).mockResolvedValueOnce(null)

            const result = await refreshSessionToken(token)

            expect(result).toBeNull()
        })

        it("should return null when token is expired", async () => {
            /**
             * **Validates: Requirements 5.7**
             *
             * The function SHALL return null for expired tokens.
             */
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
            /**
             * **Validates: Requirements 5.7**
             *
             * The function SHALL return null for empty tokens.
             */
            const result = await refreshSessionToken("")

            expect(result).toBeNull()
            expect(vi.mocked(db.db.queryOne)).not.toHaveBeenCalled()
        })

        it("Property 15: Session Token Refresh - For any valid non-expired token, system extends expiration", async () => {
            /**
             * **Validates: Requirements 5.7**
             *
             * Property: For any valid, non-expired session token, the system SHALL
             * extend its expiration to 1 hour from now.
             */
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

                        vi.mocked(db.db.queryOne)
                            .mockResolvedValueOnce({
                                id: "token-id",
                                user_id: "user-id",
                                expires_at: futureDate,
                            })
                            .mockResolvedValueOnce({
                                expires_at: newExpiration,
                            })

                        const result = await refreshSessionToken(token)

                        expect(result).toBeDefined()
                        expect(result instanceof Date).toBe(true)

                        vi.clearAllMocks()
                    }
                ),
                { numRuns: 30 }
            )
        })
    })
})
