import { describe, expect, it, vi, beforeEach } from "vitest"

vi.mock("@/lib/db", () => {
    const mockQueryOne = vi.fn()
    const mockQueryMany = vi.fn()
    const mockTransaction = vi.fn()

    return {
        db: {
            queryOne: mockQueryOne,
            queryMany: mockQueryMany,
            transaction: mockTransaction,
        },
    }
})

vi.mock("@/lib/logger", () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        fatal: vi.fn(),
        startup: vi.fn(),
        shutdown: vi.fn(),
    },
    createLogger: () => ({
        info: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        fatal: vi.fn(),
        startup: vi.fn(),
        shutdown: vi.fn(),
    }),
}))

import { db } from "@/lib/db"
import { getBalance, deductAction, adminGrant, getTransactions, CREDIT_COSTS } from "./service"

beforeEach(() => {
    vi.clearAllMocks()
})

describe("getBalance", () => {
    it("returns balance from user_accounts", async () => {
        vi.mocked(db.queryOne).mockResolvedValue({ balance: "150" })
        const result = await getBalance("user-1")
        expect(result.balance).toBe(150)
    })

    it("returns 0 when no account exists", async () => {
        vi.mocked(db.queryOne).mockResolvedValue(null)
        const result = await getBalance("user-nonexistent")
        expect(result.balance).toBe(0)
    })
})

describe("deductAction", () => {
    it("free actions return success with no DB call", async () => {
        const result = await deductAction("user-1", "youtube_metadata")
        expect(result.success).toBe(true)
        expect(db.transaction).not.toHaveBeenCalled()
    })

    it("fails on insufficient balance", async () => {
        vi.mocked(db.transaction).mockImplementation(
            async fn =>
                fn({
                    query: vi.fn().mockResolvedValue({
                        rows: [{ balance: "5" }],
                    }),
                } as any)
        )

        const result = await deductAction("user-1", "analytics_daily_access")
        expect(result.success).toBe(false)
        expect(result.error).toBe("Insufficient balance")
    })

    it("succeeds with sufficient balance", async () => {
        const mockClient = {
            query: vi.fn().mockImplementation(async (query: string) => {
                if (query.includes("FOR NO KEY UPDATE")) {
                    return { rows: [{ balance: "5000" }] }
                }
                if (query.includes("RETURNING id")) {
                    return { rows: [{ id: "tx-1" }] }
                }
                return { rows: [] }
            }),
        }
        vi.mocked(db.transaction).mockImplementation(async fn => fn(mockClient as any))

        const result = await deductAction("user-1", "analytics_daily_access")
        expect(result.success).toBe(true)
        expect(result.transactionId).toBe("tx-1")
    })

    it("deducts correct cost multiplied by quantity", async () => {
        let capturedAmount = 0
        const mockClient = {
            query: vi.fn().mockImplementation(async (query: string, params?: any[]) => {
                if (query.includes("FOR NO KEY UPDATE")) {
                    return { rows: [{ balance: "50000" }] }
                }
                if (query.includes("UPDATE")) {
                    capturedAmount = params?.[0]
                    return { rows: [] }
                }
                if (query.includes("RETURNING id")) {
                    return { rows: [{ id: "tx-1" }] }
                }
                return { rows: [] }
            }),
        }
        vi.mocked(db.transaction).mockImplementation(async fn => fn(mockClient as any))

        await deductAction("user-1", "chat_message_received", 5)
        expect(capturedAmount).toBe(49995) // 50000 - (1 * 5)
    })
})

describe("adminGrant", () => {
    it("rejects non-positive amounts", async () => {
        const result = await adminGrant("user-1", 0, "test")
        expect(result.success).toBe(false)
        expect(result.error).toBe("Amount must be positive")
    })

    it("creates account and adds credits", async () => {
        const mockClient = {
            query: vi.fn().mockImplementation(async (query: string) => {
                if (query.includes("FOR NO KEY UPDATE")) {
                    return { rows: [{ balance: "0" }] }
                }
                if (query.includes("RETURNING id")) {
                    return { rows: [{ id: "tx-1" }] }
                }
                return { rows: [] }
            }),
        }
        vi.mocked(db.transaction).mockImplementation(async fn => fn(mockClient as any))

        const result = await adminGrant("user-1", 100000, "Test grant")
        expect(result.success).toBe(true)
        expect(result.newBalance).toBe(100000)
    })
})

describe("getTransactions", () => {
    it("returns empty array when no transactions", async () => {
        vi.mocked(db.queryMany).mockResolvedValue([])
        const result = await getTransactions("user-1")
        expect(result).toEqual([])
    })

    it("maps rows to TransactionRecord", async () => {
        vi.mocked(db.queryMany).mockResolvedValue([
            {
                id: "tx-1",
                user_id: "user-1",
                amount: "1000",
                type: "credit",
                reason: "Admin grant",
                balance_before: "0",
                balance_after: "1000",
                created_at: new Date("2026-01-01"),
            },
        ])

        const result = await getTransactions("user-1")
        expect(result).toHaveLength(1)
        expect(result[0].amount).toBe(1000)
        expect(result[0].type).toBe("credit")
        expect(result[0].balanceAfter).toBe(1000)
    })
})

describe("CREDIT_COSTS", () => {
    it("has all expected actions", () => {
        expect(CREDIT_COSTS.chat_message_received).toBe(1)
        expect(CREDIT_COSTS.youtube_post_schedule).toBe(50)
        expect(CREDIT_COSTS.analytics_daily_access).toBe(1000)
        expect(CREDIT_COSTS.infra_api_per_1k_req).toBe(100)
    })

    it("has some free actions", () => {
        expect(CREDIT_COSTS.youtube_metadata).toBe(0)
    })
})
