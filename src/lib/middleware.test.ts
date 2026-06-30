/**
 * Lib Middleware Tests
 * Covers: updateSession - session validation and redirect logic
 *
 * Validates: Session validation and route protection in middleware
 */

import { validateSession } from "@/lib/auth/session"
import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { updateSession } from "./middleware"

// Mock the session module
vi.mock("@/lib/auth/session", () => ({
    validateSession: vi.fn(),
}))

describe("updateSession()", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ============================================================================
    // No Session Token Tests
    // ============================================================================

    describe("when no session token exists", () => {
        it("should redirect to login for protected routes", async () => {
            const request = new NextRequest(
                "http://localhost:3000/dashboard"
            )

            const response = await updateSession(request)

            expect(response.status).toBe(307) // redirect
            const location = response.headers.get("location")
            expect(location).toContain("/auth/login")
        })

        it("should NOT redirect for /login path", async () => {
            const request = new NextRequest("http://localhost:3000/login")

            const response = await updateSession(request)

            expect(response.status).toBe(200)
            expect(response.headers.get("location")).toBeNull()
        })

        it("should NOT redirect for /auth paths", async () => {
            const request = new NextRequest(
                "http://localhost:3000/auth/callback"
            )

            const response = await updateSession(request)

            expect(response.status).toBe(200)
            expect(response.headers.get("location")).toBeNull()
        })
    })

    // ============================================================================
    // Valid Session Token Tests
    // ============================================================================

    describe("when session token is valid", () => {
        it("should allow access to protected routes", async () => {
            vi.mocked(validateSession).mockResolvedValue({
                user_id: "user_123",
                email: "test@example.com",
                role: "user",
            } as any)

            const request = new NextRequest(
                "http://localhost:3000/dashboard"
            )
            request.cookies.set("auth_session", "valid_token_123")

            const response = await updateSession(request)

            expect(response.status).toBe(200)
            expect(response.headers.get("location")).toBeNull()
            expect(validateSession).toHaveBeenCalledWith(
                "valid_token_123"
            )
        })

        it("should allow access to deeply nested protected routes", async () => {
            vi.mocked(validateSession).mockResolvedValue({
                user_id: "user_123",
            } as any)

            const request = new NextRequest(
                "http://localhost:3000/settings/profile"
            )
            request.cookies.set("auth_session", "valid_token_123")

            const response = await updateSession(request)

            expect(response.status).toBe(200)
        })
    })

    // ============================================================================
    // Invalid/Expired Session Token Tests
    // ============================================================================

    describe("when session token is invalid", () => {
        it("should redirect to login for protected routes", async () => {
            vi.mocked(validateSession).mockResolvedValue(null)

            const request = new NextRequest(
                "http://localhost:3000/dashboard"
            )
            request.cookies.set("auth_session", "expired_token_123")

            const response = await updateSession(request)

            expect(response.status).toBe(307)
            expect(response.headers.get("location")).toContain(
                "/auth/login"
            )
        })

        it("should NOT redirect for /login path even with invalid token", async () => {
            vi.mocked(validateSession).mockResolvedValue(null)

            const request = new NextRequest("http://localhost:3000/login")
            request.cookies.set("auth_session", "expired_token_123")

            const response = await updateSession(request)

            expect(response.status).toBe(200)
        })
    })

    // ============================================================================
    // Error Handling Tests
    // ============================================================================

    describe("error handling", () => {
        it("should handle session validation errors gracefully", async () => {
            vi.mocked(validateSession).mockRejectedValue(
                new Error("Database connection failed")
            )

            const request = new NextRequest(
                "http://localhost:3000/dashboard"
            )
            request.cookies.set("auth_session", "token_123")

            // Should not throw - catches errors and treats as unauthenticated
            const response = await updateSession(request)

            // Should redirect since session validation failed
            expect(response.status).toBe(307)
            expect(response.headers.get("location")).toContain(
                "/auth/login"
            )
        })

        it("should handle malformed session token values", async () => {
            const request = new NextRequest(
                "http://localhost:3000/dashboard"
            )
            request.cookies.set("auth_session", "")

            const response = await updateSession(request)

            expect(response.status).toBe(307)
        })
    })
})
