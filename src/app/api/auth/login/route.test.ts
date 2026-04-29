import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcrypt"
import { NextRequest } from "next/server"
import { POST } from "./route"

// Mock Supabase
jest.mock("@supabase/supabase-js")
jest.mock("@/lib/rate-limit")
jest.mock("@/lib/auth/audit-logging")

const mockSupabase = {
    from: jest.fn(),
}

describe("POST /api/auth/login", () => {
    beforeEach(() => {
        jest.clearAllMocks()
        ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
    })

    it("should return error for missing email", async () => {
        const request = new NextRequest("http://localhost/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                password: "Test@1234",
                rememberMe: false,
                csrfToken: "token",
            }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toContain("required")
    })

    it("should return error for missing password", async () => {
        const request = new NextRequest("http://localhost/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: "test@example.com",
                rememberMe: false,
                csrfToken: "token",
            }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
    })

    it("should return error for invalid email format", async () => {
        const request = new NextRequest("http://localhost/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: "invalid-email",
                password: "Test@1234",
                rememberMe: false,
                csrfToken: "token",
            }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toContain("email")
    })

    it("should return generic error for non-existent user", async () => {
        mockSupabase.from.mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: null,
                        error: new Error("No user found"),
                    }),
                }),
            }),
        })

        const request = new NextRequest("http://localhost/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: "nonexistent@example.com",
                password: "Test@1234",
                rememberMe: false,
                csrfToken: "token",
            }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.success).toBe(false)
        expect(data.error).toContain("Invalid email or password")
    })

    it("should return error for unverified email", async () => {
        mockSupabase.from.mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: {
                            id: "user-123",
                            email: "test@example.com",
                            password_hash: await bcrypt.hash("Test@1234", 10),
                            email_verified: false,
                        },
                        error: null,
                    }),
                }),
            }),
        })

        const request = new NextRequest("http://localhost/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: "test@example.com",
                password: "Test@1234",
                rememberMe: false,
                csrfToken: "token",
            }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.success).toBe(false)
        expect(data.error).toContain("verify your email")
    })

    it("should return generic error for invalid password", async () => {
        mockSupabase.from.mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: {
                            id: "user-123",
                            email: "test@example.com",
                            password_hash: await bcrypt.hash("Test@1234", 10),
                            email_verified: true,
                        },
                        error: null,
                    }),
                }),
            }),
        })

        const request = new NextRequest("http://localhost/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: "test@example.com",
                password: "WrongPassword@1234",
                rememberMe: false,
                csrfToken: "token",
            }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.success).toBe(false)
        expect(data.error).toContain("Invalid email or password")
    })

    it("should successfully login with correct credentials", async () => {
        const hashedPassword = await bcrypt.hash("Test@1234", 10)

        mockSupabase.from.mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: {
                            id: "user-123",
                            email: "test@example.com",
                            password_hash: hashedPassword,
                            email_verified: true,
                        },
                        error: null,
                    }),
                }),
            }),
            insert: jest.fn().mockResolvedValue({
                data: { id: "session-123" },
                error: null,
            }),
        })

        const request = new NextRequest("http://localhost/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: "test@example.com",
                password: "Test@1234",
                rememberMe: false,
                csrfToken: "token",
            }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data).toHaveProperty("userId")
        expect(data.data).toHaveProperty("sessionToken")
    })

    it("should set secure cookie on successful login", async () => {
        const hashedPassword = await bcrypt.hash("Test@1234", 10)

        mockSupabase.from.mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: {
                            id: "user-123",
                            email: "test@example.com",
                            password_hash: hashedPassword,
                            email_verified: true,
                        },
                        error: null,
                    }),
                }),
            }),
            insert: jest.fn().mockResolvedValue({
                data: { id: "session-123" },
                error: null,
            }),
        })

        const request = new NextRequest("http://localhost/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: "test@example.com",
                password: "Test@1234",
                rememberMe: true,
                csrfToken: "token",
            }),
        })

        const response = await POST(request)

        expect(response.cookies.get("auth_session")).toBeDefined()
        expect(response.cookies.get("auth_session")?.httpOnly).toBe(true)
    })
})
