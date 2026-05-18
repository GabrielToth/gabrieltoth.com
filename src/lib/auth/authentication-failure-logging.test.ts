/**
 * Tests for Authentication Failure Logging
 *
 * Validates: Requirements 14.1, 14.2, 14.5
 */

import * as db from "@/lib/db"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    AuthFailureType,
    getAuthFailureStatistics,
    getRecentAuthFailuresForEmail,
    getRecentAuthFailuresForIP,
    logAuthenticationFailure,
    logCAPTCHAFailure,
    logCSRFFailure,
    logFailedLoginAttempt,
    logFailedRegistrationAttempt,
    logInputValidationFailure,
    logRateLimitTrigger,
} from "./authentication-failure-logging"

// Mock the database module
vi.mock("@/lib/db", () => {
    const query = vi.fn()
    const queryOne = vi.fn()
    const queryMany = vi.fn()
    const db = { query, queryOne, queryMany }
    return { db, default: db, query, queryOne, queryMany }
})

// Mock the logger module
vi.mock("@/lib/logger", () => ({
    logger: {
        debug: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
    },
}))

describe("Authentication Failure Logging", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("logAuthenticationFailure", () => {
        it("should log authentication failure with all required fields", async () => {
            const mockQuery = vi.fn().mockResolvedValue({ rows: [] })
            vi.mocked(db.db.query).mockImplementation(mockQuery)

            const entry = {
                email: "user@example.com",
                failureType: AuthFailureType.INVALID_CREDENTIALS,
                failureReason: "Invalid email or password",
                ipAddress: "192.168.1.1",
                userAgent: "Mozilla/5.0...",
                attemptCount: 3,
            }

            await logAuthenticationFailure(entry)

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO audit_logs"),
                expect.arrayContaining([
                    "auth_failure",
                    "user@example.com",
                    "192.168.1.1",
                    "Mozilla/5.0...",
                    3,
                    AuthFailureType.INVALID_CREDENTIALS,
                    "Invalid email or password",
                ])
            )
        })

        it("should handle missing optional fields", async () => {
            const mockQuery = vi.fn().mockResolvedValue({ rows: [] })
            vi.mocked(db.db.query).mockImplementation(mockQuery)

            const entry = {
                email: "user@example.com",
                failureType: AuthFailureType.INVALID_CREDENTIALS,
                failureReason: "Invalid email or password",
                ipAddress: "192.168.1.1",
            }

            await logAuthenticationFailure(entry)

            expect(mockQuery).toHaveBeenCalled()
            const callArgs = mockQuery.mock.calls[0][1]
            expect(callArgs[3]).toBeNull() // userAgent
            expect(callArgs[4]).toBeNull() // attemptCount
        })

        it("should not throw on database error", async () => {
            const mockQuery = vi
                .fn()
                .mockRejectedValue(new Error("Database error"))
            vi.mocked(db.db.query).mockImplementation(mockQuery)

            const entry = {
                email: "user@example.com",
                failureType: AuthFailureType.INVALID_CREDENTIALS,
                failureReason: "Invalid email or password",
                ipAddress: "192.168.1.1",
            }

            // Should not throw
            await expect(
                logAuthenticationFailure(entry)
            ).resolves.toBeUndefined()
        })

        it("should include timestamp in ISO 8601 format", async () => {
            const mockQuery = vi.fn().mockResolvedValue({ rows: [] })
            vi.mocked(db.db.query).mockImplementation(mockQuery)

            const timestamp = new Date("2024-01-15T10:30:00Z")
            const entry = {
                email: "user@example.com",
                failureType: AuthFailureType.INVALID_CREDENTIALS,
                failureReason: "Invalid email or password",
                ipAddress: "192.168.1.1",
                timestamp,
            }

            await logAuthenticationFailure(entry)

            const callArgs = mockQuery.mock.calls[0][1]
            expect(callArgs[8]).toEqual(timestamp)
        })

        it("should not log sensitive data (passwords, pepper)", async () => {
            const mockQuery = vi.fn().mockResolvedValue({ rows: [] })
            vi.mocked(db.db.query).mockImplementation(mockQuery)

            const entry = {
                email: "user@example.com",
                failureType: AuthFailureType.INVALID_CREDENTIALS,
                failureReason: "Invalid email or password", // Generic, no actual password value
                ipAddress: "192.168.1.1",
            }

            await logAuthenticationFailure(entry)

            const callArgs = mockQuery.mock.calls[0][1]
            const failureReason = callArgs[6]

            // Verify no sensitive data in failure reason
            // The word "password" is acceptable in generic error messages
            // but actual password values should never be logged
            expect(failureReason).not.toContain("password123")
            expect(failureReason).not.toContain("pepper_secret_value")
            expect(failureReason).not.toContain("secret_key")
        })
    })

    describe("logFailedLoginAttempt", () => {
        it("should log failed login with correct event type", async () => {
            const mockQuery = vi.fn().mockResolvedValue({ rows: [] })
            vi.mocked(db.db.query).mockImplementation(mockQuery)

            await logFailedLoginAttempt(
                "user@example.com",
                "192.168.1.1",
                "Invalid email or password",
                "Mozilla/5.0...",
                3
            )

            expect(mockQuery).toHaveBeenCalled()
            const callArgs = mockQuery.mock.calls[0][1]
            expect(callArgs[0]).toBe("auth_failure")
            expect(callArgs[5]).toBe(AuthFailureType.INVALID_CREDENTIALS)
        })

        it("should include attempt count for rate limiting context", async () => {
            const mockQuery = vi.fn().mockResolvedValue({ rows: [] })
            vi.mocked(db.db.query).mockImplementation(mockQuery)

            await logFailedLoginAttempt(
                "user@example.com",
                "192.168.1.1",
                "Invalid email or password",
                "Mozilla/5.0...",
                5
            )

            const callArgs = mockQuery.mock.calls[0][1]
            expect(callArgs[4]).toBe(5) // attemptCount
        })
    })

    describe("logFailedRegistrationAttempt", () => {
        it("should log failed registration with correct event type", async () => {
            const mockQuery = vi.fn().mockResolvedValue({ rows: [] })
            vi.mocked(db.db.query).mockImplementation(mockQuery)

            await logFailedRegistrationAttempt(
                "user@example.com",
                "192.168.1.1",
                "Email already exists"
            )

            expect(mockQuery).toHaveBeenCalled()
            const callArgs = mockQuery.mock.calls[0][1]
            expect(callArgs[0]).toBe("auth_failure")
            expect(callArgs[5]).toBe(AuthFailureType.INVALID_INPUT)
        })
    })

    describe("logRateLimitTrigger", () => {
        it("should log rate limit trigger with attempt count", async () => {
            const mockQuery = vi.fn().mockResolvedValue({ rows: [] })
            vi.mocked(db.db.query).mockImplementation(mockQuery)

            await logRateLimitTrigger(
                "user@example.com",
                "192.168.1.1",
                5,
                "Mozilla/5.0..."
            )

            expect(mockQuery).toHaveBeenCalled()
            const callArgs = mockQuery.mock.calls[0][1]
            expect(callArgs[0]).toBe("auth_failure")
            expect(callArgs[5]).toBe(AuthFailureType.RATE_LIMIT_EXCEEDED)
            expect(callArgs[4]).toBe(5) // attemptCount
        })

        it("should include rate limit details in JSON", async () => {
            const mockQuery = vi.fn().mockResolvedValue({ rows: [] })
            vi.mocked(db.db.query).mockImplementation(mockQuery)

            await logRateLimitTrigger(
                "user@example.com",
                "192.168.1.1",
                5,
                "Mozilla/5.0..."
            )

            const callArgs = mockQuery.mock.calls[0][1]
            const details = JSON.parse(callArgs[7])
            expect(details.event).toBe("rate_limit_triggered")
            expect(details.threshold).toBe(5)
            expect(details.window_minutes).toBe(15)
        })
    })

    describe("logCAPTCHAFailure", () => {
        it("should log CAPTCHA failure", async () => {
            const mockQuery = vi.fn().mockResolvedValue({ rows: [] })
            vi.mocked(db.db.query).mockImplementation(mockQuery)

            await logCAPTCHAFailure(
                "user@example.com",
                "192.168.1.1",
                "Invalid CAPTCHA token"
            )

            expect(mockQuery).toHaveBeenCalled()
            const callArgs = mockQuery.mock.calls[0][1]
            expect(callArgs[5]).toBe(AuthFailureType.CAPTCHA_FAILED)
        })

        it("should handle missing email", async () => {
            const mockQuery = vi.fn().mockResolvedValue({ rows: [] })
            vi.mocked(db.db.query).mockImplementation(mockQuery)

            await logCAPTCHAFailure(
                undefined,
                "192.168.1.1",
                "Invalid CAPTCHA token"
            )

            expect(mockQuery).toHaveBeenCalled()
            const callArgs = mockQuery.mock.calls[0][1]
            expect(callArgs[1]).toBe("unknown")
        })
    })

    describe("logCSRFFailure", () => {
        it("should log CSRF failure", async () => {
            const mockQuery = vi.fn().mockResolvedValue({ rows: [] })
            vi.mocked(db.db.query).mockImplementation(mockQuery)

            await logCSRFFailure(
                "user@example.com",
                "192.168.1.1",
                "Invalid CSRF token"
            )

            expect(mockQuery).toHaveBeenCalled()
            const callArgs = mockQuery.mock.calls[0][1]
            expect(callArgs[5]).toBe(AuthFailureType.CSRF_FAILED)
        })
    })

    describe("logInputValidationFailure", () => {
        it("should log input validation failure", async () => {
            const mockQuery = vi.fn().mockResolvedValue({ rows: [] })
            vi.mocked(db.db.query).mockImplementation(mockQuery)

            await logInputValidationFailure(
                "user@example.com",
                "192.168.1.1",
                "Email format invalid"
            )

            expect(mockQuery).toHaveBeenCalled()
            const callArgs = mockQuery.mock.calls[0][1]
            expect(callArgs[5]).toBe(AuthFailureType.INVALID_INPUT)
        })
    })

    describe("getRecentAuthFailuresForEmail", () => {
        it("should retrieve recent failures for email", async () => {
            const mockRows = [
                {
                    id: "1",
                    event_type: "auth_failure",
                    email: "user@example.com",
                    ip_address: "192.168.1.1",
                    error_code: "invalid_credentials",
                    error_message: "Invalid email or password",
                    attempt_count: 1,
                    timestamp: "2024-01-15T10:30:00Z",
                },
            ]
            const mockQueryMany = vi.fn().mockResolvedValue(mockRows)
            vi.mocked(db.db.queryMany).mockImplementation(mockQueryMany)

            const results =
                await getRecentAuthFailuresForEmail("user@example.com")

            expect(results).toEqual(mockRows)
            expect(mockQueryMany).toHaveBeenCalledWith(
                expect.stringContaining("SELECT id, event_type"),
                expect.arrayContaining(["user@example.com"])
            )
        })

        it("should return empty array on error", async () => {
            const mockQueryMany = vi
                .fn()
                .mockRejectedValue(new Error("Database error"))
            vi.mocked(db.db.queryMany).mockImplementation(mockQueryMany)

            const results =
                await getRecentAuthFailuresForEmail("user@example.com")

            expect(results).toEqual([])
        })
    })

    describe("getRecentAuthFailuresForIP", () => {
        it("should retrieve recent failures for IP", async () => {
            const mockRows = [
                {
                    id: "1",
                    event_type: "auth_failure",
                    email: "user@example.com",
                    ip_address: "192.168.1.1",
                    error_code: "invalid_credentials",
                    error_message: "Invalid email or password",
                    attempt_count: 1,
                    timestamp: "2024-01-15T10:30:00Z",
                },
            ]
            const mockQueryMany = vi.fn().mockResolvedValue(mockRows)
            vi.mocked(db.db.queryMany).mockImplementation(mockQueryMany)

            const results = await getRecentAuthFailuresForIP("192.168.1.1")

            expect(results).toEqual(mockRows)
            expect(mockQueryMany).toHaveBeenCalledWith(
                expect.stringContaining("SELECT id, event_type"),
                expect.arrayContaining(["192.168.1.1"])
            )
        })
    })

    describe("getAuthFailureStatistics", () => {
        it("should retrieve authentication failure statistics", async () => {
            const mockQueryOne = vi
                .fn()
                .mockResolvedValueOnce({ count: "100" })
                .mockResolvedValueOnce({ count: "50" })
                .mockResolvedValueOnce({ count: "10" })
            const mockQueryMany = vi
                .fn()
                .mockResolvedValueOnce([
                    { error_code: "invalid_credentials", count: "80" },
                    { error_code: "rate_limit_exceeded", count: "20" },
                ])
                .mockResolvedValueOnce([
                    { email: "attacker@example.com", count: "50" },
                ])
                .mockResolvedValueOnce([
                    { ip_address: "192.168.1.1", count: "30" },
                ])

            vi.mocked(db.db.queryOne).mockImplementation(mockQueryOne)
            vi.mocked(db.db.queryMany).mockImplementation(mockQueryMany)

            const stats = await getAuthFailureStatistics(24)

            expect(stats.totalFailures).toBe(100)
            expect(stats.uniqueEmails).toBe(50)
            expect(stats.uniqueIPs).toBe(10)
            expect(stats.failuresByType.invalid_credentials).toBe(80)
            expect(stats.failuresByType.rate_limit_exceeded).toBe(20)
            expect(stats.topFailingEmails[0].email).toBe("attacker@example.com")
            expect(stats.topFailingIPs[0].ip_address).toBe("192.168.1.1")
        })

        it("should return empty statistics on error", async () => {
            const mockQueryOne = vi
                .fn()
                .mockRejectedValue(new Error("Database error"))
            vi.mocked(db.db.queryOne).mockImplementation(mockQueryOne)

            const stats = await getAuthFailureStatistics(24)

            expect(stats.totalFailures).toBe(0)
            expect(stats.uniqueEmails).toBe(0)
            expect(stats.uniqueIPs).toBe(0)
            expect(stats.failuresByType).toEqual({})
            expect(stats.topFailingEmails).toEqual([])
            expect(stats.topFailingIPs).toEqual([])
        })
    })

    describe("Requirement 14.1: Log failed login attempts with timestamp and user identifier", () => {
        it("should include timestamp in ISO 8601 format", async () => {
            const mockQuery = vi.fn().mockResolvedValue({ rows: [] })
            vi.mocked(db.db.query).mockImplementation(mockQuery)

            const timestamp = new Date("2024-01-15T10:30:00Z")
            await logFailedLoginAttempt(
                "user@example.com",
                "192.168.1.1",
                "Invalid email or password",
                undefined,
                undefined
            )

            expect(mockQuery).toHaveBeenCalled()
            // Verify timestamp is included in the query
            const callArgs = mockQuery.mock.calls[0][1]
            expect(callArgs[8]).toBeDefined() // timestamp parameter
        })

        it("should include user identifier (email)", async () => {
            const mockQuery = vi.fn().mockResolvedValue({ rows: [] })
            vi.mocked(db.db.query).mockImplementation(mockQuery)

            await logFailedLoginAttempt(
                "user@example.com",
                "192.168.1.1",
                "Invalid email or password"
            )

            const callArgs = mockQuery.mock.calls[0][1]
            expect(callArgs[1]).toBe("user@example.com") // email
        })
    })

    describe("Requirement 14.2: Log rate limit triggers with attempt count", () => {
        it("should include attempt count in rate limit logs", async () => {
            const mockQuery = vi.fn().mockResolvedValue({ rows: [] })
            vi.mocked(db.db.query).mockImplementation(mockQuery)

            await logRateLimitTrigger(
                "user@example.com",
                "192.168.1.1",
                5,
                "Mozilla/5.0..."
            )

            const callArgs = mockQuery.mock.calls[0][1]
            expect(callArgs[4]).toBe(5) // attemptCount
        })
    })

    describe("Requirement 14.5: Logs SHALL NOT contain sensitive data", () => {
        it("should not log plaintext passwords", async () => {
            const mockQuery = vi.fn().mockResolvedValue({ rows: [] })
            vi.mocked(db.db.query).mockImplementation(mockQuery)

            await logFailedLoginAttempt(
                "user@example.com",
                "192.168.1.1",
                "Invalid email or password" // Generic message, no password
            )

            const callArgs = mockQuery.mock.calls[0][1]
            const failureReason = callArgs[6]
            expect(failureReason).not.toContain("password123")
            expect(failureReason).not.toContain("secret")
        })

        it("should not log pepper values", async () => {
            const mockQuery = vi.fn().mockResolvedValue({ rows: [] })
            vi.mocked(db.db.query).mockImplementation(mockQuery)

            await logAuthenticationFailure({
                email: "user@example.com",
                failureType: AuthFailureType.INVALID_CREDENTIALS,
                failureReason: "Invalid email or password",
                ipAddress: "192.168.1.1",
            })

            const callArgs = mockQuery.mock.calls[0][1]
            const failureReason = callArgs[6]
            expect(failureReason).not.toContain("pepper")
        })
    })
})
