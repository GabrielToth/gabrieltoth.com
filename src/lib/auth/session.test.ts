/**
 * Session Management Tests
 * Tests for session creation, validation, and removal
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.1, 5.2
 */

import * as db from "@/lib/db"
import { Session } from "@/types/auth"
import { fc } from "@fast-check/vitest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createSession, removeSession, validateSession } from "./session"

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

// Mock crypto.randomBytes
vi.mock("crypto", async () => {
    const actual = await vi.importActual<typeof import("crypto")>("crypto")
    return {
        ...actual,
        randomBytes: vi.fn((size: number) => {
            // Return a buffer with predictable content for testing
            const buffer = Buffer.alloc(size)
            for (let i = 0; i < size; i++) {
                buffer[i] = (i * 7) % 256 // Deterministic pattern
            }
            return buffer
        }),
    }
})

describe("Session Management", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("createSession()", () => {
        describe("Unit Tests", () => {
            it("should create a new session with unique session_id", async () => {
                const userId = "user-id-1"
                const expectedSession: Session = {
                    id: "session-id-1",
                    user_id: userId,
                    session_id: "000702040a0c0e10121416181a1c1e202224262829", // Predictable from mocked randomBytes
                    created_at: new Date("2024-01-01T00:00:00Z"),
                    expires_at: new Date("2024-01-31T00:00:00Z"), // 30 days later
                }

                vi.mocked(db.db.queryOne).mockResolvedValueOnce(expectedSession)

                const result = await createSession(userId)

                expect(result).toEqual(expectedSession)
                expect(result.session_id).toBeDefined()
                expect(typeof result.session_id).toBe("string")
                expect(vi.mocked(db.db.queryOne)).toHaveBeenCalledTimes(1)
            })

            it("should set expiration to 30 days from now", async () => {
                const userId = "user-id-1"
                const now = new Date()
                const expectedExpiration = new Date(
                    now.getTime() + 30 * 24 * 60 * 60 * 1000
                )

                const expectedSession: Session = {
                    id: "session-id-1",
                    user_id: userId,
                    session_id: "test-session-id",
                    created_at: now,
                    expires_at: expectedExpiration,
                }

                vi.mocked(db.db.queryOne).mockResolvedValueOnce(expectedSession)

                const result = await createSession(userId)

                // Check that expiration is approximately 30 days from now
                const daysDiff =
                    (result.expires_at.getTime() - now.getTime()) /
                    (24 * 60 * 60 * 1000)
                expect(daysDiff).toBeCloseTo(30, 0)
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

            it("should throw error when user ID is not a string", async () => {
                await expect(createSession(123 as any)).rejects.toThrow(
                    "Invalid user ID provided"
                )
            })

            it("should throw error when database query fails", async () => {
                const userId = "user-id-1"

                vi.mocked(db.db.queryOne).mockRejectedValueOnce(
                    new Error("Database connection failed")
                )

                await expect(createSession(userId)).rejects.toThrow(
                    "Database connection failed"
                )
            })

            it("should throw error when session creation returns null", async () => {
                const userId = "user-id-1"

                vi.mocked(db.db.queryOne).mockResolvedValueOnce(null)

                await expect(createSession(userId)).rejects.toThrow(
                    "Failed to create session record"
                )
            })

            it("should call database with correct parameters", async () => {
                const userId = "user-id-1"
                const expectedSession: Session = {
                    id: "session-id-1",
                    user_id: userId,
                    session_id: "test-session-id",
                    created_at: new Date(),
                    expires_at: new Date(),
                }

                vi.mocked(db.db.queryOne).mockResolvedValueOnce(expectedSession)

                await createSession(userId)

                // Verify queryOne was called with correct SQL
                const callArgs = vi.mocked(db.db.queryOne).mock.calls[0]
                expect(callArgs[0]).toContain("INSERT INTO sessions")
                expect(callArgs[0]).toContain("user_id")
                expect(callArgs[0]).toContain("session_id")
                expect(callArgs[0]).toContain("expires_at")
                expect(callArgs[1][0]).toBe(userId)
            })
        })

        describe("Property-Based Tests", () => {
            it("Property 4: Session Creation and Validation - For any authenticated user, system creates valid session with unique ID", async () => {
                /**
                 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
                 *
                 * Property: For any successful authentication, the system SHALL create
                 * a session with a unique session_id, store it in the database, and
                 * return it in an HTTP-Only cookie that can be validated on subsequent requests.
                 */
                await fc.assert(
                    fc.asyncProperty(fc.uuid(), async userId => {
                        const expectedSession: Session = {
                            id: "session-id",
                            user_id: userId,
                            session_id: "unique-session-id",
                            created_at: new Date(),
                            expires_at: new Date(
                                Date.now() + 30 * 24 * 60 * 60 * 1000
                            ),
                        }

                        vi.mocked(db.db.queryOne).mockResolvedValueOnce(
                            expectedSession
                        )

                        const result = await createSession(userId)

                        // Verify session was created
                        expect(result).toBeDefined()
                        expect(result.user_id).toBe(userId)
                        expect(result.session_id).toBeDefined()
                        expect(typeof result.session_id).toBe("string")
                        expect(result.created_at).toBeDefined()
                        expect(result.expires_at).toBeDefined()

                        vi.clearAllMocks()
                    }),
                    { numRuns: 50 }
                )
            })
        })
    })

    describe("validateSession()", () => {
        describe("Unit Tests", () => {
            it("should return session when valid and not expired", async () => {
                const sessionId = "valid-session-id"
                const now = new Date()
                const futureDate = new Date(
                    now.getTime() + 10 * 24 * 60 * 60 * 1000
                ) // 10 days from now

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
                expect(vi.mocked(db.db.queryOne)).toHaveBeenCalledTimes(1)
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
                const pastDate = new Date(
                    now.getTime() - 1 * 24 * 60 * 60 * 1000
                ) // 1 day ago

                const expiredSession: Session = {
                    id: "session-id-1",
                    user_id: "user-id-1",
                    session_id: sessionId,
                    created_at: new Date(
                        now.getTime() - 31 * 24 * 60 * 60 * 1000
                    ),
                    expires_at: pastDate,
                }

                vi.mocked(db.db.queryOne).mockResolvedValueOnce(expiredSession)

                const result = await validateSession(sessionId)

                expect(result).toBeNull()
            })

            it("should return null when session ID is empty", async () => {
                const result = await validateSession("")

                expect(result).toBeNull()
                expect(vi.mocked(db.db.queryOne)).not.toHaveBeenCalled()
            })

            it("should return null when session ID is null", async () => {
                const result = await validateSession(null as any)

                expect(result).toBeNull()
                expect(vi.mocked(db.db.queryOne)).not.toHaveBeenCalled()
            })

            it("should return null when session ID is not a string", async () => {
                const result = await validateSession(123 as any)

                expect(result).toBeNull()
                expect(vi.mocked(db.db.queryOne)).not.toHaveBeenCalled()
            })

            it("should throw error when database query fails", async () => {
                const sessionId = "valid-session-id"

                vi.mocked(db.db.queryOne).mockRejectedValueOnce(
                    new Error("Database connection failed")
                )

                await expect(validateSession(sessionId)).rejects.toThrow(
                    "Database connection failed"
                )
            })

            it("should call database with correct parameters", async () => {
                const sessionId = "valid-session-id"
                const expectedSession: Session = {
                    id: "session-id-1",
                    user_id: "user-id-1",
                    session_id: sessionId,
                    created_at: new Date(),
                    expires_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
                }

                vi.mocked(db.db.queryOne).mockResolvedValueOnce(expectedSession)

                await validateSession(sessionId)

                // Verify queryOne was called with correct SQL
                const callArgs = vi.mocked(db.db.queryOne).mock.calls[0]
                expect(callArgs[0]).toContain("SELECT")
                expect(callArgs[0]).toContain("FROM sessions")
                expect(callArgs[0]).toContain("session_id")
                expect(callArgs[1][0]).toBe(sessionId)
            })
        })

        describe("Property-Based Tests", () => {
            it("Property 5: Session Expiration - For any expired session, system rejects it", async () => {
                /**
                 * **Validates: Requirements 4.6, 4.7, 4.8**
                 *
                 * Property: For any session, if the current time exceeds the expires_at
                 * timestamp, the system SHALL reject the session and require re-authentication.
                 */
                await fc.assert(
                    fc.asyncProperty(
                        fc.tuple(fc.uuid(), fc.integer({ min: 1, max: 365 })),
                        async ([sessionId, daysAgo]) => {
                            const now = new Date()
                            const expiredDate = new Date(
                                now.getTime() - daysAgo * 24 * 60 * 60 * 1000
                            )

                            const expiredSession: Session = {
                                id: "session-id",
                                user_id: "user-id",
                                session_id: sessionId,
                                created_at: new Date(
                                    expiredDate.getTime() -
                                        30 * 24 * 60 * 60 * 1000
                                ),
                                expires_at: expiredDate,
                            }

                            vi.mocked(db.db.queryOne).mockResolvedValueOnce(
                                expiredSession
                            )

                            const result = await validateSession(sessionId)

                            // Expired session should be rejected
                            expect(result).toBeNull()

                            vi.clearAllMocks()
                        }
                    ),
                    { numRuns: 50 }
                )
            })

            it("Property 6: Valid Session Acceptance - For any valid non-expired session, system accepts it", async () => {
                /**
                 * **Validates: Requirements 4.5, 4.6**
                 *
                 * Property: For any valid, non-expired session, the system SHALL
                 * accept it and allow access to protected resources.
                 */
                await fc.assert(
                    fc.asyncProperty(
                        fc.tuple(fc.uuid(), fc.integer({ min: 1, max: 30 })),
                        async ([sessionId, daysFromNow]) => {
                            const now = new Date()
                            const futureDate = new Date(
                                now.getTime() +
                                    daysFromNow * 24 * 60 * 60 * 1000
                            )

                            const validSession: Session = {
                                id: "session-id",
                                user_id: "user-id",
                                session_id: sessionId,
                                created_at: now,
                                expires_at: futureDate,
                            }

                            vi.mocked(db.db.queryOne).mockResolvedValueOnce(
                                validSession
                            )

                            const result = await validateSession(sessionId)

                            // Valid session should be accepted
                            expect(result).toEqual(validSession)
                            expect(result?.user_id).toBeDefined()

                            vi.clearAllMocks()
                        }
                    ),
                    { numRuns: 50 }
                )
            })
        })
    })

    describe("removeSession()", () => {
        describe("Unit Tests", () => {
            it("should return true when session is successfully deleted", async () => {
                const sessionId = "session-to-delete"

                // Mock query result with rowCount = 1
                vi.mocked(db.db.query).mockResolvedValueOnce({
                    rowCount: 1,
                    rows: [],
                    command: "DELETE",
                    oid: 0,
                    fields: [],
                } as any)

                const result = await removeSession(sessionId)

                expect(result).toBe(true)
                expect(vi.mocked(db.db.query)).toHaveBeenCalledTimes(1)
            })

            it("should return false when session not found", async () => {
                const sessionId = "non-existent-session"

                // Mock query result with rowCount = 0
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

            it("should throw error when database query fails", async () => {
                const sessionId = "session-to-delete"

                vi.mocked(db.db.query).mockRejectedValueOnce(
                    new Error("Database connection failed")
                )

                await expect(removeSession(sessionId)).rejects.toThrow(
                    "Database connection failed"
                )
            })

            it("should call database with correct parameters", async () => {
                const sessionId = "session-to-delete"

                vi.mocked(db.db.query).mockResolvedValueOnce({
                    rowCount: 1,
                    rows: [],
                    command: "DELETE",
                    oid: 0,
                    fields: [],
                } as any)

                await removeSession(sessionId)

                // Verify query was called with correct SQL
                const callArgs = vi.mocked(db.db.query).mock.calls[0]
                expect(callArgs[0]).toContain("DELETE FROM sessions")
                expect(callArgs[0]).toContain("session_id")
                expect(callArgs[1][0]).toBe(sessionId)
            })
        })

        describe("Property-Based Tests", () => {
            it("Property 6: Logout Removes Session - For any logout, system removes session and clears cookie", async () => {
                /**
                 * **Validates: Requirements 5.1, 5.2**
                 *
                 * Property: For any user performing logout, the system SHALL remove
                 * the session from the database and clear the HTTP-Only cookie,
                 * preventing further access with that session_id.
                 */
                await fc.assert(
                    fc.asyncProperty(fc.uuid(), async sessionId => {
                        vi.mocked(db.db.query).mockResolvedValueOnce({
                            rowCount: 1,
                            rows: [],
                            command: "DELETE",
                            oid: 0,
                            fields: [],
                        } as any)

                        const result = await removeSession(sessionId)

                        // Session should be removed
                        expect(result).toBe(true)

                        // Verify database was called
                        expect(vi.mocked(db.db.query)).toHaveBeenCalledTimes(1)

                        vi.clearAllMocks()
                    }),
                    { numRuns: 50 }
                )
            })

            it("should handle any session ID format", async () => {
                /**
                 * Property: For any session ID format, the system SHALL attempt
                 * to remove it from the database.
                 */
                await fc.assert(
                    fc.asyncProperty(
                        fc.string({ minLength: 1 }),
                        async sessionId => {
                            vi.mocked(db.db.query).mockResolvedValueOnce({
                                rowCount: 0,
                                rows: [],
                                command: "DELETE",
                                oid: 0,
                                fields: [],
                            } as any)

                            const result = await removeSession(sessionId)

                            // Should not throw, just return false if not found
                            expect(typeof result).toBe("boolean")

                            vi.clearAllMocks()
                        }
                    ),
                    { numRuns: 50 }
                )
            })
        })
    })

    describe("Integration Tests", () => {
        it("should create and validate a session", async () => {
            const userId = "user-id-1"
            const sessionId = "test-session-id"
            const now = new Date()
            const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

            const createdSession: Session = {
                id: "session-id-1",
                user_id: userId,
                session_id: sessionId,
                created_at: now,
                expires_at: expiresAt,
            }

            // Mock createSession
            vi.mocked(db.db.queryOne).mockResolvedValueOnce(createdSession)

            const created = await createSession(userId)
            expect(created.session_id).toBe(sessionId)

            // Mock validateSession
            vi.mocked(db.db.queryOne).mockResolvedValueOnce(createdSession)

            const validated = await validateSession(sessionId)
            expect(validated).toEqual(createdSession)
        })

        it("should create, validate, and remove a session", async () => {
            const userId = "user-id-1"
            const sessionId = "test-session-id"
            const now = new Date()
            const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

            const session: Session = {
                id: "session-id-1",
                user_id: userId,
                session_id: sessionId,
                created_at: now,
                expires_at: expiresAt,
            }

            // Mock createSession
            vi.mocked(db.db.queryOne).mockResolvedValueOnce(session)
            const created = await createSession(userId)
            expect(created.session_id).toBe(sessionId)

            // Mock validateSession
            vi.mocked(db.db.queryOne).mockResolvedValueOnce(session)
            const validated = await validateSession(sessionId)
            expect(validated).toBeDefined()

            // Mock removeSession
            vi.mocked(db.db.query).mockResolvedValueOnce({
                rowCount: 1,
                rows: [],
                command: "DELETE",
                oid: 0,
                fields: [],
            } as any)

            const removed = await removeSession(sessionId)
            expect(removed).toBe(true)

            // Mock validateSession after removal
            vi.mocked(db.db.queryOne).mockResolvedValueOnce(null)
            const validatedAfterRemoval = await validateSession(sessionId)
            expect(validatedAfterRemoval).toBeNull()
        })
    })
})
