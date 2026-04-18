/**
 * Unit Tests for Audit Logging
 */

import * as db from "@/lib/db"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    getAuditLogsByEventType,
    getRecentSecurityEvents,
    getUserAuditLogs,
    logAuditEvent,
    logLoginFailure,
    logLoginSuccess,
    logLogout,
    logPasswordResetRequest,
    logPasswordResetSuccess,
    logRegistration,
    logSecurityEvent,
} from "./audit-logging"

// Mock the database module
vi.mock("@/lib/db", () => ({
    query: vi.fn(),
    queryOne: vi.fn(),
    queryMany: vi.fn(),
}))

// Mock the logger
vi.mock("@/lib/logger", () => ({
    logger: {
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}))

describe("Audit Logging", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("logAuditEvent", () => {
        it("should log an audit event with all details", async () => {
            const mockQuery = vi.mocked(db.query)
            const mockQueryOne = vi.mocked(db.queryOne)

            mockQueryOne.mockResolvedValueOnce({ id: "user-123" })
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await logAuditEvent(
                "LOGIN_SUCCESS",
                "test@example.com",
                "192.168.1.1",
                { action: "User logged in" }
            )

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO audit_logs"),
                expect.any(Array)
            )
        })

        it("should log an audit event with userId", async () => {
            const mockQuery = vi.mocked(db.query)

            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await logAuditEvent(
                "LOGIN_SUCCESS",
                "test@example.com",
                "192.168.1.1",
                { action: "User logged in" },
                "user-123"
            )

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO audit_logs"),
                expect.arrayContaining(["user-123"])
            )
        })

        it("should handle missing email and IP", async () => {
            const mockQuery = vi.mocked(db.query)

            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await logAuditEvent("REGISTRATION", undefined, undefined)

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO audit_logs"),
                expect.any(Array)
            )
        })
    })

    describe("logRegistration", () => {
        it("should log a registration event", async () => {
            const mockQuery = vi.mocked(db.query)
            const mockQueryOne = vi.mocked(db.queryOne)

            mockQueryOne.mockResolvedValueOnce(null)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await logRegistration("test@example.com", "192.168.1.1")

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO audit_logs"),
                expect.arrayContaining([
                    "REGISTRATION",
                    "test@example.com",
                    "192.168.1.1",
                ])
            )
        })
    })

    describe("logLoginSuccess", () => {
        it("should log a successful login event", async () => {
            const mockQuery = vi.mocked(db.query)
            const mockQueryOne = vi.mocked(db.queryOne)

            mockQueryOne.mockResolvedValueOnce({ id: "user-123" })
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await logLoginSuccess("test@example.com", "192.168.1.1")

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO audit_logs"),
                expect.arrayContaining([
                    "LOGIN_SUCCESS",
                    "test@example.com",
                    "192.168.1.1",
                ])
            )
        })
    })

    describe("logLoginFailure", () => {
        it("should log a failed login event with reason", async () => {
            const mockQuery = vi.mocked(db.query)
            const mockQueryOne = vi.mocked(db.queryOne)

            mockQueryOne.mockResolvedValueOnce(null)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await logLoginFailure(
                "test@example.com",
                "192.168.1.1",
                "Invalid password"
            )

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO audit_logs"),
                expect.arrayContaining([
                    "LOGIN_FAILED",
                    "test@example.com",
                    "192.168.1.1",
                ])
            )
        })
    })

    describe("logLogout", () => {
        it("should log a logout event", async () => {
            const mockQuery = vi.mocked(db.query)
            const mockQueryOne = vi.mocked(db.queryOne)

            mockQueryOne.mockResolvedValueOnce({ id: "user-123" })
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await logLogout("test@example.com", "192.168.1.1")

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO audit_logs"),
                expect.arrayContaining([
                    "LOGOUT",
                    "test@example.com",
                    "192.168.1.1",
                ])
            )
        })
    })

    describe("logPasswordResetRequest", () => {
        it("should log a password reset request", async () => {
            const mockQuery = vi.mocked(db.query)
            const mockQueryOne = vi.mocked(db.queryOne)

            mockQueryOne.mockResolvedValueOnce(null)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await logPasswordResetRequest("test@example.com", "192.168.1.1")

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO audit_logs"),
                expect.arrayContaining([
                    "PASSWORD_RESET_REQUEST",
                    "test@example.com",
                    "192.168.1.1",
                ])
            )
        })
    })

    describe("logPasswordResetSuccess", () => {
        it("should log a successful password reset", async () => {
            const mockQuery = vi.mocked(db.query)
            const mockQueryOne = vi.mocked(db.queryOne)

            mockQueryOne.mockResolvedValueOnce({ id: "user-123" })
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await logPasswordResetSuccess("test@example.com", "192.168.1.1")

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO audit_logs"),
                expect.arrayContaining([
                    "PASSWORD_RESET_SUCCESS",
                    "test@example.com",
                    "192.168.1.1",
                ])
            )
        })
    })

    describe("logSecurityEvent", () => {
        it("should log a security event", async () => {
            const mockQuery = vi.mocked(db.query)
            const mockQueryOne = vi.mocked(db.queryOne)

            mockQueryOne.mockResolvedValueOnce(null)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await logSecurityEvent(
                "SQL_INJECTION_ATTEMPT",
                "test@example.com",
                "192.168.1.1",
                { payload: "'; DROP TABLE users; --" }
            )

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO audit_logs"),
                expect.arrayContaining(["SQL_INJECTION_ATTEMPT"])
            )
        })
    })

    describe("getUserAuditLogs", () => {
        it("should retrieve audit logs for a user", async () => {
            const mockQuery = vi.mocked(db.query)

            const mockLogs = [
                {
                    id: "log-1",
                    userId: "user-123",
                    eventType: "LOGIN_SUCCESS",
                    email: "test@example.com",
                    ipAddress: "192.168.1.1",
                    details: null,
                    createdAt: new Date(),
                },
            ]

            mockQuery.mockResolvedValueOnce({ rows: mockLogs } as any)

            const logs = await getUserAuditLogs("user-123")

            expect(logs).toHaveLength(1)
            expect(logs[0].eventType).toBe("LOGIN_SUCCESS")
        })

        it("should respect the limit parameter", async () => {
            const mockQuery = vi.mocked(db.query)

            mockQuery.mockResolvedValueOnce({ rows: [] } as any)

            await getUserAuditLogs("user-123", 50)

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("LIMIT"),
                expect.arrayContaining(["user-123", 50])
            )
        })
    })

    describe("getAuditLogsByEventType", () => {
        it("should retrieve audit logs by event type", async () => {
            const mockQuery = vi.mocked(db.query)

            const mockLogs = [
                {
                    id: "log-1",
                    userId: "user-123",
                    eventType: "LOGIN_SUCCESS",
                    email: "test@example.com",
                    ipAddress: "192.168.1.1",
                    details: null,
                    createdAt: new Date(),
                },
            ]

            mockQuery.mockResolvedValueOnce({ rows: mockLogs } as any)

            const logs = await getAuditLogsByEventType("LOGIN_SUCCESS")

            expect(logs).toHaveLength(1)
            expect(logs[0].eventType).toBe("LOGIN_SUCCESS")
        })
    })

    describe("getRecentSecurityEvents", () => {
        it("should retrieve recent security events", async () => {
            const mockQuery = vi.mocked(db.query)

            const mockEvents = [
                {
                    id: "log-1",
                    userId: "user-123",
                    eventType: "SQL_INJECTION_ATTEMPT",
                    email: "test@example.com",
                    ipAddress: "192.168.1.1",
                    details: null,
                    createdAt: new Date(),
                },
            ]

            mockQuery.mockResolvedValueOnce({ rows: mockEvents } as any)

            const events = await getRecentSecurityEvents()

            expect(events).toHaveLength(1)
            expect(events[0].eventType).toBe("SQL_INJECTION_ATTEMPT")
        })
    })
})
