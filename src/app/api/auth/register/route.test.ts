/**
 * Tests for POST /api/auth/register endpoint
 * Validates: Requirements 1.1, 6.1, 8.1, 8.2, 8.3, 20.1, 20.2, 20.3, 20.4
 */

import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "./route"

// Mock AuthenticationService
vi.mock("@/lib/auth/password-security", () => {
    const mockRegister = vi.fn(async (request: any) => {
        // Simulate CAPTCHA failure (missing token)
        if (!request.captchaToken) {
            return {
                success: false,
                error: "CAPTCHA verification required",
                errorCode: "CAPTCHA_REQUIRED",
                statusCode: 400,
            }
        }
        // Simulate successful registration
        if (request.email === "newuser@example.com") {
            return {
                success: true,
                userId: "new-user-id",
                email: request.email,
                statusCode: 201,
            }
        }
        // Simulate existing email
        if (request.email === "existing@example.com") {
            return {
                success: false,
                error: "Registration failed",
                errorCode: "REGISTRATION_FAILED",
                statusCode: 409,
            }
        }
        return {
            success: false,
            error: "Registration failed",
            errorCode: "REGISTRATION_FAILED",
            statusCode: 400,
        }
    })

    return {
        AuthenticationService: class {
            register = mockRegister
        },
    }
})

// Mock audit logging
vi.mock("@/lib/auth/audit-logging", () => ({
    logRegistration: vi.fn(async () => {}),
}))

// Mock Supabase (still needed for initialization)
vi.mock("@/lib/supabase/server", () => ({
    getAdminClient: vi.fn(() => ({})),
}))

describe("POST /api/auth/register", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("should successfully register a user with valid data and CAPTCHA token", async () => {
        const body = {
            email: "newuser@example.com",
            password: "ValidPass123!",
            name: "John Doe",
            phone: "+1234567890",
            captchaToken: "valid-captcha-token",
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
            captchaToken: "valid-captcha-token",
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
            captchaToken: "valid-captcha-token",
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
            captchaToken: "valid-captcha-token",
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
            captchaToken: "valid-captcha-token",
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
            captchaToken: "valid-captcha-token",
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

    it("should return 400 for missing CAPTCHA token", async () => {
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

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
    })

    it("should return 400 for invalid request body", async () => {
        const request = new NextRequest(
            "http://localhost:3000/api/auth/register",
            {
                method: "POST",
                body: "invalid json",
            }
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
    })

    it("should return 400 for array body", async () => {
        const request = new NextRequest(
            "http://localhost:3000/api/auth/register",
            {
                method: "POST",
                body: JSON.stringify([]),
            }
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
    })

    it("should return 400 for extra fields in request", async () => {
        const body = {
            email: "newuser@example.com",
            password: "ValidPass123!",
            name: "John Doe",
            phone: "+1234567890",
            captchaToken: "valid-captcha-token",
            maliciousField: "should be rejected",
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
})
