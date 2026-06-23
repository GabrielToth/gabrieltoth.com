/**
 * Unit Tests: Video Schedule Billing
 * Tests for chargeForVideoStorage, refundVideoStorage, getUserStorageUsageBytes
 */

import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Hoisted mocks ──
const mockDeductAmount = vi.hoisted(() => vi.fn())
const mockGrantCredits = vi.hoisted(() => vi.fn())
const mockQuery = vi.hoisted(() => vi.fn())

vi.mock("@/lib/credits/service", () => ({
    deductAmount: mockDeductAmount,
    grantCredits: mockGrantCredits,
}))

vi.mock("@/lib/db", () => ({
    query: mockQuery,
}))

vi.mock("@/lib/logger", () => ({
    createLogger: () => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    }),
}))

const { chargeForVideoStorage, refundVideoStorage, getUserStorageUsageBytes } =
    await import("@/lib/billing/video-schedule-billing")

describe("chargeForVideoStorage", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("charges successfully for cloud storage", async () => {
        mockDeductAmount.mockResolvedValue({
            success: true,
            transactionId: "tx-123",
            newBalance: 50,
        })

        const result = await chargeForVideoStorage({
            userId: "user-1",
            fileSizeBytes: 1024 * 1024 * 1024,
            storageDays: 7,
            isCloudStorage: true,
            postId: "post-1",
        })

        expect(result.success).toBe(true)
        expect(result.charged).toBeGreaterThan(0)
        expect(result.transactionId).toBe("tx-123")
        expect(mockDeductAmount).toHaveBeenCalledTimes(1)
    })

    it("charges successfully for local storage", async () => {
        mockDeductAmount.mockResolvedValue({
            success: true,
            transactionId: "tx-124",
            newBalance: 60,
        })

        const result = await chargeForVideoStorage({
            userId: "user-1",
            fileSizeBytes: 500 * 1024 * 1024,
            storageDays: 3,
            isCloudStorage: false,
            postId: "post-2",
        })

        expect(result.success).toBe(true)
        expect(mockDeductAmount).toHaveBeenCalledTimes(1)
    })

    it("returns error when deductAmount fails", async () => {
        mockDeductAmount.mockResolvedValue({
            success: false,
            error: "Insufficient balance",
        })

        const result = await chargeForVideoStorage({
            userId: "user-1",
            fileSizeBytes: 1024 * 1024 * 1024,
            storageDays: 7,
            isCloudStorage: true,
            postId: "post-3",
        })

        expect(result.success).toBe(false)
        expect(result.charged).toBe(0)
        expect(result.error).toBe("Insufficient balance")
    })
})

describe("refundVideoStorage", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("returns refund for partial storage used", async () => {
        mockGrantCredits.mockResolvedValue({
            success: true,
            transactionId: "tx-refund-1",
        })

        const result = await refundVideoStorage({
            userId: "user-1",
            postId: "post-1",
            totalCharged: 68.69,
            baseFee: 2.0,
            storageCostPerDay: 6.67,
            storageDaysUsed: 3,
        })

        expect(result.success).toBe(true)
        expect(result.refundAmount).toBeGreaterThan(0)
        expect(mockGrantCredits).toHaveBeenCalledTimes(1)
    })

    it("returns 0 refund if no refund due", async () => {
        const result = await refundVideoStorage({
            userId: "user-1",
            postId: "post-2",
            totalCharged: 2.0,
            baseFee: 2.0,
            storageCostPerDay: 0,
            storageDaysUsed: 0,
        })

        expect(result.success).toBe(true)
        expect(result.refundAmount).toBe(0)
        expect(mockGrantCredits).not.toHaveBeenCalled()
    })
})

describe("getUserStorageUsageBytes", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("returns total storage usage", async () => {
        mockQuery.mockResolvedValue({
            rows: [{ file_size: 1500000000 }],
        })

        const result = await getUserStorageUsageBytes("user-1")
        expect(result).toBe(1500000000)
    })

    it("returns 0 when no active storage", async () => {
        mockQuery.mockResolvedValue({
            rows: [{ file_size: null }],
        })

        const result = await getUserStorageUsageBytes("user-1")
        expect(result).toBe(0)
    })
})
