/**
 * Tests for POST /api/auth/register endpoint
 * Validates: Requirements 6.1, 6.3, 6.4, 6.5, 8.3, 18.1, 18.2, 18.3, 18.4, 18.5
 */

import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "./route"

// Mock Supabase
vi.mock("@supabase/supabase-js", () => ({
    createClient: vi.fn(() => ({
        from: vi.fn((table: string) => ({
            select: vi.fn(function () {
                return {
                    eq: vi.fn(function (field: string, value: string) {
                        return {
                            single: vi.fn(async () => {
                                if (table === "users" && field === "email") {
                                    if (value === "existing@example.com") {
                                        return {
                                            data: { id: "existing-id" },
                                            error: null,
                                        }
                                    }
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
            insert: vi.fn(function () {
                return {
                    select: vi.fn(function () {
                        return {
                            single: vi.fn(async () => ({
                                data: { id: "new-user-id" },
                                error: null,
                            })),
                        }
                    }),
                }
            }),
        })),
    })),
}))

// Mock bcrypt
vi.mock("bcrypt", () => ({
    default: {
        hash: vi.fn(async (password: string) => `hashed_${password}`),
    },
}))

// Mock audit logging
vi.mock("@/lib/auth/audit-logging", () => ({
    logRegistration: vi.fn(async () => {}),
}))

// Mock rate limiting
vi.mock("@/lib/rate-limit", () => ({
    buildClientKey: vi.fn(params => `${params.ip}:${params.path}`),
    rateLimitByKey: vi.fn(async () => ({ success: true })),
}))

describe("POST /api/auth/register", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("should successfully register a user with valid data", async () => {
        const body = {
            email: "newuser@example.com",
            password: "ValidPass123!",
            name: "John Doe",
            phone: "+1234567890",
        }

        const request = new NextRequest(
            "http://localhost:3000/api/auth/register",
            {
                method: "POST",
                body: JSON.stringify(body),
            }
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(201)
        expect(data.success).toBe(true)
        expect(data.data.userId).toBe("new-user-id")
        expect(data.data.email).toBe("newuser@example.com")
    })

    it("should return 400 for missing fields", async () => {
        const body = {
            email: "newuser@example.com",
            password: "ValidPass123!",
        }

        const request = new NextRequest(
            "http://localhost:3000/api/auth/register",
            {
                method: "POST",
                body: JSON.stringify(body),
            }
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
    })

    it("should return 400 for invalid email format", async () => {
        const body = {
            email: "invalid-email",
            password: "ValidPass123!",
            name: "John Doe",
            phone: "+1234567890",
        }

        const request = new NextRequest(
            "http://localhost:3000/api/auth/register",
            {
                method: "POST",
                body: JSON.stringify(body),
            }
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
    })

    it("should return 400 for weak password", async () => {
        const body = {
            email: "newuser@example.com",
            password: "weak",
            name: "John Doe",
            phone: "+1234567890",
        }

        const request = new NextRequest(
            "http://localhost:3000/api/auth/register",
            {
                method: "POST",
                body: JSON.stringify(body),
            }
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
    })

    it("should return 400 for invalid name", async () => {
        const body = {
            email: "newuser@example.com",
            password: "ValidPass123!",
            name: "J",
            phone: "+1234567890",
        }

        const request = new NextRequest(
            "http://localhost:3000/api/auth/register",
            {
                method: "POST",
                body: JSON.stringify(body),
            }
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
    })

    it("should return 409 for duplicate email", async () => {
        const body = {
            email: "existing@example.com",
            password: "ValidPass123!",
            name: "John Doe",
            phone: "+1234567890",
        }

        const request = new NextRequest(
            "http://localhost:3000/api/auth/register",
            {
                method: "POST",
                body: JSON.stringify(body),
            }
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(409)
        expect(data.success).toBe(false)
    })

    it("should normalize email to lowercase", async () => {
        const body = {
            email: "NewUser@Example.COM",
            password: "ValidPass123!",
            name: "John Doe",
            phone: "+1234567890",
        }

        const request = new NextRequest(
            "http://localhost:3000/api/auth/register",
            {
                method: "POST",
                body: JSON.stringify(body),
            }
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(201)
        expect(data.data.email).toBe("newuser@example.com")
    })
})
