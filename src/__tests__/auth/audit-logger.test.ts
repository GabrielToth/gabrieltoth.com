/**
 * Unit Tests for Audit Logger
 * Tests all audit logging functions with >90% coverage
 * Validates: Requirements 6.1-6.8
 */

import {
    cleanupOldAuditLogs,
    exportAuditLogs,
    getAuditLogsByEventType,
    getFailedLoginsByIP,
    getRecentSecurityEvents,
    getUserAuditLogs,
    logCSRFFailure,
    logLoginAttempt,
    logRateLimitEvent,
    logRememberMeEvent,
} from "@/lib/auth/audit-logger"
import * as db from "@/lib/db"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock the database module
vi.mock("@/lib/db", () => ({
    db: {
        query: vi.fn(),
        queryOne: vi.fn(),
    },
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

describe("Audit Logger", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("logLoginAttempt", () => {
        it("should log a successful login attempt", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await logLoginAttempt(
                "user@example.com",
                "192.168.1.1",
                "Mozilla/5.0",
                true,
                undefined,
                "user-123"
            )

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO audit_logs"),
                expect.arrayContaining([
                    "LOGIN_SUCCESS",
                    "user-123",
                    "user@example.com",
                    "192.168.1.1",
                    "Mozilla/5.0",
                ])
            )
        })

        it("should log a failed login attempt with reason", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await logLoginAttempt(
                "user@example.com",
                "192.168.1.1",
                "Mozilla/5.0",
                false,
                "Invalid password"
            )

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO audit_logs"),
                expect.arrayContaining([
                    "LOGIN_FAILED",
                    null,
                    "user@example.com",
                    "192.168.1.1",
                    "Mozilla/5.0",
                ])
            )
        })

        it("should include timestamp in details", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await logLoginAttempt(
                "user@example.com",
                "192.168.1.1",
                "Mozilla/5.0",
                true
            )

            const callArgs = mockQuery.mock.calls[0]
            const detailsJson = callArgs[1][5] as string
            const details = JSON.parse(detailsJson)

            expect(details).toHaveProperty("timestamp")
            expect(details).toHaveProperty("success", true)
        })

        it("should handle database errors gracefully", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockRejectedValueOnce(new Error("Database error"))

            // Should not throw
            await expect(
                logLoginAttempt(
                    "user@example.com",
                    "192.168.1.1",
                    "Mozilla/5.0",
                    true
                )
            ).resolves.not.toThrow()
        })

        it("should log without userId if not provided", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await logLoginAttempt(
                "user@example.com",
                "192.168.1.1",
                "Mozilla/5.0",
                false,
                "User not found"
            )

            const callArgs = mockQuery.mock.calls[0]
            expect(callArgs[1][1]).toBeNull()
        })
    })

    describe("logCSRFFailure", () => {
        it("should log a CSRF failure", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await logCSRFFailure("192.168.1.1", "Mozilla/5.0", "Token mismatch")

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO audit_logs"),
                expect.arrayContaining([
                    "CSRF_FAILURE",
                    null,
                    "192.168.1.1",
                    "Mozilla/5.0",
                ])
            )
        })

        it("should log CSRF failure with email if provided", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await logCSRFFailure(
                "192.168.1.1",
                "Mozilla/5.0",
                "Token expired",
                "user@example.com"
            )

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO audit_logs"),
                expect.arrayContaining([
                    "CSRF_FAILURE",
                    "user@example.com",
                    "192.168.1.1",
                    "Mozilla/5.0",
                ])
            )
        })

        it("should include reason in details", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await logCSRFFailure(
                "192.168.1.1",
                "Mozilla/5.0",
                "Invalid token format"
            )

            const callArgs = mockQuery.mock.calls[0]
            const detailsJson = callArgs[1][4] as string
            const details = JSON.parse(detailsJson)

            expect(details).toHaveProperty("reason", "Invalid token format")
            expect(details).toHaveProperty("action", "CSRF validation failed")
        })

        it("should handle database errors gracefully", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockRejectedValueOnce(new Error("Database error"))

            await expect(
                logCSRFFailure("192.168.1.1", "Mozilla/5.0", "Token mismatch")
            ).resolves.not.toThrow()
        })
    })

    describe("logRateLimitEvent", () => {
        it("should log a rate limit exceeded event", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await logRateLimitEvent(
                "192.168.1.1",
                "Mozilla/5.0",
                5,
                "user@example.com"
            )

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO audit_logs"),
                expect.arrayContaining([
                    "RATE_LIMIT_EXCEEDED",
                    "user@example.com",
                    "192.168.1.1",
                    "Mozilla/5.0",
                ])
            )
        })

        it("should include attempt count in details", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await logRateLimitEvent("192.168.1.1", "Mozilla/5.0", 6)

            const callArgs = mockQuery.mock.calls[0]
            const detailsJson = callArgs[1][4] as string
            const details = JSON.parse(detailsJson)

            expect(details).toHaveProperty("attemptCount", 6)
            expect(details).toHaveProperty("limit", 5)
            expect(details).toHaveProperty("window", "1 hour")
        })

        it("should log without email if not provided", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await logRateLimitEvent("192.168.1.1", "Mozilla/5.0", 5)

            const callArgs = mockQuery.mock.calls[0]
            expect(callArgs[1][1]).toBeNull()
        })

        it("should handle database errors gracefully", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockRejectedValueOnce(new Error("Database error"))

            await expect(
                logRateLimitEvent("192.168.1.1", "Mozilla/5.0", 5)
            ).resolves.not.toThrow()
        })
    })

    describe("logRememberMeEvent", () => {
        it("should log a Remember Me token creation", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

            await logRememberMeEvent(
                "user-123",
                "user@example.com",
                "192.168.1.1",
                "Mozilla/5.0",
                "created",
                expiresAt
            )

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO audit_logs"),
                expect.arrayContaining([
                    "REMEMBER_ME_CREATED",
                    "user-123",
                    "user@example.com",
                    "192.168.1.1",
                    "Mozilla/5.0",
                ])
            )
        })

        it("should log a Remember Me token validation", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await logRememberMeEvent(
                "user-123",
                "user@example.com",
                "192.168.1.1",
                "Mozilla/5.0",
                "validated"
            )

            const callArgs = mockQuery.mock.calls[0]
            expect(callArgs[1][0]).toBe("REMEMBER_ME_VALIDATED")
        })

        it("should log a Remember Me token failure", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await logRememberMeEvent(
                "user-123",
                "user@example.com",
                "192.168.1.1",
                "Mozilla/5.0",
                "failed",
                undefined,
                "Token expired"
            )

            const callArgs = mockQuery.mock.calls[0]
            expect(callArgs[1][0]).toBe("REMEMBER_ME_FAILED")

            const detailsJson = callArgs[1][5] as string
            const details = JSON.parse(detailsJson)
            expect(details).toHaveProperty("reason", "Token expired")
        })

        it("should include expiration date in details when provided", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            const expiresAt = new Date("2025-12-31T23:59:59Z")

            await logRememberMeEvent(
                "user-123",
                "user@example.com",
                "192.168.1.1",
                "Mozilla/5.0",
                "created",
                expiresAt
            )

            const callArgs = mockQuery.mock.calls[0]
            const detailsJson = callArgs[1][5] as string
            const details = JSON.parse(detailsJson)

            expect(details).toHaveProperty("expiresAt")
            expect(details.expiresAt).toContain("2025-12-31")
        })

        it("should handle database errors gracefully", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockRejectedValueOnce(new Error("Database error"))

            await expect(
                logRememberMeEvent(
                    "user-123",
                    "user@example.com",
                    "192.168.1.1",
                    "Mozilla/5.0",
                    "created"
                )
            ).resolves.not.toThrow()
        })
    })

    describe("exportAuditLogs", () => {
        it("should export all audit logs without filters", async () => {
            const mockQuery = vi.mocked(db.db.query)
            const mockLogs = [
                {
                    id: "log-1",
                    eventType: "LOGIN_SUCCESS",
                    userId: "user-123",
                    email: "user@example.com",
                    ipAddress: "192.168.1.1",
                    userAgent: "Mozilla/5.0",
                    details: "{\"action\":\"User logged in\"}",
                    createdAt: new Date(),
                },
            ]

            mockQuery.mockResolvedValueOnce({ rows: mockLogs } as any)

            const logs = await exportAuditLogs()

            expect(logs).toHaveLength(1)
            expect(logs[0].eventType).toBe("LOGIN_SUCCESS")
        })

        it("should export logs filtered by date range", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockResolvedValueOnce({ rows: [] } as any)

            const startDate = new Date("2025-01-01")
            const endDate = new Date("2025-01-31")

            await exportAuditLogs({ startDate, endDate })

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("created_at >= $1"),
                expect.arrayContaining([startDate, endDate])
            )
        })

        it("should export logs filtered by event type", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockResolvedValueOnce({ rows: [] } as any)

            await exportAuditLogs({ eventType: "LOGIN_FAILED" })

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("event_type = $"),
                expect.arrayContaining(["LOGIN_FAILED"])
            )
        })

        it("should export logs filtered by userId", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockResolvedValueOnce({ rows: [] } as any)

            await exportAuditLogs({ userId: "user-123" })

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("user_id = $"),
                expect.arrayContaining(["user-123"])
            )
        })

        it("should export logs filtered by email", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockResolvedValueOnce({ rows: [] } as any)

            await exportAuditLogs({ email: "user@example.com" })

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("email = $"),
                expect.arrayContaining(["user@example.com"])
            )
        })

        it("should respect limit parameter", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockResolvedValueOnce({ rows: [] } as any)

            await exportAuditLogs({ limit: 50 })

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("LIMIT"),
                expect.arrayContaining([50])
            )
        })

        it("should combine multiple filters", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockResolvedValueOnce({ rows: [] } as any)

            const startDate = new Date("2025-01-01")

            await exportAuditLogs({
                startDate,
                eventType: "LOGIN_FAILED",
                userId: "user-123",
                limit: 100,
            })

            const callArgs = mockQuery.mock.calls[0]
            const sql = callArgs[0] as string
            const params = callArgs[1]

            expect(sql).toContain("created_at >= $")
            expect(sql).toContain("event_type = $")
            expect(sql).toContain("user_id = $")
            expect(sql).toContain("LIMIT")
            expect(params).toContain(startDate)
            expect(params).toContain("LOGIN_FAILED")
            expect(params).toContain("user-123")
            expect(params).toContain(100)
        })

        it("should handle database errors", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockRejectedValueOnce(new Error("Database error"))

            await expect(exportAuditLogs()).rejects.toThrow("Database error")
        })
    })

    describe("cleanupOldAuditLogs", () => {
        it("should delete logs older than 90 days", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockResolvedValueOnce({ rowCount: 100 } as any)

            const result = await cleanupOldAuditLogs()

            expect(result).toBe(100)
            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("DELETE FROM audit_logs"),
                expect.any(Array)
            )
        })

        it("should use custom retention period", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockResolvedValueOnce({ rowCount: 50 } as any)

            const result = await cleanupOldAuditLogs(60)

            expect(result).toBe(50)
            expect(mockQuery).toHaveBeenCalled()
        })

        it("should handle no rows deleted", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockResolvedValueOnce({ rowCount: 0 } as any)

            const result = await cleanupOldAuditLogs()

            expect(result).toBe(0)
        })

        it("should handle database errors", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockRejectedValueOnce(new Error("Database error"))

            await expect(cleanupOldAuditLogs()).rejects.toThrow(
                "Database error"
            )
        })
    })

    describe("getUserAuditLogs", () => {
        it("should retrieve audit logs for a user", async () => {
            const mockQuery = vi.mocked(db.db.query)
            const mockLogs = [
                {
                    id: "log-1",
                    eventType: "LOGIN_SUCCESS",
                    userId: "user-123",
                    email: "user@example.com",
                    ipAddress: "192.168.1.1",
                    userAgent: "Mozilla/5.0",
                    details: "{\"action\":\"User logged in\"}",
                    createdAt: new Date(),
                },
            ]

            mockQuery.mockResolvedValueOnce({ rows: mockLogs } as any)

            const logs = await getUserAuditLogs("user-123")

            expect(logs).toHaveLength(1)
            expect(logs[0].eventType).toBe("LOGIN_SUCCESS")
        })

        it("should respect the limit parameter", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockResolvedValueOnce({ rows: [] } as any)

            await getUserAuditLogs("user-123", 50)

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("LIMIT"),
                expect.arrayContaining(["user-123", 50])
            )
        })

        it("should handle database errors", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockRejectedValueOnce(new Error("Database error"))

            await expect(getUserAuditLogs("user-123")).rejects.toThrow(
                "Database error"
            )
        })
    })

    describe("getAuditLogsByEventType", () => {
        it("should retrieve audit logs by event type", async () => {
            const mockQuery = vi.mocked(db.db.query)
            const mockLogs = [
                {
                    id: "log-1",
                    eventType: "LOGIN_FAILED",
                    userId: undefined,
                    email: "user@example.com",
                    ipAddress: "192.168.1.1",
                    userAgent: "Mozilla/5.0",
                    details: "{\"reason\":\"Invalid password\"}",
                    createdAt: new Date(),
                },
            ]

            mockQuery.mockResolvedValueOnce({ rows: mockLogs } as any)

            const logs = await getAuditLogsByEventType("LOGIN_FAILED")

            expect(logs).toHaveLength(1)
            expect(logs[0].eventType).toBe("LOGIN_FAILED")
        })

        it("should handle database errors", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockRejectedValueOnce(new Error("Database error"))

            await expect(
                getAuditLogsByEventType("LOGIN_FAILED")
            ).rejects.toThrow("Database error")
        })
    })

    describe("getRecentSecurityEvents", () => {
        it("should retrieve recent security events", async () => {
            const mockQuery = vi.mocked(db.db.query)
            const mockEvents = [
                {
                    id: "log-1",
                    eventType: "CSRF_FAILURE",
                    userId: undefined,
                    email: "user@example.com",
                    ipAddress: "192.168.1.1",
                    userAgent: "Mozilla/5.0",
                    details: "{\"reason\":\"Token mismatch\"}",
                    createdAt: new Date(),
                },
            ]

            mockQuery.mockResolvedValueOnce({ rows: mockEvents } as any)

            const events = await getRecentSecurityEvents()

            expect(events).toHaveLength(1)
            expect(events[0].eventType).toBe("CSRF_FAILURE")
        })

        it("should filter by time window", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockResolvedValueOnce({ rows: [] } as any)

            await getRecentSecurityEvents(48)

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("created_at > $1"),
                expect.any(Array)
            )
        })

        it("should handle database errors", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockRejectedValueOnce(new Error("Database error"))

            await expect(getRecentSecurityEvents()).rejects.toThrow(
                "Database error"
            )
        })
    })

    describe("getFailedLoginsByIP", () => {
        it("should retrieve failed login attempts for an IP", async () => {
            const mockQuery = vi.mocked(db.db.query)
            const mockLogs = [
                {
                    id: "log-1",
                    eventType: "LOGIN_FAILED",
                    userId: undefined,
                    email: "user@example.com",
                    ipAddress: "192.168.1.1",
                    userAgent: "Mozilla/5.0",
                    details: "{\"reason\":\"Invalid password\"}",
                    createdAt: new Date(),
                },
            ]

            mockQuery.mockResolvedValueOnce({ rows: mockLogs } as any)

            const logs = await getFailedLoginsByIP("192.168.1.1")

            expect(logs).toHaveLength(1)
            expect(logs[0].ipAddress).toBe("192.168.1.1")
        })

        it("should filter by time window", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockResolvedValueOnce({ rows: [] } as any)

            await getFailedLoginsByIP("192.168.1.1", 2)

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("created_at > $2"),
                expect.any(Array)
            )
        })

        it("should handle database errors", async () => {
            const mockQuery = vi.mocked(db.db.query)
            mockQuery.mockRejectedValueOnce(new Error("Database error"))

            await expect(getFailedLoginsByIP("192.168.1.1")).rejects.toThrow(
                "Database error"
            )
        })
    })
})
