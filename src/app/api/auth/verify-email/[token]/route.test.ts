/**
 * Tests for GET /api/auth/verify-email/:token endpoint
 * Validates: Requirements 7.4, 7.5
 */

import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { GET } from "./route"

// Mock Supabase
vi.mock("@supabase/supabase-js", () => ({
    createClient: vi.fn(() => ({
        from: vi.fn((table: string) => ({
            select: vi.fn(function () {
                return {
                    eq: vi.fn(function (field: string, value: string) {
                        return {
                            single: vi.fn(async () => {
                                if (
                                    table === "email_verification_tokens" &&
                                    field === "token"
                                ) {
                                    // Valid token
                                    if (value === "valid-token") {
                                        return {
                                            data: {
                                                id: "token-id",
                                                user_id: "user-id",
                                                email: "user@example.com",
                                                expires_at: new Date(
                                                    Date.now() +
                                                        24 * 60 * 60 * 1000
                                                ).toISOString(),
                                                verified_at: null,
                                            },
                                            error: null,
                                        }
                                    }
                                    // Expired token
                                    if (value === "expired-token") {
                                        return {
                                            data: {
                                                id: "token-id",
                                                user_id: "user-id",
                                                email: "user@example.com",
                                                expires_at: new Date(
                                                    Date.now() - 1000
                                                ).toISOString(),
                                                verified_at: null,
                                            },
                                            error: null,
                                        }
                                    }
                                    // Already verified token
                                    if (value === "already-verified-token") {
                                        return {
                                            data: {
                                                id: "token-id",
                                                user_id: "user-id",
                                                email: "user@example.com",
                                                expires_at: new Date(
                                                    Date.now() +
                                                        24 * 60 * 60 * 1000
                                                ).toISOString(),
                                                verified_at:
                                                    new Date().toISOString(),
                                            },
                                            error: null,
                                        }
                                    }
                                    // Invalid token
                                    return {
                                        data: null,
                                        error: { code: "PGRST116" },
                                    }
                                }
                                return { data: null, error: null }
                            }),
                        }
                    }),
                }
            }),
            update: vi.fn(function () {
                return {
                    eq: vi.fn(function () {
                        return Promise.resolve({
                            data: null,
                            error: null,
                        })
                    }),
                }
            }),
        })),
    })),
}))

// Mock environment
vi.mock("@/lib/config/env", () => ({
    getEnv: vi.fn((key: string) => {
        const envMap: Record<string, string> = {
            NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
            SUPABASE_SERVICE_ROLE_KEY: "test-key",
        }
        return envMap[key]
    }),
}))

// Mock audit logging
vi.mock("@/lib/auth/audit-logging", () => ({
    logEmailVerification: vi.fn(() => Promise.resolve()),
}))

describe("GET /api/auth/verify-email/:token", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("should verify email with valid token", async () => {
        const request = new NextRequest(
            "http://localhost:3000/api/auth/verify-email/valid-token"
        )

        const response = await GET(request, {
            params: { token: "valid-token" },
        } as any)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.email).toBe("user@example.com")
    })

    it("should return 400 for invalid token", async () => {
        const request = new NextRequest(
            "http://localhost:3000/api/auth/verify-email/invalid-token"
        )

        const response = await GET(request, {
            params: { token: "invalid-token" },
        } as any)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toContain("Invalid or expired")
    })

    it("should return 400 for expired token", async () => {
        const request = new NextRequest(
            "http://localhost:3000/api/auth/verify-email/expired-token"
        )

        const response = await GET(request, {
            params: { token: "expired-token" },
        } as any)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toContain("expired")
    })

    it("should return 400 for already verified token", async () => {
        const request = new NextRequest(
            "http://localhost:3000/api/auth/verify-email/already-verified-token"
        )

        const response = await GET(request, {
            params: { token: "already-verified-token" },
        } as any)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toContain("already been used")
    })

    it("should return 400 for missing token", async () => {
        const request = new NextRequest(
            "http://localhost:3000/api/auth/verify-email/"
        )

        const response = await GET(request, { params: { token: "" } } as any)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toContain("required")
    })
})
