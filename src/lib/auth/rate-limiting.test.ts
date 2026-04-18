/**
 * Unit Tests for Rate Limiting
 */

import * as db from "@/lib/db"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    clearLoginAttempts,
    getFailedLoginAttempts,
    getTimeUntilUnlock,
    isAccountLocked,
    recordLoginAttempt,
} from "./rate-limiting"

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

describe("Rate Limiting", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("recordLoginAttempt", () => {
        it("should record a successful login attempt", async () => {
            const mockQueryOne = vi.mocked(db.queryOne)
            const mockQuery = vi.mocked(db.query)

            mockQueryOne.mockResolvedValueOnce({ id: "user-123" })
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await recordLoginAttempt("test@example.com", "192.168.1.1", true)

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO login_attempts"),
                expect.arrayContaining([
                    "test@example.com",
                    "192.168.1.1",
                    true,
                ])
            )
        })

        it("should record a failed login attempt with reason", async () => {
            const mockQueryOne = vi.mocked(db.queryOne)
            const mockQuery = vi.mocked(db.query)

            mockQueryOne.mockResolvedValueOnce({ id: "user-123" })
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await recordLoginAttempt(
                "test@example.com",
                "192.168.1.1",
                false,
                "Invalid password"
            )

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO login_attempts"),
                expect.arrayContaining([
                    "test@example.com",
                    "192.168.1.1",
                    false,
                    "Invalid password",
                ])
            )
        })

        it("should handle user not found", async () => {
            const mockQueryOne = vi.mocked(db.queryOne)
            const mockQuery = vi.mocked(db.query)

            mockQueryOne.mockResolvedValueOnce(null)
            mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any)

            await recordLoginAttempt(
                "unknown@example.com",
                "192.168.1.1",
                false
            )

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO login_attempts"),
                expect.arrayContaining([
                    null,
                    "unknown@example.com",
                    "192.168.1.1",
                    false,
                ])
            )
        })
    })

    describe("isAccountLocked", () => {
        it("should return false when fewer than 5 failed attempts", async () => {
            const mockQueryOne = vi.mocked(db.queryOne)

            mockQueryOne.mockResolvedValueOnce({ count: 3 })

            const locked = await isAccountLocked(
                "test@example.com",
                "192.168.1.1"
            )

            expect(locked).toBe(false)
        })

        it("should return true when 5 or more failed attempts", async () => {
            const mockQueryOne = vi.mocked(db.queryOne)

            mockQueryOne.mockResolvedValueOnce({ count: 5 })

            const locked = await isAccountLocked(
                "test@example.com",
                "192.168.1.1"
            )

            expect(locked).toBe(true)
        })

        it("should return true when more than 5 failed attempts", async () => {
            const mockQueryOne = vi.mocked(db.queryOne)

            mockQueryOne.mockResolvedValueOnce({ count: 7 })

            const locked = await isAccountLocked(
                "test@example.com",
                "192.168.1.1"
            )

            expect(locked).toBe(true)
        })

        it("should return false when no failed attempts", async () => {
            const mockQueryOne = vi.mocked(db.queryOne)

            mockQueryOne.mockResolvedValueOnce({ count: 0 })

            const locked = await isAccountLocked(
                "test@example.com",
                "192.168.1.1"
            )

            expect(locked).toBe(false)
        })
    })

    describe("getFailedLoginAttempts", () => {
        it("should return the count of failed attempts", async () => {
            const mockQueryOne = vi.mocked(db.queryOne)

            mockQueryOne.mockResolvedValueOnce({ count: 3 })

            const count = await getFailedLoginAttempts(
                "test@example.com",
                "192.168.1.1"
            )

            expect(count).toBe(3)
        })

        it("should return 0 when no failed attempts", async () => {
            const mockQueryOne = vi.mocked(db.queryOne)

            mockQueryOne.mockResolvedValueOnce({ count: 0 })

            const count = await getFailedLoginAttempts(
                "test@example.com",
                "192.168.1.1"
            )

            expect(count).toBe(0)
        })

        it("should return 0 when query returns null", async () => {
            const mockQueryOne = vi.mocked(db.queryOne)

            mockQueryOne.mockResolvedValueOnce(null)

            const count = await getFailedLoginAttempts(
                "test@example.com",
                "192.168.1.1"
            )

            expect(count).toBe(0)
        })
    })

    describe("clearLoginAttempts", () => {
        it("should delete old login attempts", async () => {
            const mockQuery = vi.mocked(db.query)

            mockQuery.mockResolvedValueOnce({ rowCount: 5 } as any)

            await clearLoginAttempts("test@example.com", "192.168.1.1")

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining("DELETE FROM login_attempts"),
                expect.any(Array)
            )
        })
    })

    describe("getTimeUntilUnlock", () => {
        it("should return 0 when no failed attempts", async () => {
            const mockQueryOne = vi.mocked(db.queryOne)

            mockQueryOne.mockResolvedValueOnce(null)

            const time = await getTimeUntilUnlock(
                "test@example.com",
                "192.168.1.1"
            )

            expect(time).toBe(0)
        })

        it("should return time remaining until unlock", async () => {
            const mockQueryOne = vi.mocked(db.queryOne)

            // Mock a recent attempt (1 minute ago)
            const oneMinuteAgo = new Date(Date.now() - 60 * 1000)
            mockQueryOne.mockResolvedValueOnce({ latest_attempt: oneMinuteAgo })

            const time = await getTimeUntilUnlock(
                "test@example.com",
                "192.168.1.1"
            )

            // Should be approximately 14 minutes (840 seconds)
            expect(time).toBeGreaterThan(800)
            expect(time).toBeLessThanOrEqual(900)
        })
    })
})
