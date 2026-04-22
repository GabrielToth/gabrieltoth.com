/**
 * Tests for GET /api/auth/check-email endpoint
 * Validates: Requirements 20.1, 20.2, 20.3, 20.4
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
                                    table === "auth_users" &&
                                    field === "email"
                                ) {
                                    // Simulate existing user for duplicate email test
                                    if (value === "existing@example.com") {
                                        return {
                                            data: { id: "existing-id" },
                                            error: null,
                                        }
                                    }
                                    // No user found for new email
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

describe("GET /api/auth/check-email", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("should return available: true for new email", async () => {
        const request = new NextRequest(
            "http://localhost:3000/api/auth/check-email?email=newuser@example.com"
        )

        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.available).toBe(true)
        expect(data.email).toBe("newuser@example.com")
    })

    it("should return available: false for existing email", async () => {
        const request = new NextRequest(
            "http://localhost:3000/api/auth/check-email?email=existing@example.com"
        )

        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.available).toBe(false)
        expect(data.email).toBe("existing@example.com")
    })

    it("should return 400 for missing email parameter", async () => {
        const request = new NextRequest(
            "http://localhost:3000/api/auth/check-email"
        )

        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.available).toBe(false)
        expect(data.error).toContain("required")
    })

    it("should return 400 for invalid email format", async () => {
        const request = new NextRequest(
            "http://localhost:3000/api/auth/check-email?email=invalid-email"
        )

        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.available).toBe(false)
        expect(data.error).toBeDefined()
    })

    it("should include response time header", async () => {
        const request = new NextRequest(
            "http://localhost:3000/api/auth/check-email?email=newuser@example.com"
        )

        const response = await GET(request)

        expect(response.headers.get("X-Response-Time")).toBeDefined()
        expect(response.headers.get("X-Response-Time")).toMatch(/^\d+ms$/)
    })
})
