/**
 * Property-Based Test: Deleted Session Authentication Failure
 *
 * **Validates: Requirements 2.4**
 *
 * Property 5: Deleted Session Authentication Failure
 * For any session token that has been deleted from the database, subsequent
 * authentication attempts using that token SHALL fail and return unauthorized status.
 *
 * This test uses property-based testing to verify that:
 * 1. When a session is deleted from the database, it no longer exists
 * 2. Subsequent validation attempts with the deleted session token return null/false
 * 3. Authentication requests with deleted session tokens are rejected
 * 4. The system consistently rejects deleted sessions across multiple attempts
 * 5. Deleted sessions cannot be used to access protected resources
 */

import { removeSession, validateSession } from "@/lib/auth/session"
import * as db from "@/lib/db"
import { Session } from "@/types/auth"
import { fc, test } from "@fast-check/vitest"
import { beforeEach, describe, expect, it, vi } from "vitest"

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

describe("Property 5: Deleted Session Authentication Failure", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test.prop([
        fc.uuid(),
        fc.uuid(),
        fc.integer({ min: 60 * 60 * 1000, max: 30 * 24 * 60 * 60 * 1000 }),
    ])(
        "should reject authentication with deleted session token",
        async (sessionId: string, userId: string, futureTimeMs: number) => {
            const futureDate = new Date(Date.now() + futureTimeMs)
            /**
             * **Validates: Requirements 2.4**
             *
             * For any session token that has been deleted from the database,
             * subsequent authentication attempts using that token SHALL fail
             * and return unauthorized status.
             *
             * This property tests that:
             * 1. A session can be created and validated
             * 2. After deletion, the same session cannot be validated
             * 3. The system consistently rejects the deleted session
             */

            // Step 1: Create a session that exists in the database
            const existingSession: Session = {
                id: sessionId,
                user_id: userId,
                session_id: sessionId,
                created_at: new Date(),
                expires_at: futureDate,
            }

            // Step 2: Validate the session exists (before deletion)
            vi.mocked(db.db.queryOne).mockResolvedValueOnce(existingSession)

            const validationBeforeDeletion = await validateSession(sessionId)
            expect(validationBeforeDeletion).not.toBeNull()
            expect(validationBeforeDeletion?.session_id).toBe(sessionId)

            // Step 3: Delete the session from the database
            vi.mocked(db.db.query).mockResolvedValueOnce({
                rowCount: 1,
                rows: [],
                command: "DELETE",
                oid: 0,
                fields: [],
            } as any)

            const deletionResult = await removeSession(sessionId)
            expect(deletionResult).toBe(true)

            // Step 4: Attempt to validate the deleted session
            // The database should return null (session not found)
            vi.mocked(db.db.queryOne).mockResolvedValueOnce(null)

            const validationAfterDeletion = await validateSession(sessionId)

            // Step 5: Assert that the deleted session cannot be validated
            expect(validationAfterDeletion).toBeNull()
        }
    )

    test.prop([
        fc.uuid(),
        fc.uuid(),
        fc.integer({ min: 60 * 60 * 1000, max: 30 * 24 * 60 * 60 * 1000 }),
    ])(
        "should consistently reject deleted sessions across multiple validation attempts",
        async (sessionId: string, userId: string, futureTimeMs: number) => {
            const futureDate = new Date(Date.now() + futureTimeMs)
            /**
             * **Validates: Requirements 2.4**
             *
             * For any session token that has been deleted from the database,
             * multiple subsequent authentication attempts using that token
             * SHALL all fail consistently.
             *
             * This property tests that:
             * 1. A deleted session is rejected on first validation attempt
             * 2. The same deleted session is rejected on subsequent attempts
             * 3. The system behavior is consistent across multiple attempts
             */

            // Step 1: Delete a session from the database
            vi.mocked(db.db.query).mockResolvedValueOnce({
                rowCount: 1,
                rows: [],
                command: "DELETE",
                oid: 0,
                fields: [],
            } as any)

            const deletionResult = await removeSession(sessionId)
            expect(deletionResult).toBe(true)

            // Step 2: Attempt to validate the deleted session multiple times
            const validationAttempts = 3
            const validationResults: (Session | null)[] = []

            for (let i = 0; i < validationAttempts; i++) {
                // Each validation attempt should query the database and find nothing
                vi.mocked(db.db.queryOne).mockResolvedValueOnce(null)

                const result = await validateSession(sessionId)
                validationResults.push(result)
            }

            // Step 3: Assert that all validation attempts failed
            validationResults.forEach(result => {
                expect(result).toBeNull()
            })

            // Step 4: Assert consistency - all attempts should have the same result
            const allResultsConsistent = validationResults.every(
                result => result === null
            )
            expect(allResultsConsistent).toBe(true)
        }
    )

    test.prop([
        fc.uuid(),
        fc.uuid(),
        fc.integer({ min: 60 * 60 * 1000, max: 30 * 24 * 60 * 60 * 1000 }),
    ])(
        "should prevent access to protected resources with deleted session token",
        async (sessionId: string, userId: string, futureTimeMs: number) => {
            const futureDate = new Date(Date.now() + futureTimeMs)
            /**
             * **Validates: Requirements 2.4**
             *
             * For any session token that has been deleted from the database,
             * subsequent requests to protected resources using that token
             * SHALL be rejected with unauthorized status.
             *
             * This property tests that:
             * 1. A session can be deleted
             * 2. Requests with the deleted session token are rejected
             * 3. The system prevents access to protected resources
             */

            // Step 1: Delete a session from the database
            vi.mocked(db.db.query).mockResolvedValueOnce({
                rowCount: 1,
                rows: [],
                command: "DELETE",
                oid: 0,
                fields: [],
            } as any)

            const deletionResult = await removeSession(sessionId)
            expect(deletionResult).toBe(true)

            // Step 2: Simulate a request to a protected resource with the deleted session
            // The middleware would attempt to validate the session
            vi.mocked(db.db.queryOne).mockResolvedValueOnce(null)

            const sessionValidation = await validateSession(sessionId)

            // Step 3: Assert that the session validation failed
            expect(sessionValidation).toBeNull()

            // Step 4: Assert that access would be denied
            // (In a real scenario, this would result in a 401 response)
            const isAuthenticated = sessionValidation !== null
            expect(isAuthenticated).toBe(false)
        }
    )

    test.prop([
        fc.uuid(),
        fc.uuid(),
        fc.integer({ min: 60 * 60 * 1000, max: 30 * 24 * 60 * 60 * 1000 }),
        fc.uuid(),
    ])(
        "should not confuse deleted sessions with other sessions",
        async (
            sessionId1: string,
            sessionId2: string,
            futureTimeMs: number,
            userId: string
        ) => {
            const futureDate = new Date(Date.now() + futureTimeMs)
            /**
             * **Validates: Requirements 2.4**
             *
             * For any session token that has been deleted from the database,
             * the system SHALL not confuse it with other valid sessions.
             *
             * This property tests that:
             * 1. When one session is deleted, other sessions remain valid
             * 2. The system correctly distinguishes between deleted and valid sessions
             * 3. Deleting one session doesn't affect other sessions
             */

            // Only test if session IDs are different
            fc.pre(sessionId1 !== sessionId2)

            // Step 1: Create two sessions
            const session1: Session = {
                id: sessionId1,
                user_id: userId,
                session_id: sessionId1,
                created_at: new Date(),
                expires_at: futureDate,
            }

            const session2: Session = {
                id: sessionId2,
                user_id: userId,
                session_id: sessionId2,
                created_at: new Date(),
                expires_at: futureDate,
            }

            // Step 2: Delete the first session
            vi.mocked(db.db.query).mockResolvedValueOnce({
                rowCount: 1,
                rows: [],
                command: "DELETE",
                oid: 0,
                fields: [],
            } as any)

            const deletionResult = await removeSession(sessionId1)
            expect(deletionResult).toBe(true)

            // Step 3: Validate that the first session is deleted
            vi.mocked(db.db.queryOne).mockResolvedValueOnce(null)

            const validation1 = await validateSession(sessionId1)
            expect(validation1).toBeNull()

            // Step 4: Validate that the second session still exists
            vi.mocked(db.db.queryOne).mockResolvedValueOnce(session2)

            const validation2 = await validateSession(sessionId2)
            expect(validation2).not.toBeNull()
            expect(validation2?.session_id).toBe(sessionId2)

            // Step 5: Assert that the sessions are correctly distinguished
            expect(validation1).toBeNull()
            expect(validation2).not.toBeNull()
        }
    )

    test.prop([
        fc.uuid(),
        fc.uuid(),
        fc.integer({ min: 60 * 60 * 1000, max: 30 * 24 * 60 * 60 * 1000 }),
    ])(
        "should handle deletion of non-existent sessions gracefully",
        async (sessionId: string, userId: string, futureTimeMs: number) => {
            const futureDate = new Date(Date.now() + futureTimeMs)
            /**
             * **Validates: Requirements 2.4**
             *
             * For any session token that does not exist in the database,
             * the system SHALL handle deletion attempts gracefully.
             *
             * This property tests that:
             * 1. Attempting to delete a non-existent session returns false
             * 2. The system doesn't throw errors for non-existent sessions
             * 3. Subsequent validation of non-existent sessions returns null
             */

            // Step 1: Attempt to delete a session that doesn't exist
            vi.mocked(db.db.query).mockResolvedValueOnce({
                rowCount: 0,
                rows: [],
                command: "DELETE",
                oid: 0,
                fields: [],
            } as any)

            const deletionResult = await removeSession(sessionId)

            // Step 2: Assert that deletion returned false (no rows deleted)
            expect(deletionResult).toBe(false)

            // Step 3: Validate that the session doesn't exist
            vi.mocked(db.db.queryOne).mockResolvedValueOnce(null)

            const validation = await validateSession(sessionId)

            // Step 4: Assert that validation returns null
            expect(validation).toBeNull()
        }
    )

    describe("Unit Tests for Deleted Session Authentication", () => {
        it("should return null when validating a deleted session", async () => {
            /**
             * **Validates: Requirements 2.4**
             *
             * When a session has been deleted from the database,
             * validateSession() SHALL return null.
             */
            const sessionId = "deleted-session-123"

            // Mock database to return null (session not found)
            vi.mocked(db.db.queryOne).mockResolvedValueOnce(null)

            const result = await validateSession(sessionId)

            expect(result).toBeNull()
        })

        it("should successfully delete a session from the database", async () => {
            /**
             * **Validates: Requirements 2.4**
             *
             * When removeSession() is called with a valid session ID,
             * it SHALL delete the session from the database.
             */
            const sessionId = "session-to-delete-123"

            // Mock database to return rowCount = 1 (one row deleted)
            vi.mocked(db.db.query).mockResolvedValueOnce({
                rowCount: 1,
                rows: [],
                command: "DELETE",
                oid: 0,
                fields: [],
            } as any)

            const result = await removeSession(sessionId)

            expect(result).toBe(true)
            expect(db.db.query).toHaveBeenCalledWith(
                "DELETE FROM sessions WHERE session_id = $1",
                [sessionId]
            )
        })

        it("should return false when deleting a non-existent session", async () => {
            /**
             * **Validates: Requirements 2.4**
             *
             * When removeSession() is called with a non-existent session ID,
             * it SHALL return false.
             */
            const sessionId = "non-existent-session-123"

            // Mock database to return rowCount = 0 (no rows deleted)
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

        it("should not authenticate with a deleted session token", async () => {
            /**
             * **Validates: Requirements 2.4**
             *
             * When a session has been deleted, authentication attempts
             * using that session token SHALL fail.
             */
            const sessionId = "deleted-session-456"

            // Step 1: Delete the session
            vi.mocked(db.db.query).mockResolvedValueOnce({
                rowCount: 1,
                rows: [],
                command: "DELETE",
                oid: 0,
                fields: [],
            } as any)

            await removeSession(sessionId)

            // Step 2: Attempt to validate the deleted session
            vi.mocked(db.db.queryOne).mockResolvedValueOnce(null)

            const result = await validateSession(sessionId)

            // Step 3: Assert that authentication failed
            expect(result).toBeNull()
        })

        it("should handle multiple deletions of the same session gracefully", async () => {
            /**
             * **Validates: Requirements 2.4**
             *
             * When removeSession() is called multiple times with the same session ID,
             * the first call SHALL succeed and subsequent calls SHALL return false.
             */
            const sessionId = "session-multiple-delete-123"

            // First deletion - session exists
            vi.mocked(db.db.query).mockResolvedValueOnce({
                rowCount: 1,
                rows: [],
                command: "DELETE",
                oid: 0,
                fields: [],
            } as any)

            const firstDeletion = await removeSession(sessionId)
            expect(firstDeletion).toBe(true)

            // Second deletion - session no longer exists
            vi.mocked(db.db.query).mockResolvedValueOnce({
                rowCount: 0,
                rows: [],
                command: "DELETE",
                oid: 0,
                fields: [],
            } as any)

            const secondDeletion = await removeSession(sessionId)
            expect(secondDeletion).toBe(false)
        })
    })
})
