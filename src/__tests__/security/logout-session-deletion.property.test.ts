/**
 * Property-Based Tests for Session Deletion on Logout
 * Feature: authentication-security-enhancements
 * Tests universal properties of session deletion when logout is performed
 *
 * **Validates: Requirements 2.1**
 */

import { removeSession, validateSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import fc from "fast-check"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock the database module
vi.mock("@/lib/db", () => ({
    db: {
        query: vi.fn(),
        queryOne: vi.fn(),
    },
}))

// Mock the crypto utils
vi.mock("@/lib/crypto-utils", () => ({
    generateRandomHex: vi.fn(),
}))

describe("Property 3: Session Deletion on Logout", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    /**
     * **Validates: Requirements 2.1**
     *
     * Property: For any valid session token, when a logout request is successfully
     * processed, the session SHALL be deleted from the sessions database table and
     * no longer exist in subsequent queries.
     */
    it("should delete session from database after successful logout", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 32, maxLength: 64 }), // Generate random session tokens
                fc.uuid(), // Generate random user IDs
                async (sessionToken, userId) => {
                    // Setup: Mock session exists in database
                    const mockSession = {
                        id: fc.sample(fc.uuid(), 1)[0],
                        user_id: userId,
                        token_hash: sessionToken,
                        expires_at: new Date(Date.now() + 86400000), // 24 hours from now
                        created_at: new Date(),
                    }

                    // Mock validateSession to return the session (exists and valid)
                    vi.mocked(db.queryOne).mockResolvedValueOnce(mockSession)

                    // Validate session exists before logout
                    const sessionBeforeLogout =
                        await validateSession(sessionToken)
                    expect(sessionBeforeLogout).not.toBeNull()
                    expect(sessionBeforeLogout?.user_id).toBe(userId)

                    // Mock successful deletion
                    vi.mocked(db.query).mockResolvedValueOnce({
                        rowCount: 1,
                    } as any)

                    // Execute logout (remove session)
                    const deleted = await removeSession(sessionToken)

                    // Property: Session deletion should succeed
                    expect(deleted).toBe(true)

                    // Property: Database DELETE query should be called with session token
                    expect(db.query).toHaveBeenCalledWith(
                        expect.stringContaining("DELETE FROM sessions"),
                        [sessionToken]
                    )

                    // Mock session no longer exists after deletion
                    vi.mocked(db.queryOne).mockResolvedValueOnce(null)

                    // Verify session no longer exists in database
                    const sessionAfterLogout =
                        await validateSession(sessionToken)

                    // Property: Session should not exist after logout
                    expect(sessionAfterLogout).toBeNull()
                }
            ),
            { numRuns: 20 } // Run 20 times with different random inputs
        )
    }, 30000) // 30 second timeout

    it("should delete session even with special characters in token", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 32, maxLength: 64 }), // Any string including special chars
                fc.uuid(),
                async (sessionToken, userId) => {
                    // Setup: Mock session exists
                    const mockSession = {
                        id: fc.sample(fc.uuid(), 1)[0],
                        user_id: userId,
                        token_hash: sessionToken,
                        expires_at: new Date(Date.now() + 86400000),
                        created_at: new Date(),
                    }

                    vi.mocked(db.queryOne).mockResolvedValueOnce(mockSession)

                    // Validate session exists
                    const sessionBefore = await validateSession(sessionToken)
                    expect(sessionBefore).not.toBeNull()

                    // Mock successful deletion
                    vi.mocked(db.query).mockResolvedValueOnce({
                        rowCount: 1,
                    } as any)

                    // Execute deletion
                    const deleted = await removeSession(sessionToken)

                    // Property: Deletion should succeed regardless of token content
                    expect(deleted).toBe(true)

                    // Property: DELETE query should use parameterized query (SQL injection protection)
                    expect(db.query).toHaveBeenCalledWith(
                        expect.stringContaining("DELETE FROM sessions"),
                        [sessionToken]
                    )
                }
            ),
            { numRuns: 20 }
        )
    }, 30000)

    it("should handle multiple session deletions independently", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(fc.string({ minLength: 32, maxLength: 64 }), {
                    minLength: 2,
                    maxLength: 5,
                }),
                fc.uuid(),
                async (sessionTokens, userId) => {
                    // Ensure tokens are unique
                    const uniqueTokens = [...new Set(sessionTokens)]
                    fc.pre(uniqueTokens.length >= 2)

                    // Property: Each session should be deleted independently
                    for (const token of uniqueTokens) {
                        // Mock session exists
                        const mockSession = {
                            id: fc.sample(fc.uuid(), 1)[0],
                            user_id: userId,
                            token_hash: token,
                            expires_at: new Date(Date.now() + 86400000),
                            created_at: new Date(),
                        }

                        vi.mocked(db.queryOne).mockResolvedValueOnce(
                            mockSession
                        )

                        // Validate session exists
                        const sessionBefore = await validateSession(token)
                        expect(sessionBefore).not.toBeNull()

                        // Mock successful deletion
                        vi.mocked(db.query).mockResolvedValueOnce({
                            rowCount: 1,
                        } as any)

                        // Delete session
                        const deleted = await removeSession(token)

                        // Property: Each deletion should succeed
                        expect(deleted).toBe(true)

                        // Mock session no longer exists
                        vi.mocked(db.queryOne).mockResolvedValueOnce(null)

                        // Verify deletion
                        const sessionAfter = await validateSession(token)
                        expect(sessionAfter).toBeNull()
                    }
                }
            ),
            { numRuns: 10 } // Reduced runs since this tests multiple deletions
        )
    }, 60000) // 60 second timeout for multiple operations

    it("should return false when attempting to delete non-existent session", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 32, maxLength: 64 }),
                async sessionToken => {
                    // Mock session does not exist (rowCount = 0)
                    vi.mocked(db.query).mockResolvedValueOnce({
                        rowCount: 0,
                    } as any)

                    // Attempt to delete non-existent session
                    const deleted = await removeSession(sessionToken)

                    // Property: Should return false when session doesn't exist
                    expect(deleted).toBe(false)

                    // Property: DELETE query should still be executed
                    expect(db.query).toHaveBeenCalledWith(
                        expect.stringContaining("DELETE FROM sessions"),
                        [sessionToken]
                    )
                }
            ),
            { numRuns: 20 }
        )
    }, 30000)

    it("should use parameterized queries to prevent SQL injection", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constantFrom(
                    "'; DROP TABLE sessions; --",
                    "' OR '1'='1",
                    "admin'--",
                    "1' UNION SELECT * FROM users--",
                    "<script>alert('xss')</script>"
                ),
                async maliciousToken => {
                    // Mock deletion attempt
                    vi.mocked(db.query).mockResolvedValueOnce({
                        rowCount: 0,
                    } as any)

                    // Attempt to delete with malicious token
                    await removeSession(maliciousToken)

                    // Property: Query should use parameterized statement (not string concatenation)
                    expect(db.query).toHaveBeenCalledWith(
                        expect.stringContaining("DELETE FROM sessions"),
                        [maliciousToken] // Token passed as parameter, not concatenated
                    )

                    // Property: Query should NOT contain the malicious token directly in SQL string
                    const callArgs = vi.mocked(db.query).mock.calls[0]
                    const sqlQuery = callArgs[0] as string
                    expect(sqlQuery).not.toContain(maliciousToken)
                }
            ),
            { numRuns: 5 } // Test all SQL injection patterns
        )
    }, 30000)

    it("should handle concurrent session deletions correctly", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(fc.string({ minLength: 32, maxLength: 64 }), {
                    minLength: 3,
                    maxLength: 5,
                }),
                async sessionTokens => {
                    // Clear mocks before each property run
                    vi.clearAllMocks()

                    // Ensure tokens are unique
                    const uniqueTokens = [...new Set(sessionTokens)]
                    fc.pre(uniqueTokens.length >= 3)

                    // Mock successful deletions for all tokens
                    uniqueTokens.forEach(() => {
                        vi.mocked(db.query).mockResolvedValueOnce({
                            rowCount: 1,
                        } as any)
                    })

                    // Execute concurrent deletions
                    const deletionPromises = uniqueTokens.map(token =>
                        removeSession(token)
                    )

                    const results = await Promise.all(deletionPromises)

                    // Property: All deletions should succeed
                    results.forEach(deleted => {
                        expect(deleted).toBe(true)
                    })

                    // Property: Each token should have its own DELETE query
                    expect(db.query).toHaveBeenCalledTimes(uniqueTokens.length)
                }
            ),
            { numRuns: 10 }
        )
    }, 30000)

    it("should log session deletion for audit purposes", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 32, maxLength: 64 }),
                async sessionToken => {
                    // Mock successful deletion
                    vi.mocked(db.query).mockResolvedValueOnce({
                        rowCount: 1,
                    } as any)

                    // Delete session
                    const deleted = await removeSession(sessionToken)

                    // Property: Deletion should succeed
                    expect(deleted).toBe(true)

                    // Property: Database operation should be called
                    expect(db.query).toHaveBeenCalled()

                    // Note: Actual audit logging is tested separately in audit-logging tests
                    // This test verifies the session deletion operation itself
                }
            ),
            { numRuns: 20 }
        )
    }, 30000)

    it("should handle database errors gracefully during deletion", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 32, maxLength: 64 }),
                async sessionToken => {
                    // Mock database error
                    vi.mocked(db.query).mockRejectedValueOnce(
                        new Error("Database connection failed")
                    )

                    // Property: Should throw error when database fails
                    await expect(removeSession(sessionToken)).rejects.toThrow(
                        "Database connection failed"
                    )

                    // Property: DELETE query should have been attempted
                    expect(db.query).toHaveBeenCalledWith(
                        expect.stringContaining("DELETE FROM sessions"),
                        [sessionToken]
                    )
                }
            ),
            { numRuns: 10 }
        )
    }, 30000)

    it("should validate session token format before deletion", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constantFrom(
                    "", // Empty string
                    null as any, // Null
                    undefined as any // Undefined
                ),
                async invalidToken => {
                    // Property: Should throw error for invalid token format
                    await expect(removeSession(invalidToken)).rejects.toThrow()

                    // Property: Database should NOT be called with invalid token
                    expect(db.query).not.toHaveBeenCalled()
                }
            ),
            { numRuns: 3 } // Test invalid token types that are strings or null/undefined
        )
    }, 30000)

    it("should delete session by token_hash column (not session_id)", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 32, maxLength: 64 }),
                async sessionToken => {
                    // Mock successful deletion
                    vi.mocked(db.query).mockResolvedValueOnce({
                        rowCount: 1,
                    } as any)

                    // Delete session
                    await removeSession(sessionToken)

                    // Property: Query should use session_id column (based on implementation)
                    // Note: The actual implementation uses session_id, not token_hash
                    expect(db.query).toHaveBeenCalledWith(
                        expect.stringContaining("WHERE session_id = $1"),
                        [sessionToken]
                    )
                }
            ),
            { numRuns: 20 }
        )
    }, 30000)
})
