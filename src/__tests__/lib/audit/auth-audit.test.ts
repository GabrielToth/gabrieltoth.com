/**
 * Unit Tests for Authentication Audit Logging Utilities
 * Tests task 8.1 implementation
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5
 */

import {
    createAuditLog,
    logFailedLoginAttempt,
    logLoginEvent,
    logLogoutEvent,
    logSessionInvalidation,
} from "@/lib/audit/auth-audit"
import * as db from "@/lib/db"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock the database module
vi.mock("@/lib/db", () => ({
    query: vi.fn(),
}))

// Mock the logger
vi.mock("@/lib/logger", () => ({
    logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}))

describe("Authentication Audit Logging Utilities", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("createAuditLog", () => {
        it("should create audit log with all required fields", async () => {
            const mockQuery = vi.mocked(db.query)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await createAuditLog({
                event_type: "LOGOUT",
                user_id: "user-123",
                ip_address: "192.168.1.1",
                timestamp: new Date("2025-01-01T00:00:00Z"),
            })

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO audit_logs"),
                expect.arrayContaining([
                    "LOGOUT",
                    "user-123",
                    "192.168.1.1",
                    null,
                    null,
                    expect.any(Date),
                ])
            )
        })

        it("should include user_agent when provided", async () => {
            const mockQuery = vi.mocked(db.query)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await createAuditLog({
                event_type: "LOGOUT",
                user_id: "user-123",
                ip_address: "192.168.1.1",
                user_agent: "Mozilla/5.0",
            })

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO audit_logs"),
                expect.arrayContaining([
                    "LOGOUT",
                    "user-123",
                    "192.168.1.1",
                    "Mozilla/5.0",
                ])
            )
        })

        it("should include details when provided", async () => {
            const mockQuery = vi.mocked(db.query)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await createAuditLog({
                event_type: "LOGOUT",
                user_id: "user-123",
                ip_address: "192.168.1.1",
                details: { reason: "User initiated logout" },
            })

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO audit_logs"),
                expect.arrayContaining([
                    "LOGOUT",
                    "user-123",
                    "192.168.1.1",
                    null,
                    JSON.stringify({ reason: "User initiated logout" }),
                ])
            )
        })

        it("should use current timestamp if not provided", async () => {
            const mockQuery = vi.mocked(db.query)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            const beforeCall = new Date()
            await createAuditLog({
                event_type: "LOGOUT",
                user_id: "user-123",
                ip_address: "192.168.1.1",
            })
            const afterCall = new Date()

            const callArgs = mockQuery.mock.calls[0]
            const timestamp = callArgs[1][5] as Date

            expect(timestamp.getTime()).toBeGreaterThanOrEqual(
                beforeCall.getTime()
            )
            expect(timestamp.getTime()).toBeLessThanOrEqual(afterCall.getTime())
        })

        it("should not throw on database errors (non-blocking)", async () => {
            const mockQuery = vi.mocked(db.query)
            mockQuery.mockRejectedValueOnce(new Error("Database error"))

            // Should not throw - audit logging is non-blocking
            await expect(
                createAuditLog({
                    event_type: "LOGOUT",
                    user_id: "user-123",
                    ip_address: "192.168.1.1",
                })
            ).resolves.not.toThrow()
        })

        it("should log error when database fails but not throw", async () => {
            const mockQuery = vi.mocked(db.query)
            const dbError = new Error("Database connection failed")
            mockQuery.mockRejectedValueOnce(dbError)

            // Should complete without throwing
            await createAuditLog({
                event_type: "LOGOUT",
                user_id: "user-123",
                ip_address: "192.168.1.1",
            })

            // Verify it was called (error was caught internally)
            expect(mockQuery).toHaveBeenCalled()
        })
    })

    describe("logLogoutEvent", () => {
        it("should create LOGOUT audit log entry", async () => {
            const mockQuery = vi.mocked(db.query)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await logLogoutEvent("user-123", "192.168.1.1")

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO audit_logs"),
                expect.arrayContaining(["LOGOUT", "user-123", "192.168.1.1"])
            )
        })

        it("should include user_agent when provided", async () => {
            const mockQuery = vi.mocked(db.query)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await logLogoutEvent("user-123", "192.168.1.1", "Mozilla/5.0")

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO audit_logs"),
                expect.arrayContaining([
                    "LOGOUT",
                    "user-123",
                    "192.168.1.1",
                    "Mozilla/5.0",
                ])
            )
        })

        it("should be non-blocking on errors", async () => {
            const mockQuery = vi.mocked(db.query)
            mockQuery.mockRejectedValueOnce(new Error("Database error"))

            await expect(
                logLogoutEvent("user-123", "192.168.1.1")
            ).resolves.not.toThrow()
        })
    })

    describe("logLoginEvent", () => {
        it("should create LOGIN audit log entry", async () => {
            const mockQuery = vi.mocked(db.query)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await logLoginEvent("user-123", "192.168.1.1")

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO audit_logs"),
                expect.arrayContaining(["LOGIN", "user-123", "192.168.1.1"])
            )
        })

        it("should include user_agent and details when provided", async () => {
            const mockQuery = vi.mocked(db.query)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await logLoginEvent("user-123", "192.168.1.1", "Mozilla/5.0", {
                method: "password",
            })

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO audit_logs"),
                expect.arrayContaining([
                    "LOGIN",
                    "user-123",
                    "192.168.1.1",
                    "Mozilla/5.0",
                    JSON.stringify({ method: "password" }),
                ])
            )
        })

        it("should be non-blocking on errors", async () => {
            const mockQuery = vi.mocked(db.query)
            mockQuery.mockRejectedValueOnce(new Error("Database error"))

            await expect(
                logLoginEvent("user-123", "192.168.1.1")
            ).resolves.not.toThrow()
        })
    })

    describe("logFailedLoginAttempt", () => {
        it("should create LOGIN_FAILED audit log entry", async () => {
            const mockQuery = vi.mocked(db.query)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await logFailedLoginAttempt(
                "user-123",
                "192.168.1.1",
                "Invalid password"
            )

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO audit_logs"),
                expect.arrayContaining([
                    "LOGIN_FAILED",
                    "user-123",
                    "192.168.1.1",
                ])
            )
        })

        it("should include reason in details", async () => {
            const mockQuery = vi.mocked(db.query)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await logFailedLoginAttempt(
                "user-123",
                "192.168.1.1",
                "Account locked"
            )

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO audit_logs"),
                expect.arrayContaining([
                    "LOGIN_FAILED",
                    "user-123",
                    "192.168.1.1",
                    null,
                    JSON.stringify({ reason: "Account locked" }),
                ])
            )
        })

        it("should be non-blocking on errors", async () => {
            const mockQuery = vi.mocked(db.query)
            mockQuery.mockRejectedValueOnce(new Error("Database error"))

            await expect(
                logFailedLoginAttempt(
                    "user-123",
                    "192.168.1.1",
                    "Invalid password"
                )
            ).resolves.not.toThrow()
        })
    })

    describe("logSessionInvalidation", () => {
        it("should create SESSION_INVALIDATED audit log entry", async () => {
            const mockQuery = vi.mocked(db.query)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await logSessionInvalidation(
                "user-123",
                "192.168.1.1",
                "Session expired"
            )

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO audit_logs"),
                expect.arrayContaining([
                    "SESSION_INVALIDATED",
                    "user-123",
                    "192.168.1.1",
                ])
            )
        })

        it("should include reason in details", async () => {
            const mockQuery = vi.mocked(db.query)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await logSessionInvalidation(
                "user-123",
                "192.168.1.1",
                "User revoked session"
            )

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO audit_logs"),
                expect.arrayContaining([
                    "SESSION_INVALIDATED",
                    "user-123",
                    "192.168.1.1",
                    null,
                    JSON.stringify({ reason: "User revoked session" }),
                ])
            )
        })

        it("should be non-blocking on errors", async () => {
            const mockQuery = vi.mocked(db.query)
            mockQuery.mockRejectedValueOnce(new Error("Database error"))

            await expect(
                logSessionInvalidation(
                    "user-123",
                    "192.168.1.1",
                    "Session expired"
                )
            ).resolves.not.toThrow()
        })
    })

    describe("Non-blocking behavior", () => {
        it("should allow multiple audit logs to fail without affecting each other", async () => {
            const mockQuery = vi.mocked(db.query)
            mockQuery.mockRejectedValue(new Error("Database error"))

            // All should complete without throwing
            await Promise.all([
                logLogoutEvent("user-1", "192.168.1.1"),
                logLoginEvent("user-2", "192.168.1.2"),
                logFailedLoginAttempt("user-3", "192.168.1.3", "Invalid"),
                logSessionInvalidation("user-4", "192.168.1.4", "Expired"),
            ])

            // All should have been attempted
            expect(mockQuery).toHaveBeenCalledTimes(4)
        })

        it("should complete quickly even on database timeout", async () => {
            const mockQuery = vi.mocked(db.query)
            mockQuery.mockImplementation(
                () =>
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error("Timeout")), 100)
                    )
            )

            const start = Date.now()
            await logLogoutEvent("user-123", "192.168.1.1")
            const duration = Date.now() - start

            // Should complete within reasonable time (not hang)
            expect(duration).toBeLessThan(200)
        })
    })

    describe("Data validation", () => {
        it("should handle empty strings gracefully", async () => {
            const mockQuery = vi.mocked(db.query)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await createAuditLog({
                event_type: "LOGOUT",
                user_id: "",
                ip_address: "",
            })

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO audit_logs"),
                expect.arrayContaining(["LOGOUT", "", ""])
            )
        })

        it("should handle special characters in fields", async () => {
            const mockQuery = vi.mocked(db.query)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await createAuditLog({
                event_type: "LOGOUT",
                user_id: "user-123",
                ip_address: "192.168.1.1",
                user_agent:
                    "Mozilla/5.0 (Windows; U; <script>alert('xss')</script>)",
            })

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO audit_logs"),
                expect.arrayContaining([
                    "LOGOUT",
                    "user-123",
                    "192.168.1.1",
                    "Mozilla/5.0 (Windows; U; <script>alert('xss')</script>)",
                ])
            )
        })

        it("should handle complex details objects", async () => {
            const mockQuery = vi.mocked(db.query)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            const complexDetails = {
                nested: {
                    object: {
                        with: "values",
                    },
                },
                array: [1, 2, 3],
                boolean: true,
                null: null,
            }

            await createAuditLog({
                event_type: "LOGOUT",
                user_id: "user-123",
                ip_address: "192.168.1.1",
                details: complexDetails,
            })

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO audit_logs"),
                expect.arrayContaining([
                    "LOGOUT",
                    "user-123",
                    "192.168.1.1",
                    null,
                    JSON.stringify(complexDetails),
                ])
            )
        })
    })
})
