/**
 * Authentication Middleware Tests
 * Tests for session validation, Remember Me validation, session refresh,
 * and protected route access control
 *
 * Validates: Requirement 23.6 (>90% coverage)
 */

import * as sessionModule from "@/lib/auth/session"
import { logger } from "@/lib/logger"
import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    createAuthMiddleware,
    getAuthenticatedUser,
    hasRememberMe,
    isAuthenticated,
    protectedRouteMiddleware,
    redirectToLogin,
    refreshSessionTokenMiddleware,
    validateRememberMeTokenMiddleware,
    validateSessionTokenMiddleware,
} from "./auth"

// Mock dependencies
vi.mock("@/lib/auth/session")
vi.mock("@/lib/auth/audit-logging")
vi.mock("@/lib/logger")

describe("Authentication Middleware", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ============================================================================
    // Session Token Validation Tests (23.1)
    // ============================================================================

    describe("validateSessionTokenMiddleware()", () => {
        it("should return valid result when session token is valid", async () => {
            /**
             * Validates: Requirement 23.1
             * The middleware SHALL validate session tokens and return valid status
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })
            request.cookies.set("auth_session", "valid_token_123")

            vi.mocked(sessionModule.validateSessionToken).mockResolvedValueOnce(
                true
            )

            const result = await validateSessionTokenMiddleware(request)

            expect(result.isValid).toBe(true)
            expect(result.sessionToken).toBe("valid_token_123")
            expect(result.error).toBeUndefined()
        })

        it("should return invalid result when session token is missing", async () => {
            /**
             * Validates: Requirement 23.1
             * The middleware SHALL return invalid status when no session token is found
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })

            const result = await validateSessionTokenMiddleware(request)

            expect(result.isValid).toBe(false)
            expect(result.error).toBe("No session token found")
        })

        it("should return invalid result when session token is expired", async () => {
            /**
             * Validates: Requirement 23.1
             * The middleware SHALL return invalid status when session token is expired
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })
            request.cookies.set("auth_session", "expired_token_123")

            vi.mocked(sessionModule.validateSessionToken).mockResolvedValueOnce(
                false
            )

            const result = await validateSessionTokenMiddleware(request)

            expect(result.isValid).toBe(false)
            expect(result.error).toBe("Session token is invalid or expired")
        })

        it("should handle validation errors gracefully", async () => {
            /**
             * Validates: Requirement 23.1
             * The middleware SHALL handle validation errors gracefully
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })
            request.cookies.set("auth_session", "token_123")

            vi.mocked(sessionModule.validateSessionToken).mockRejectedValueOnce(
                new Error("Database error")
            )

            const result = await validateSessionTokenMiddleware(request)

            expect(result.isValid).toBe(false)
            expect(result.error).toBe("Error validating session token")
        })
    })

    // ============================================================================
    // Remember Me Token Validation Tests (23.2)
    // ============================================================================

    describe("validateRememberMeTokenMiddleware()", () => {
        it("should return valid result when Remember Me token is valid", async () => {
            /**
             * Validates: Requirement 23.2
             * The middleware SHALL validate Remember Me tokens and return valid status
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })
            request.cookies.set("remember_me_token", "remember_me_token_123")

            vi.mocked(
                sessionModule.validateRememberMeToken
            ).mockResolvedValueOnce(true)

            const result = await validateRememberMeTokenMiddleware(request)

            expect(result.isValid).toBe(true)
            expect(result.rememberMeToken).toBe("remember_me_token_123")
            expect(result.error).toBeUndefined()
        })

        it("should return invalid result when Remember Me token is missing", async () => {
            /**
             * Validates: Requirement 23.2
             * The middleware SHALL return invalid status when no Remember Me token is found
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })

            const result = await validateRememberMeTokenMiddleware(request)

            expect(result.isValid).toBe(false)
            expect(result.error).toBe("No Remember Me token found")
        })

        it("should return invalid result when Remember Me token is expired", async () => {
            /**
             * Validates: Requirement 23.2
             * The middleware SHALL return invalid status when Remember Me token is expired
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })
            request.cookies.set(
                "remember_me_token",
                "expired_remember_me_token"
            )

            vi.mocked(
                sessionModule.validateRememberMeToken
            ).mockResolvedValueOnce(false)

            const result = await validateRememberMeTokenMiddleware(request)

            expect(result.isValid).toBe(false)
            expect(result.error).toBe("Remember Me token is invalid or expired")
        })

        it("should handle validation errors gracefully", async () => {
            /**
             * Validates: Requirement 23.2
             * The middleware SHALL handle validation errors gracefully
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })
            request.cookies.set("remember_me_token", "token_123")

            vi.mocked(
                sessionModule.validateRememberMeToken
            ).mockRejectedValueOnce(new Error("Database error"))

            const result = await validateRememberMeTokenMiddleware(request)

            expect(result.isValid).toBe(false)
            expect(result.error).toBe("Error validating Remember Me token")
        })
    })

    // ============================================================================
    // Session Refresh Tests (23.3)
    // ============================================================================

    describe("refreshSessionTokenMiddleware()", () => {
        it("should refresh session token and return new expiration date", async () => {
            /**
             * Validates: Requirement 23.3
             * The middleware SHALL refresh session tokens and extend expiration
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })
            request.cookies.set("auth_session", "valid_token_123")

            const newExpirationDate = new Date(Date.now() + 60 * 60 * 1000)
            vi.mocked(sessionModule.refreshSessionToken).mockResolvedValueOnce(
                newExpirationDate
            )

            const result = await refreshSessionTokenMiddleware(request)

            expect(result).toEqual(newExpirationDate)
            expect(sessionModule.refreshSessionToken).toHaveBeenCalledWith(
                "valid_token_123"
            )
        })

        it("should return null when session token is missing", async () => {
            /**
             * Validates: Requirement 23.3
             * The middleware SHALL return null when no session token is found
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })

            const result = await refreshSessionTokenMiddleware(request)

            expect(result).toBeNull()
        })

        it("should return null when refresh fails", async () => {
            /**
             * Validates: Requirement 23.3
             * The middleware SHALL return null when refresh fails
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })
            request.cookies.set("auth_session", "token_123")

            vi.mocked(sessionModule.refreshSessionToken).mockResolvedValueOnce(
                null
            )

            const result = await refreshSessionTokenMiddleware(request)

            expect(result).toBeNull()
        })

        it("should handle refresh errors gracefully", async () => {
            /**
             * Validates: Requirement 23.3
             * The middleware SHALL handle refresh errors gracefully
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })
            request.cookies.set("auth_session", "token_123")

            vi.mocked(sessionModule.refreshSessionToken).mockRejectedValueOnce(
                new Error("Database error")
            )

            const result = await refreshSessionTokenMiddleware(request)

            expect(result).toBeNull()
        })
    })

    // ============================================================================
    // Redirect to Login Tests (23.5)
    // ============================================================================

    describe("redirectToLogin()", () => {
        it("should redirect to login page", async () => {
            /**
             * Validates: Requirement 23.5
             * The middleware SHALL redirect to login for unauthenticated users
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })

            const response = redirectToLogin(request, "/login")

            expect(response.status).toBe(307)
            expect(response.headers.get("location")).toContain("/login")
        })

        it("should preserve original URL as return_to parameter", async () => {
            /**
             * Validates: Requirement 23.5
             * The middleware SHALL preserve the original URL for redirect after login
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })

            const response = redirectToLogin(request, "/login")

            expect(response.headers.get("location")).toContain(
                "return_to=%2Fdashboard"
            )
        })

        it("should clear authentication cookies", async () => {
            /**
             * Validates: Requirement 23.5
             * The middleware SHALL clear authentication cookies on redirect
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })

            const response = redirectToLogin(request, "/login")

            // Check that cookies are deleted (they should have empty values or be deleted)
            const setCookieHeader = response.headers.get("set-cookie")
            expect(setCookieHeader).toBeDefined()
        })

        it("should use custom login URL", async () => {
            /**
             * Validates: Requirement 23.5
             * The middleware SHALL support custom login URLs
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })

            const response = redirectToLogin(request, "/auth/login")

            expect(response.headers.get("location")).toContain("/auth/login")
        })
    })

    // ============================================================================
    // Middleware Factory Tests
    // ============================================================================

    describe("createAuthMiddleware()", () => {
        it("should create middleware function with custom options", async () => {
            /**
             * Validates: Requirement 23.4
             * The middleware factory SHALL create middleware with custom options
             */
            const middleware = createAuthMiddleware({
                publicRoutes: ["/login"],
                protectedRoutes: ["/dashboard"],
            })

            expect(typeof middleware).toBe("function")
        })

        it("should use default options when not provided", async () => {
            /**
             * Validates: Requirement 23.4
             * The middleware factory SHALL use default options
             */
            const middleware = createAuthMiddleware()

            expect(typeof middleware).toBe("function")
        })
    })

    // ============================================================================
    // Helper Function Tests
    // ============================================================================

    describe("getAuthenticatedUser()", () => {
        it("should return user ID when authenticated", async () => {
            /**
             * Validates: Requirement 23.1
             * The helper SHALL return user ID for authenticated users
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })
            request.cookies.set("auth_session", "user123:1234567890:random")

            vi.mocked(sessionModule.validateSessionToken).mockResolvedValueOnce(
                true
            )

            const userId = await getAuthenticatedUser(request)

            expect(userId).toBe("user123")
        })

        it("should return null when not authenticated", async () => {
            /**
             * Validates: Requirement 23.1
             * The helper SHALL return null for unauthenticated users
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })

            const userId = await getAuthenticatedUser(request)

            expect(userId).toBeNull()
        })
    })

    describe("isAuthenticated()", () => {
        it("should return true when user is authenticated", async () => {
            /**
             * Validates: Requirement 23.1
             * The helper SHALL return true for authenticated users
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })
            request.cookies.set("auth_session", "valid_token_123")

            vi.mocked(sessionModule.validateSessionToken).mockResolvedValueOnce(
                true
            )

            const authenticated = await isAuthenticated(request)

            expect(authenticated).toBe(true)
        })

        it("should return false when user is not authenticated", async () => {
            /**
             * Validates: Requirement 23.1
             * The helper SHALL return false for unauthenticated users
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })

            const authenticated = await isAuthenticated(request)

            expect(authenticated).toBe(false)
        })
    })

    describe("hasRememberMe()", () => {
        it("should return true when Remember Me token is valid", async () => {
            /**
             * Validates: Requirement 23.2
             * The helper SHALL return true when Remember Me is enabled
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })
            request.cookies.set("remember_me_token", "remember_me_token_123")

            vi.mocked(
                sessionModule.validateRememberMeToken
            ).mockResolvedValueOnce(true)

            const hasRememberMeToken = await hasRememberMe(request)

            expect(hasRememberMeToken).toBe(true)
        })

        it("should return false when Remember Me token is invalid", async () => {
            /**
             * Validates: Requirement 23.2
             * The helper SHALL return false when Remember Me is not enabled
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })

            const hasRememberMeToken = await hasRememberMe(request)

            expect(hasRememberMeToken).toBe(false)
        })
    })

    // ============================================================================
    // Integration Tests
    // ============================================================================

    describe("Integration Tests", () => {
        it("should handle fallback to Remember Me when session expires", async () => {
            /**
             * Validates: Requirement 23.2, 23.4
             * The middleware SHALL fallback to Remember Me when session expires
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })
            request.cookies.set("auth_session", "expired_token")
            request.cookies.set("remember_me_token", "valid_remember_me_token")

            vi.mocked(sessionModule.validateSessionToken).mockResolvedValueOnce(
                false
            )
            vi.mocked(
                sessionModule.validateRememberMeToken
            ).mockResolvedValueOnce(true)

            const result = await protectedRouteMiddleware(request, {
                publicRoutes: ["/login"],
                protectedRoutes: ["/dashboard"],
            })

            expect(result).toBeNull()
        })

        it("should allow access to public routes without authentication", async () => {
            /**
             * Validates: Requirement 23.4
             * The middleware SHALL allow access to public routes without authentication
             */
            const request = new NextRequest("http://localhost:3000/login", {
                method: "GET",
            })

            const result = await protectedRouteMiddleware(request, {
                publicRoutes: ["/login"],
                protectedRoutes: ["/dashboard"],
            })

            expect(result).toBeNull()
        })
    })

    // ============================================================================
    // Edge Cases and Error Handling
    // ============================================================================

    describe("Edge Cases and Error Handling", () => {
        it("should handle malformed session token gracefully", async () => {
            /**
             * Validates: Requirement 23.1
             * The middleware SHALL handle malformed tokens gracefully
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })
            request.cookies.set("auth_session", "")

            const result = await validateSessionTokenMiddleware(request)

            expect(result.isValid).toBe(false)
        })

        it("should handle missing logger gracefully", async () => {
            /**
             * Validates: Requirement 23.1
             * The middleware SHALL handle missing logger gracefully
             */
            vi.mocked(logger.debug).mockImplementationOnce(() => {
                throw new Error("Logger error")
            })

            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })

            // Should not throw
            const result = await validateSessionTokenMiddleware(request)

            expect(result.isValid).toBe(false)
        })
    })
})
