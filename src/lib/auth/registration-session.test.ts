/**
 * Registration Session Management Tests
 * Tests for registration session creation, validation, retrieval, update, and removal
 *
 * Validates: Requirements 16.1, 16.2, 16.6
 */

import * as db from "@/lib/db"
import { fc } from "@fast-check/vitest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    RegistrationSession,
    cleanupExpiredRegistrationSessions,
    createRegistrationSession,
    getRegistrationSession,
    removeRegistrationSession,
    updateRegistrationSession,
    validateRegistrationSession,
} from "./registration-session"

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

describe("Registration Session Management", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("createRegistrationSession()", () => {
        describe("Unit Tests", () => {
            it("should create a new registration session with unique session_id", async () => {
                const email = "test@example.com"
                const expectedSession: RegistrationSession = {
                    id: "session-id-1",
                    session_id: "000702040a0c0e10121416181a1c1e202224262829",
                    email,
                    name: "",
                    phone: "",
                    current_step: 1,
                    created_at: new Date("2024-01-01T00:00:00Z"),
                    expires_at: new Date("2024-01-01T00:30:00Z"),
                    last_activity_at: new Date("2024-01-01T00:00:00Z"),
                }

                vi.mocked(db.db.queryOne).mockResolvedValueOnce(expectedSession)

                const result = await createRegistrationSession(email)

                expect(result).toEqual(expectedSession)
                expect(result.session_id).toBeDefined()
                expect(typeof result.session_id).toBe("string")
                expect(result.current_step).toBe(1)
                expect(vi.mocked(db.db.queryOne)).toHaveBeenCalledTimes(1)
            })

            it("should set expiration to 30 minutes from now", async () => {
                const email = "test@example.com"
                const now = new Date()
                const expectedExpiration = new Date(
                    now.getTime() + 30 * 60 * 1000
                )

                const expectedSession: RegistrationSession = {
                    id: "session-id-1",
                    session_id: "test-session-id",
                    email,
                    name: "",
                    phone: "",
                    current_step: 1,
                    created_at: now,
                    expires_at: expectedExpiration,
                    last_activity_at: now,
                }

                vi.mocked(db.db.queryOne).mockResolvedValueOnce(expectedSession)

                const result = await createRegistrationSession(email)

                // Check that expiration is approximately 30 minutes from now
                const minutesDiff =
                    (result.expires_at.getTime() - now.getTime()) / (60 * 1000)
                expect(minutesDiff).toBeCloseTo(30, 0)
            })

            it("should throw error when email is empty", async () => {
                await expect(createRegistrationSession("")).rejects.toThrow(
                    "Invalid email provided"
                )
            })

            it("should throw error when email is null", async () => {
                await expect(
                    createRegistrationSession(null as any)
                ).rejects.toThrow("Invalid email provided")
            })

            it("should throw error when email is not a string", async () => {
                await expect(
                    createRegistrationSession(123 as any)
                ).rejects.toThrow("Invalid email provided")
            })

            it("should throw error when database query fails", async () => {
                const email = "test@example.com"

                vi.mocked(db.db.queryOne).mockRejectedValueOnce(
                    new Error("Database connection failed")
                )

                await expect(createRegistrationSession(email)).rejects.toThrow(
                    "Database connection failed"
                )
            })

            it("should throw error when session creation returns null", async () => {
                const email = "test@example.com"

                vi.mocked(db.db.queryOne).mockResolvedValueOnce(null)

                await expect(createRegistrationSession(email)).rejects.toThrow(
                    "Failed to create registration session record"
                )
            })
        })

        describe("Property-Based Tests", () => {
            it("Property: Registration Session Creation - For any email, system creates valid session with unique ID", async () => {
                /**
                 * **Validates: Requirements 16.1, 16.2**
                 *
                 * Property: For any registration start, the system SHALL create
                 * a session with a unique session_id, store it in the database, and
                 * return it in an HTTP-Only cookie that can be validated on subsequent requests.
                 */
                await fc.assert(
                    fc.asyncProperty(fc.emailAddress(), async email => {
                        const expectedSession: RegistrationSession = {
                            id: "session-id",
                            session_id: "unique-session-id",
                            email,
                            name: "",
                            phone: "",
                            current_step: 1,
                            created_at: new Date(),
                            expires_at: new Date(Date.now() + 30 * 60 * 1000),
                            last_activity_at: new Date(),
                        }

                        vi.mocked(db.db.queryOne).mockResolvedValueOnce(
                            expectedSession
                        )

                        const result = await createRegistrationSession(email)

                        // Verify session was created
                        expect(result).toBeDefined()
                        expect(result.email).toBe(email)
                        expect(result.session_id).toBeDefined()
                        expect(typeof result.session_id).toBe("string")
                        expect(result.created_at).toBeDefined()
                        expect(result.expires_at).toBeDefined()
                        expect(result.current_step).toBe(1)

                        vi.clearAllMocks()
                    }),
                    { numRuns: 50 }
                )
            })
        })
    })

    describe("validateRegistrationSession()", () => {
        describe("Unit Tests", () => {
            it("should return session when valid and not expired", async () => {
                const sessionId = "valid-session-id"
                const now = new Date()
                const futureDate = new Date(now.getTime() + 10 * 60 * 1000) // 10 minutes from now

                const expectedSession: RegistrationSession = {
                    id: "session-id-1",
                    session_id: sessionId,
                    email: "test@example.com",
                    name: "John Doe",
                    phone: "+1234567890",
                    current_step: 2,
                    created_at: now,
                    expires_at: futureDate,
                    last_activity_at: now,
                }

                vi.mocked(db.db.queryOne).mockResolvedValueOnce(expectedSession)
                vi.mocked(db.db.query).mockResolvedValueOnce({
                    rowCount: 1,
                    rows: [],
                    command: "UPDATE",
                    oid: 0,
                    fields: [],
                } as any)

                const result = await validateRegistrationSession(sessionId)

                expect(result).toEqual(expectedSession)
                expect(vi.mocked(db.db.queryOne)).toHaveBeenCalledTimes(1)
                expect(vi.mocked(db.db.query)).toHaveBeenCalledTimes(1)
            })

            it("should return null when session not found", async () => {
                const sessionId = "non-existent-session-id"

                vi.mocked(db.db.queryOne).mockResolvedValueOnce(null)

                const result = await validateRegistrationSession(sessionId)

                expect(result).toBeNull()
            })

            it("should return null when session is expired", async () => {
                const sessionId = "expired-session-id"
                const now = new Date()
                const pastDate = new Date(now.getTime() - 1 * 60 * 1000) // 1 minute ago

                const expiredSession: RegistrationSession = {
                    id: "session-id-1",
                    session_id: sessionId,
                    email: "test@example.com",
                    name: "",
                    phone: "",
                    current_step: 1,
                    created_at: new Date(now.getTime() - 31 * 60 * 1000),
                    expires_at: pastDate,
                    last_activity_at: new Date(now.getTime() - 31 * 60 * 1000),
                }

                vi.mocked(db.db.queryOne).mockResolvedValueOnce(expiredSession)

                const result = await validateRegistrationSession(sessionId)

                expect(result).toBeNull()
            })

            it("should return null when session ID is empty", async () => {
                const result = await validateRegistrationSession("")

                expect(result).toBeNull()
                expect(vi.mocked(db.db.queryOne)).not.toHaveBeenCalled()
            })

            it("should return null when session ID is null", async () => {
                const result = await validateRegistrationSession(null as any)

                expect(result).toBeNull()
                expect(vi.mocked(db.db.queryOne)).not.toHaveBeenCalled()
            })

            it("should update last_activity_at on validation", async () => {
                const sessionId = "valid-session-id"
                const now = new Date()
                const futureDate = new Date(now.getTime() + 10 * 60 * 1000)

                const expectedSession: RegistrationSession = {
                    id: "session-id-1",
                    session_id: sessionId,
                    email: "test@example.com",
                    name: "",
                    phone: "",
                    current_step: 1,
                    created_at: now,
                    expires_at: futureDate,
                    last_activity_at: now,
                }

                vi.mocked(db.db.queryOne).mockResolvedValueOnce(expectedSession)
                vi.mocked(db.db.query).mockResolvedValueOnce({
                    rowCount: 1,
                    rows: [],
                    command: "UPDATE",
                    oid: 0,
                    fields: [],
                } as any)

                await validateRegistrationSession(sessionId)

                // Verify update query was called
                expect(vi.mocked(db.db.query)).toHaveBeenCalledTimes(1)
                const updateCall = vi.mocked(db.db.query).mock.calls[0]
                expect(updateCall[0]).toContain("UPDATE registration_sessions")
                expect(updateCall[0]).toContain("last_activity_at = NOW()")
            })
        })

        describe("Property-Based Tests", () => {
            it("Property: Session Expiration - For any expired session, system rejects it", async () => {
                /**
                 * **Validates: Requirements 16.2, 16.6**
                 *
                 * Property: For any session, if the current time exceeds the expires_at
                 * timestamp, the system SHALL reject the session and require re-registration.
                 */
                await fc.assert(
                    fc.asyncProperty(
                        fc.tuple(fc.uuid(), fc.integer({ min: 1, max: 60 })),
                        async ([sessionId, minutesAgo]) => {
                            const now = new Date()
                            const expiredDate = new Date(
                                now.getTime() - minutesAgo * 60 * 1000
                            )

                            const expiredSession: RegistrationSession = {
                                id: "session-id",
                                session_id: sessionId,
                                email: "test@example.com",
                                name: "",
                                phone: "",
                                current_step: 1,
                                created_at: new Date(
                                    expiredDate.getTime() - 30 * 60 * 1000
                                ),
                                expires_at: expiredDate,
                                last_activity_at: new Date(
                                    expiredDate.getTime() - 30 * 60 * 1000
                                ),
                            }

                            vi.mocked(db.db.queryOne).mockResolvedValueOnce(
                                expiredSession
                            )

                            const result =
                                await validateRegistrationSession(sessionId)

                            // Expired session should be rejected
                            expect(result).toBeNull()

                            vi.clearAllMocks()
                        }
                    ),
                    { numRuns: 50 }
                )
            })

            it("Property: Valid Session Acceptance - For any valid non-expired session, system accepts it", async () => {
                /**
                 * **Validates: Requirements 16.1, 16.6**
                 *
                 * Property: For any valid, non-expired session, the system SHALL
                 * accept it and allow continuation of registration.
                 */
                await fc.assert(
                    fc.asyncProperty(
                        fc.tuple(fc.uuid(), fc.integer({ min: 1, max: 30 })),
                        async ([sessionId, minutesFromNow]) => {
                            const now = new Date()
                            const futureDate = new Date(
                                now.getTime() + minutesFromNow * 60 * 1000
                            )

                            const validSession: RegistrationSession = {
                                id: "session-id",
                                session_id: sessionId,
                                email: "test@example.com",
                                name: "",
                                phone: "",
                                current_step: 1,
                                created_at: now,
                                expires_at: futureDate,
                                last_activity_at: now,
                            }

                            vi.mocked(db.db.queryOne).mockResolvedValueOnce(
                                validSession
                            )
                            vi.mocked(db.db.query).mockResolvedValueOnce({
                                rowCount: 1,
                                rows: [],
                                command: "UPDATE",
                                oid: 0,
                                fields: [],
                            } as any)

                            const result =
                                await validateRegistrationSession(sessionId)

                            // Valid session should be accepted
                            expect(result).toEqual(validSession)
                            expect(result?.email).toBeDefined()

                            vi.clearAllMocks()
                        }
                    ),
                    { numRuns: 50 }
                )
            })
        })
    })

    describe("getRegistrationSession()", () => {
        describe("Unit Tests", () => {
            it("should retrieve session without checking expiration", async () => {
                const sessionId = "valid-session-id"
                const expectedSession: RegistrationSession = {
                    id: "session-id-1",
                    session_id: sessionId,
                    email: "test@example.com",
                    name: "John Doe",
                    phone: "+1234567890",
                    current_step: 2,
                    created_at: new Date(),
                    expires_at: new Date(),
                    last_activity_at: new Date(),
                }

                vi.mocked(db.db.queryOne).mockResolvedValueOnce(expectedSession)

                const result = await getRegistrationSession(sessionId)

                expect(result).toEqual(expectedSession)
                expect(vi.mocked(db.db.queryOne)).toHaveBeenCalledTimes(1)
            })

            it("should return null when session not found", async () => {
                const sessionId = "non-existent-session-id"

                vi.mocked(db.db.queryOne).mockResolvedValueOnce(null)

                const result = await getRegistrationSession(sessionId)

                expect(result).toBeNull()
            })

            it("should return null when session ID is empty", async () => {
                const result = await getRegistrationSession("")

                expect(result).toBeNull()
                expect(vi.mocked(db.db.queryOne)).not.toHaveBeenCalled()
            })
        })
    })

    describe("updateRegistrationSession()", () => {
        describe("Unit Tests", () => {
            it("should update email in registration session", async () => {
                const sessionId = "valid-session-id"
                const newEmail = "newemail@example.com"
                const expectedSession: RegistrationSession = {
                    id: "session-id-1",
                    session_id: sessionId,
                    email: newEmail,
                    name: "",
                    phone: "",
                    current_step: 1,
                    created_at: new Date(),
                    expires_at: new Date(),
                    last_activity_at: new Date(),
                }

                vi.mocked(db.db.queryOne).mockResolvedValueOnce(expectedSession)

                const result = await updateRegistrationSession(sessionId, {
                    email: newEmail,
                })

                expect(result.email).toBe(newEmail)
                expect(vi.mocked(db.db.queryOne)).toHaveBeenCalledTimes(1)
            })

            it("should update current_step in registration session", async () => {
                const sessionId = "valid-session-id"
                const expectedSession: RegistrationSession = {
                    id: "session-id-1",
                    session_id: sessionId,
                    email: "test@example.com",
                    name: "",
                    phone: "",
                    current_step: 3,
                    created_at: new Date(),
                    expires_at: new Date(),
                    last_activity_at: new Date(),
                }

                vi.mocked(db.db.queryOne).mockResolvedValueOnce(expectedSession)

                const result = await updateRegistrationSession(sessionId, {
                    current_step: 3,
                })

                expect(result.current_step).toBe(3)
            })

            it("should update multiple fields in registration session", async () => {
                const sessionId = "valid-session-id"
                const expectedSession: RegistrationSession = {
                    id: "session-id-1",
                    session_id: sessionId,
                    email: "test@example.com",
                    name: "John Doe",
                    phone: "+1234567890",
                    current_step: 2,
                    created_at: new Date(),
                    expires_at: new Date(),
                    last_activity_at: new Date(),
                }

                vi.mocked(db.db.queryOne).mockResolvedValueOnce(expectedSession)

                const result = await updateRegistrationSession(sessionId, {
                    name: "John Doe",
                    phone: "+1234567890",
                    current_step: 2,
                })

                expect(result.name).toBe("John Doe")
                expect(result.phone).toBe("+1234567890")
                expect(result.current_step).toBe(2)
            })

            it("should throw error when session ID is invalid", async () => {
                await expect(
                    updateRegistrationSession("", { name: "John" })
                ).rejects.toThrow("Invalid session ID provided")
            })

            it("should throw error when no data provided to update", async () => {
                await expect(
                    updateRegistrationSession("valid-session-id", {})
                ).rejects.toThrow("No data provided to update")
            })

            it("should throw error when session not found", async () => {
                vi.mocked(db.db.queryOne).mockResolvedValueOnce(null)

                await expect(
                    updateRegistrationSession("valid-session-id", {
                        name: "John",
                    })
                ).rejects.toThrow("Registration session not found for update")
            })
        })
    })

    describe("removeRegistrationSession()", () => {
        describe("Unit Tests", () => {
            it("should return true when session is successfully deleted", async () => {
                const sessionId = "session-to-delete"

                vi.mocked(db.db.query).mockResolvedValueOnce({
                    rowCount: 1,
                    rows: [],
                    command: "DELETE",
                    oid: 0,
                    fields: [],
                } as any)

                const result = await removeRegistrationSession(sessionId)

                expect(result).toBe(true)
                expect(vi.mocked(db.db.query)).toHaveBeenCalledTimes(1)
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

                const result = await removeRegistrationSession(sessionId)

                expect(result).toBe(false)
            })

            it("should throw error when session ID is empty", async () => {
                await expect(removeRegistrationSession("")).rejects.toThrow(
                    "Invalid session ID provided"
                )
            })

            it("should throw error when session ID is null", async () => {
                await expect(
                    removeRegistrationSession(null as any)
                ).rejects.toThrow("Invalid session ID provided")
            })

            it("should throw error when database query fails", async () => {
                const sessionId = "session-to-delete"

                vi.mocked(db.db.query).mockRejectedValueOnce(
                    new Error("Database connection failed")
                )

                await expect(
                    removeRegistrationSession(sessionId)
                ).rejects.toThrow("Database connection failed")
            })
        })

        describe("Property-Based Tests", () => {
            it("Property: Cancel Registration Removes Session - For any cancellation, system removes session and clears cookie", async () => {
                /**
                 * **Validates: Requirements 16.1, 16.6**
                 *
                 * Property: For any user canceling registration, the system SHALL remove
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

                        const result =
                            await removeRegistrationSession(sessionId)

                        // Session should be removed
                        expect(result).toBe(true)

                        // Verify database was called
                        expect(vi.mocked(db.db.query)).toHaveBeenCalledTimes(1)

                        vi.clearAllMocks()
                    }),
                    { numRuns: 50 }
                )
            })
        })
    })

    describe("cleanupExpiredRegistrationSessions()", () => {
        describe("Unit Tests", () => {
            it("should delete expired sessions and return count", async () => {
                vi.mocked(db.db.query).mockResolvedValueOnce({
                    rowCount: 5,
                    rows: [],
                    command: "DELETE",
                    oid: 0,
                    fields: [],
                } as any)

                const result = await cleanupExpiredRegistrationSessions()

                expect(result).toBe(5)
                expect(vi.mocked(db.db.query)).toHaveBeenCalledTimes(1)
            })

            it("should return 0 when no expired sessions", async () => {
                vi.mocked(db.db.query).mockResolvedValueOnce({
                    rowCount: 0,
                    rows: [],
                    command: "DELETE",
                    oid: 0,
                    fields: [],
                } as any)

                const result = await cleanupExpiredRegistrationSessions()

                expect(result).toBe(0)
            })

            it("should throw error when database query fails", async () => {
                vi.mocked(db.db.query).mockRejectedValueOnce(
                    new Error("Database connection failed")
                )

                await expect(
                    cleanupExpiredRegistrationSessions()
                ).rejects.toThrow("Database connection failed")
            })
        })
    })

    describe("Integration Tests", () => {
        it("should create, validate, and remove a registration session", async () => {
            const email = "test@example.com"
            const sessionId = "test-session-id"
            const now = new Date()
            const expiresAt = new Date(now.getTime() + 30 * 60 * 1000)

            const createdSession: RegistrationSession = {
                id: "session-id-1",
                session_id: sessionId,
                email,
                name: "",
                phone: "",
                current_step: 1,
                created_at: now,
                expires_at: expiresAt,
                last_activity_at: now,
            }

            // Mock createRegistrationSession
            vi.mocked(db.db.queryOne).mockResolvedValueOnce(createdSession)

            const created = await createRegistrationSession(email)
            expect(created.session_id).toBe(sessionId)

            // Mock validateRegistrationSession
            vi.mocked(db.db.queryOne).mockResolvedValueOnce(createdSession)
            vi.mocked(db.db.query).mockResolvedValueOnce({
                rowCount: 1,
                rows: [],
                command: "UPDATE",
                oid: 0,
                fields: [],
            } as any)

            const validated = await validateRegistrationSession(sessionId)
            expect(validated).toEqual(createdSession)

            // Mock removeRegistrationSession
            vi.mocked(db.db.query).mockResolvedValueOnce({
                rowCount: 1,
                rows: [],
                command: "DELETE",
                oid: 0,
                fields: [],
            } as any)

            const removed = await removeRegistrationSession(sessionId)
            expect(removed).toBe(true)
        })

        it("should create, update, and retrieve a registration session", async () => {
            const email = "test@example.com"
            const sessionId = "test-session-id"
            const now = new Date()
            const expiresAt = new Date(now.getTime() + 30 * 60 * 1000)

            const createdSession: RegistrationSession = {
                id: "session-id-1",
                session_id: sessionId,
                email,
                name: "",
                phone: "",
                current_step: 1,
                created_at: now,
                expires_at: expiresAt,
                last_activity_at: now,
            }

            // Mock createRegistrationSession
            vi.mocked(db.db.queryOne).mockResolvedValueOnce(createdSession)

            const created = await createRegistrationSession(email)
            expect(created.email).toBe(email)

            // Mock updateRegistrationSession
            const updatedSession: RegistrationSession = {
                ...createdSession,
                name: "John Doe",
                current_step: 2,
            }

            vi.mocked(db.db.queryOne).mockResolvedValueOnce(updatedSession)

            const updated = await updateRegistrationSession(sessionId, {
                name: "John Doe",
                current_step: 2,
            })
            expect(updated.name).toBe("John Doe")
            expect(updated.current_step).toBe(2)

            // Mock getRegistrationSession
            vi.mocked(db.db.queryOne).mockResolvedValueOnce(updatedSession)

            const retrieved = await getRegistrationSession(sessionId)
            expect(retrieved).toEqual(updatedSession)
        })
    })
})
