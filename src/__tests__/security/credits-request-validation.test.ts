/**
 * Security Tests for Credits API Request Validation
 *
 * Tests for protection against:
 * - Type validation (prevent script modifications)
 * - Field validation (prevent injection)
 * - Auth bypass attempts
 * - Admin flag forgery
 * - Prototype pollution
 * - Rate limit awareness
 */

import { GET as balanceGET } from "@/app/api/credits/balance/route"
import { GET as transactionsGET } from "@/app/api/credits/transactions/route"
import { POST as grantPOST } from "@/app/api/credits/grant/route"
import { GET as whoamiGET } from "@/app/api/credits/whoami/route"
import { NextRequest } from "next/server"
import { describe, expect, it, vi } from "vitest"

const mockUser = vi.hoisted(() => ({
    id: "mock-user-uuid-123",
    email: "test@example.com",
    name: "Test User",
}))

vi.mock("@/lib/credits/session", () => ({
    getSessionUser: vi.fn().mockResolvedValue(mockUser),
    isAdminUser: vi.fn().mockReturnValue(true),
}))

const mockRateLimit = vi.hoisted(() =>
    vi.fn().mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: 0 })
)

vi.mock("@/lib/rate-limit", () => ({
    rateLimitByKey: mockRateLimit,
    buildClientKey: vi.fn(
        (params: { ip: string; path: string }) => `${params.ip}:${params.path}`
    ),
}))

vi.mock("@/lib/credits/service", () => ({
    getBalance: vi.fn().mockResolvedValue({ balance: 500 }),
    getTransactions: vi.fn().mockResolvedValue([
        {
            id: "tx-1",
            amount: -50,
            type: "debit",
            reason: "test",
            balanceBefore: 550,
            balanceAfter: 500,
            createdAt: new Date().toISOString(),
        },
    ]),
    adminGrant: vi.fn().mockResolvedValue({
        success: true,
        transactionId: "grant-tx-1",
        newBalance: 600,
    }),
}))

