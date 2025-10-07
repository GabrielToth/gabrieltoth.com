import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { verifyMoneroTransaction } from "@/lib/monero"

const okJson = (data: any, status = 200) =>
    ({
        ok: status >= 200 && status < 300,
        status,
        json: async () => data,
    }) as any

describe("lib/monero verifyMoneroTransaction branches", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch" as any)

    beforeEach(() => {
        fetchSpy.mockReset()
    })

    afterEach(() => {
        fetchSpy.mockReset()
    })

    it("returns not found when transaction is missing", async () => {
        fetchSpy.mockImplementation(async (input: any) => {
            const url = String(input)
            if (url.includes("/api/transaction/")) {
                return { ok: false, status: 404 } as any
            }
            return okJson({}, 200)
        })

        const res = await verifyMoneroTransaction({
            txHash: "a".repeat(64),
            expectedAmount: 1,
            orderId: "1",
        })
        expect(res.isValid).toBe(false)
        expect(res.error).toMatch(/not found/i)
    })

    it("returns error when details cannot be retrieved", async () => {
        let txCalls = 0
        fetchSpy.mockImplementation(async (input: any) => {
            const url = String(input)
            if (url.includes("/api/transaction/")) {
                txCalls++
                if (txCalls === 1) {
                    return okJson({
                        status: "success",
                        data: { block_height: 100, outputs: [] },
                    })
                }
                // Second call for details returns non-success
                return okJson({ status: "error" })
            }
            if (url.includes("/api/networkinfo")) {
                return okJson({ data: { height: 100 } })
            }
            return okJson({})
        })

        const res = await verifyMoneroTransaction({
            txHash: "a".repeat(64),
            expectedAmount: 1,
            orderId: "1",
        })
        expect(res.isValid).toBe(false)
        expect(res.error).toMatch(/could not retrieve/i)
    })

    it("returns insufficient confirmations when below threshold", async () => {
        fetchSpy.mockImplementation(async (input: any) => {
            const url = String(input)
            if (url.includes("/api/transaction/")) {
                return okJson({
                    status: "success",
                    data: {
                        block_height: 104,
                        outputs: [{ amount: 1000000000000 }],
                    },
                })
            }
            if (url.includes("/api/networkinfo")) {
                return okJson({ data: { height: 110 } }) // 110 - 104 + 1 = 7 confirmations
            }
            return okJson({})
        })

        const res = await verifyMoneroTransaction({
            txHash: "a".repeat(64),
            expectedAmount: 1,
            orderId: "1",
        })
        expect(res.isValid).toBe(false)
        expect(res.confirmations).toBeLessThan(10)
        expect(res.error).toMatch(/insufficient/i)
    })

    it("returns amount mismatch when difference exceeds tolerance", async () => {
        fetchSpy.mockImplementation(async (input: any) => {
            const url = String(input)
            if (url.includes("/api/transaction/")) {
                return okJson({
                    status: "success",
                    data: {
                        block_height: 100,
                        outputs: [{ amount: 1000000000000 }],
                    },
                })
            }
            if (url.includes("/api/networkinfo")) {
                return okJson({ data: { height: 120 } }) // confirmations >= 10
            }
            return okJson({})
        })

        const res = await verifyMoneroTransaction({
            txHash: "a".repeat(64),
            expectedAmount: 2, // outputs -> 1 XMR
            orderId: "1",
        })
        expect(res.isValid).toBe(false)
        expect(res.error).toMatch(/amount mismatch/i)
    })

    it("verifies outputs and returns valid when everything matches", async () => {
        fetchSpy.mockImplementation(async (input: any) => {
            const url = String(input)
            if (url.includes("/api/transaction/")) {
                return okJson({
                    status: "success",
                    data: {
                        block_height: 100,
                        outputs: [{ amount: 1000000000000 }],
                    },
                })
            }
            if (url.includes("/api/networkinfo")) {
                return okJson({ data: { height: 120 } })
            }
            if (url.includes("/api/outputs/")) {
                return okJson({
                    status: "success",
                    data: { outputs: [{ amount: 1000000000000 }] },
                })
            }
            return okJson({})
        })

        const res = await verifyMoneroTransaction({
            txHash: "a".repeat(64),
            expectedAmount: 1,
            orderId: "1",
            viewKey: "v".repeat(32),
            address: "4" + "A".repeat(94),
        })
        expect(res.isValid).toBe(true)
        expect(res.amount).toBeCloseTo(1)
        expect(res.confirmations).toBeGreaterThanOrEqual(10)
    })

    it("fails when outputs do not match provided address", async () => {
        fetchSpy.mockImplementation(async (input: any) => {
            const url = String(input)
            if (url.includes("/api/transaction/")) {
                return okJson({
                    status: "success",
                    data: {
                        block_height: 100,
                        outputs: [{ amount: 1000000000000 }],
                    },
                })
            }
            if (url.includes("/api/networkinfo")) {
                return okJson({ data: { height: 120 } })
            }
            if (url.includes("/api/outputs/")) {
                return okJson({ status: "success", data: { outputs: [] } })
            }
            return okJson({})
        })

        const res = await verifyMoneroTransaction({
            txHash: "a".repeat(64),
            expectedAmount: 1,
            orderId: "1",
            viewKey: "v".repeat(32),
            address: "4" + "A".repeat(94),
        })
        expect(res.isValid).toBe(false)
        expect(res.error).toMatch(/outputs do not match/i)
    })

    it("returns valid without viewKey/address when amounts within tolerance", async () => {
        fetchSpy.mockImplementation(async (input: any) => {
            const url = String(input)
            if (url.includes("/api/transaction/")) {
                return okJson({
                    status: "success",
                    data: {
                        block_height: 100,
                        // 1.00 XMR
                        outputs: [{ amount: 1000000000000 }],
                    },
                })
            }
            if (url.includes("/api/networkinfo")) {
                return okJson({ data: { height: 120 } })
            }
            return okJson({})
        })

        const res = await verifyMoneroTransaction({
            txHash: "a".repeat(64),
            expectedAmount: 1.0, // exact match within 5%
            orderId: "1",
        })
        expect(res.isValid).toBe(true)
        expect(res.amount).toBeCloseTo(1)
        expect(res.confirmations).toBeGreaterThanOrEqual(10)
    })

    it("returns service unavailable when an unexpected error is thrown", async () => {
        let first = true
        fetchSpy.mockImplementation(async (input: any) => {
            const url = String(input)
            if (first && url.includes("/api/transaction/")) {
                first = false
                throw new Error("boom")
            }
            // Alternative also fails
            if (url.includes("monero.observer")) {
                throw new Error("boom")
            }
            return okJson({})
        })

        const res = await verifyMoneroTransaction({
            txHash: "a".repeat(64),
            expectedAmount: 1,
            orderId: "1",
        })
        expect(res.isValid).toBe(false)
        expect(String(res.error)).toMatch(/temporarily unavailable|not found/i)
    })

    it("handles invalid input by returning service temporarily unavailable", async () => {
        // Passing null will throw when accessing verification.txHash inside try block
        // which should be caught by verifyMoneroTransaction catch path
        // @ts-expect-error intentionally invalid
        const res = await verifyMoneroTransaction(null)
        expect(res.isValid).toBe(false)
        expect(String(res.error)).toMatch(/temporarily unavailable/i)
    })
})
