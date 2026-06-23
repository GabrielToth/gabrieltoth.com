/**
 * Tests for POST /api/auth/send-verification-email endpoint
 * Validates: Requirements 19.1, 19.2, 19.3, 19.4, 19.5
 */

import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "./route"

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
    getAdminClient: vi.fn(() => ({
        from: vi.fn((table: string) => ({
            select: vi.fn(function () {
                return {
                    eq: vi.fn(function (field: string, value: string) {
                        return {
                            single: vi.fn(async () => {
                                if (table === "users" && field === "id") {
                                    return {
                                        data: {
                                            id: value,
                                            email: "user@example.com",
                                        },
                                        error: null,
                                    }
                                }
                                return { data: null, error: null }
                            }),
                        }
                    }),
                }
            }),
            insert: vi.fn(function () {
                return Promise.resolve({
                    data: null,
                    error: null,
                })
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

// Mock email service
vi.mock("@/lib/auth/email-service", () => ({
    sendVerificationEmail: vi.fn(() => Promise.resolve(true)),
}))

// Mock audit logging
vi.mock("@/lib/auth/audit-logging", () => ({
    logEmailVerification: vi.fn(() => Promise.resolve()),
}))

describe("POST /api/auth/send-verification-email", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("should send verification email successfully", async () => {
        const request = new NextRequest(
            "http://localhost:3000/api/auth/send-verification-email",
            {
                method: "POST",
                body: JSON.stringify({
                    email: "user@example.com",
                    userId: "user-id-123",
                }),
            }
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.message).toContain("successfully")
    })

    it("should return 400 for missing email", async () => {
        const request = new NextRequest(
            "http://localhost:3000/api/auth/send-verification-email",
            {
                method: "POST",
                body: JSON.stringify({
                    userId: "user-id-123",
                }),
            }
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toContain("required")
    })

    it("should return 400 for missing userId", async () => {
        const request = new NextRequest(
            "http://localhost:3000/api/auth/send-verification-email",
            {
                method: "POST",
                body: JSON.stringify({
                    email: "user@example.com",
                }),
            }
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toContain("required")
    })

    it("should return 400 for invalid request body", async () => {
        const request = new NextRequest(
            "http://localhost:3000/api/auth/send-verification-email",
            {
                method: "POST",
                body: "invalid json",
            }
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toContain("Invalid request body")
    })
})