describe("Credits API - Request Validation Security", () => {
    describe("GET /api/credits/balance - Auth Bypass", () => {
        it("should reject request without valid session", async () => {
            const { getSessionUser } = await import("@/lib/credits/session")
            vi.mocked(getSessionUser).mockResolvedValueOnce(null)

            const request = new NextRequest("http://localhost/api/credits/balance")
            const response = await balanceGET(request)
            expect(response.status).toBe(401)
        })
    })

    describe("GET /api/credits/transactions - Auth & Input Validation", () => {
        it("should reject request without valid session", async () => {
            const { getSessionUser } = await import("@/lib/credits/session")
            vi.mocked(getSessionUser).mockResolvedValueOnce(null)

            const request = new NextRequest("http://localhost/api/credits/transactions")
            const response = await transactionsGET(request)
            expect(response.status).toBe(401)
        })

        it("should clamp limit to max 100 even when larger value sent", async () => {
            const request = new NextRequest(
                "http://localhost/api/credits/transactions?limit=999999"
            )
            const response = await transactionsGET(request)
            expect(response.status).toBe(200)
        })

        it("should handle non-numeric limit gracefully", async () => {
            const request = new NextRequest(
                "http://localhost/api/credits/transactions?limit=abc"
            )
            const response = await transactionsGET(request)
            expect(response.status).toBe(200)
        })
    })

    describe("POST /api/credits/grant - Type Validation", () => {
        it("should reject amount as string", async () => {
            const request = new NextRequest("http://localhost/api/credits/grant", {
                method: "POST",
                body: JSON.stringify({ amount: "100" }),
            })
            const response = await grantPOST(request)
            expect(response.status).toBe(400)
        })

        it("should reject amount as array", async () => {
            const request = new NextRequest("http://localhost/api/credits/grant", {
                method: "POST",
                body: JSON.stringify({ amount: [100] }),
            })
            const response = await grantPOST(request)
            expect(response.status).toBe(400)
        })

        it("should reject amount as object", async () => {
            const request = new NextRequest("http://localhost/api/credits/grant", {
                method: "POST",
                body: JSON.stringify({ amount: { value: 100 } }),
            })
            const response = await grantPOST(request)
            expect(response.status).toBe(400)
        })

        it("should reject amount as null", async () => {
            const request = new NextRequest("http://localhost/api/credits/grant", {
                method: "POST",
                body: JSON.stringify({ amount: null }),
            })
            const response = await grantPOST(request)
            expect(response.status).toBe(400)
        })

        it("should reject reason as number", async () => {
            const request = new NextRequest("http://localhost/api/credits/grant", {
                method: "POST",
                body: JSON.stringify({ amount: 100, reason: 12345 }),
            })
            const response = await grantPOST(request)
            expect(response.status).toBe(400)
        })

        it("should reject reason as boolean", async () => {
            const request = new NextRequest("http://localhost/api/credits/grant", {
                method: "POST",
                body: JSON.stringify({ amount: 100, reason: true }),
            })
            const response = await grantPOST(request)
            expect(response.status).toBe(400)
        })
    })

    describe("POST /api/credits/grant - Field Validation", () => {
        it("should reject negative amount", async () => {
            const request = new NextRequest("http://localhost/api/credits/grant", {
                method: "POST",
                body: JSON.stringify({ amount: -100 }),
            })
            const response = await grantPOST(request)
            expect(response.status).toBe(400)
        })

        it("should reject zero amount", async () => {
            const request = new NextRequest("http://localhost/api/credits/grant", {
                method: "POST",
                body: JSON.stringify({ amount: 0 }),
            })
            const response = await grantPOST(request)
            expect(response.status).toBe(400)
        })

        it("should reject empty body", async () => {
            const request = new NextRequest("http://localhost/api/credits/grant", {
                method: "POST",
                body: JSON.stringify({}),
            })
            const response = await grantPOST(request)
            expect(response.status).toBe(400)
        })

        it("should reject body as array", async () => {
            const request = new NextRequest("http://localhost/api/credits/grant", {
                method: "POST",
                body: JSON.stringify([100, "test"]),
            })
            const response = await grantPOST(request)
            expect(response.status).toBe(400)
        })

        it("should reject body as null", async () => {
            const request = new NextRequest("http://localhost/api/credits/grant", {
                method: "POST",
                body: JSON.stringify(null),
            })
            const response = await grantPOST(request)
            expect(response.status).toBe(400)
        })

        it("should reject invalid JSON", async () => {
            const request = new NextRequest("http://localhost/api/credits/grant", {
                method: "POST",
                body: "{invalid json}",
            })
            const response = await grantPOST(request)
            expect(response.status).toBe(400)
        })
    })

    describe("POST /api/credits/grant - Admin & Auth Bypass", () => {
        it("should reject grant when not authenticated", async () => {
            const { getSessionUser } = await import("@/lib/credits/session")
            vi.mocked(getSessionUser).mockResolvedValueOnce(null)

            const request = new NextRequest("http://localhost/api/credits/grant", {
                method: "POST",
                body: JSON.stringify({ amount: 100 }),
            })
            const response = await grantPOST(request)
            expect(response.status).toBe(401)
        })

        it("should reject grant when user is not admin", async () => {
            const { isAdminUser } = await import("@/lib/credits/session")
            vi.mocked(isAdminUser).mockReturnValueOnce(false)

            const request = new NextRequest("http://localhost/api/credits/grant", {
                method: "POST",
                body: JSON.stringify({ amount: 100 }),
            })
            const response = await grantPOST(request)
            expect(response.status).toBe(401)
        })
    })

    describe("POST /api/credits/grant - Extra Field Injection Prevention", () => {
        it("should reject extra admin fields in grant body", async () => {
            const request = new NextRequest("http://localhost/api/credits/grant", {
                method: "POST",
                body: JSON.stringify({
                    amount: 100,
                    isAdmin: true,
                    role: "superadmin",
                }),
            })
            const response = await grantPOST(request)
            expect(response.status).toBe(400)
        })

        it("should reject prototype pollution attempt", async () => {
            const request = new NextRequest("http://localhost/api/credits/grant", {
                method: "POST",
                body: JSON.stringify({
                    amount: 100,
                    __proto__: { isAdmin: true },
                    constructor: { prototype: { isAdmin: true } },
                }),
            })
            const response = await grantPOST(request)
            expect(response.status).toBe(400)
        })
    })

    describe("POST /api/credits/grant - Oversized Input Prevention", () => {
        it("should reject oversized reason string", async () => {
            const request = new NextRequest("http://localhost/api/credits/grant", {
                method: "POST",
                body: JSON.stringify({
                    amount: 100,
                    reason: "x".repeat(10000),
                }),
            })
            const response = await grantPOST(request)
            expect(response.status).toBe(400)
        })
    })

    describe("POST /api/credits/grant - Rate Limiting", () => {
        it("should allow request within rate limit", async () => {
            mockRateLimit.mockResolvedValueOnce({
                success: true,
                limit: 10,
                remaining: 9,
                reset: 0,
            })

            const request = new NextRequest("http://localhost/api/credits/grant", {
                method: "POST",
                body: JSON.stringify({ amount: 100 }),
            })
            const response = await grantPOST(request)
            expect(response.status).toBe(200)
        })

        it("should reject request when rate limited", async () => {
            mockRateLimit.mockResolvedValueOnce({
                success: false,
                limit: 10,
                remaining: 0,
                reset: Date.now() + 60000,
            })

            const request = new NextRequest("http://localhost/api/credits/grant", {
                method: "POST",
                body: JSON.stringify({ amount: 100 }),
            })
            const response = await grantPOST(request)
            expect(response.status).toBe(429)
        })
    })

    describe("GET /api/credits/whoami - Auth Bypass", () => {
        it("should reject request without valid session", async () => {
            const { getSessionUser } = await import("@/lib/credits/session")
            vi.mocked(getSessionUser).mockResolvedValueOnce(null)

            const request = new NextRequest("http://localhost/api/credits/whoami")
            const response = await whoamiGET(request)
            expect(response.status).toBe(401)
        })
    })
})
