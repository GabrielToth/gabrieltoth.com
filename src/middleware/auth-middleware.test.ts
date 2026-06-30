/**
 * Authentication Middleware Tests
 * Tests for session validation, middleware execution, and route protection
 *
 * Validates: Requirements 6.4, 6.5, 6.6
 */

import * as dbModule from "@/lib/db"
import { logger } from "@/lib/logger"
import { Session } from "@/types/auth"
import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    authMiddleware,
    getAuthenticatedUser,
    isAuthenticated,
    validateSession,
} from "./auth-middleware"

// Mock dependencies
vi.mock("@/lib/db")
vi.mock("@/lib/logger")

describe("Authentication Middleware (auth-middleware.ts)", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ============================================================================
    // Session Validation Tests (Requirement 10.2, 10.3)
    // ============================================================================

    describe("validateSession()", () => {
        it("should return session when session is valid and not expired", async () => {
            /**
             * Validates: Requirements 10.2, 10.3
             * The middleware SHALL query the sessions table and verify expiration
             */
            const mockSession: Session = {
                id: "session-123",
                user_id: "user-123",
                session_id: "session_token_abc123",
                created_at: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
            }

            vi.mocked(dbModule.db.queryOne).mockResolvedValueOnce(mockSession)

            const result = await validateSession("session_token_abc123")

            expect(result).toEqual(mockSession)
            expect(dbModule.db.queryOne).toHaveBeenCalledWith(
                expect.stringContaining("SELECT id, user_id, session_id"),
                ["session_token_abc123"]
            )
        })

        it("should return null when session is not found", async () => {
            /**
             * Validates: Requirement 10.2
             * The middleware SHALL return null when session is not found in database
             */
            vi.mocked(dbModule.db.queryOne).mockResolvedValueOnce(null)

            const result = await validateSession("nonexistent_token")

            expect(result).toBeNull()
        })

        it("should return null when session is expired", async () => {
            /**
             * Validates: Requirement 10.3
             * The middleware SHALL verify expires_at timestamp is in the future
             */
            const mockSession: Session = {
                id: "session-123",
                user_id: "user-123",
                session_id: "session_token_abc123",
                created_at: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48 hours ago
                expires_at: new Date(Date.now() - 60 * 1000), // 1 minute ago (expired)
            }

            vi.mocked(dbModule.db.queryOne).mockResolvedValueOnce(mockSession)

            const result = await validateSession("session_token_abc123")

            expect(result).toBeNull()
        })

        it("should return null when session ID is invalid", async () => {
            /**
             * Validates: Requirement 10.2
             * The middleware SHALL handle invalid session IDs gracefully
             */
            const result = await validateSession("")

            expect(result).toBeNull()
        })

        it("should return null when session ID is null", async () => {
            /**
             * Validates: Requirement 10.2
             * The middleware SHALL handle null session IDs gracefully
             */
            const result = await validateSession(null as any)

            expect(result).toBeNull()
        })

        it("should handle database errors gracefully", async () => {
            /**
             * Validates: Requirement 10.2
             * The middleware SHALL handle database errors gracefully
             */
            vi.mocked(dbModule.db.queryOne).mockRejectedValueOnce(
                new Error("Database connection failed")
            )

            await expect(
                validateSession("session_token_abc123")
            ).rejects.toThrow("Database connection failed")
        })

        it("should log when session is not found", async () => {
            /**
             * Validates: Requirement 10.2
             * The middleware SHALL log when session is not found
             */
            vi.mocked(dbModule.db.queryOne).mockResolvedValueOnce(null)

            await validateSession("session_token_abc123")

            expect(logger.debug).toHaveBeenCalledWith(
                expect.stringContaining("Session not found"),
                expect.any(Object)
            )
        })

        it("should log when session is expired", async () => {
            /**
             * Validates: Requirement 10.3
             * The middleware SHALL log when session is expired
             */
            const mockSession: Session = {
                id: "session-123",
                user_id: "user-123",
                session_id: "session_token_abc123",
                created_at: new Date(Date.now() - 48 * 60 * 60 * 1000),
                expires_at: new Date(Date.now() - 60 * 1000),
            }

            vi.mocked(dbModule.db.queryOne).mockResolvedValueOnce(mockSession)

            await validateSession("session_token_abc123")

            expect(logger.debug).toHaveBeenCalledWith(
                expect.stringContaining("Session expired"),
                expect.any(Object)
            )
        })
    })

    // ============================================================================
    // Middleware Execution Tests (Requirement 10.1, 10.4)
    // ============================================================================

    describe("authMiddleware()", () => {
        it("should return null for valid session to allow request to proceed", async () => {
            /**
             * Validates: Requirements 10.1, 10.4
             * The middleware SHALL return null for valid sessions to allow request to proceed
             */
            const mockSession: Session = {
                id: "session-123",
                user_id: "user-123",
                session_id: "session_token_abc123",
                created_at: new Date(Date.now() - 60 * 60 * 1000),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
            }

            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })
            request.cookies.set("session", "session_token_abc123")

            vi.mocked(dbModule.db.queryOne).mockResolvedValueOnce(mockSession)

            const result = await authMiddleware(request)

            expect(result).toBeNull()
        })

        it("should redirect to /auth/login with 302 status when no session cookie", async () => {
            /**
             * Validates: Requirements 10.1, 10.4
             * The middleware SHALL redirect to /auth/login with 302 status for invalid sessions
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })

            const result = await authMiddleware(request)

            expect(result).not.toBeNull()
            expect(result?.status).toBe(302)
            expect(result?.headers.get("location")).toContain("/auth/login")
        })

        it("should redirect to /auth/login with 302 status when session is invalid", async () => {
            /**
             * Validates: Requirements 10.1, 10.4
             * The middleware SHALL redirect to /auth/login with 302 status for invalid sessions
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })
            request.cookies.set("session", "invalid_token")

            vi.mocked(dbModule.db.queryOne).mockResolvedValueOnce(null)

            const result = await authMiddleware(request)

            expect(result).not.toBeNull()
            expect(result?.status).toBe(302)
            expect(result?.headers.get("location")).toContain("/auth/login")
        })

        it("should redirect to /auth/login with 302 status when session is expired", async () => {
            /**
             * Validates: Requirements 10.1, 10.4
             * The middleware SHALL redirect to /auth/login with 302 status for expired sessions
             */
            const mockSession: Session = {
                id: "session-123",
                user_id: "user-123",
                session_id: "session_token_abc123",
                created_at: new Date(Date.now() - 48 * 60 * 60 * 1000),
                expires_at: new Date(Date.now() - 60 * 1000), // Expired
            }

            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })
            request.cookies.set("session", "session_token_abc123")

            vi.mocked(dbModule.db.queryOne).mockResolvedValueOnce(mockSession)

            const result = await authMiddleware(request)

            expect(result).not.toBeNull()
            expect(result?.status).toBe(302)
            expect(result?.headers.get("location")).toContain("/auth/login")
        })

        it("should redirect to /auth/login with 302 status on database error", async () => {
            /**
             * Validates: Requirements 10.1, 10.4
             * The middleware SHALL redirect to /auth/login with 302 status on error
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })
            request.cookies.set("session", "session_token_abc123")

            vi.mocked(dbModule.db.queryOne).mockRejectedValueOnce(
                new Error("Database error")
            )

            const result = await authMiddleware(request)

            expect(result).not.toBeNull()
            expect(result?.status).toBe(302)
            expect(result?.headers.get("location")).toContain("/auth/login")
        })

        it("should log when session is valid", async () => {
            /**
             * Validates: Requirement 10.1
             * The middleware SHALL log when session is valid
             */
            const mockSession: Session = {
                id: "session-123",
                user_id: "user-123",
                session_id: "session_token_abc123",
                created_at: new Date(Date.now() - 60 * 60 * 1000),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
            }

            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })
            request.cookies.set("session", "session_token_abc123")

            vi.mocked(dbModule.db.queryOne).mockResolvedValueOnce(mockSession)

            await authMiddleware(request)

            expect(logger.debug).toHaveBeenCalledWith(
                expect.stringContaining("Session validated, allowing request"),
                expect.any(Object)
            )
        })

        it("should log when session is invalid", async () => {
            /**
             * Validates: Requirement 10.1
             * The middleware SHALL log when session is invalid
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })
            request.cookies.set("session", "invalid_token")

            vi.mocked(dbModule.db.queryOne).mockResolvedValueOnce(null)

            await authMiddleware(request)

            expect(logger.warn).toHaveBeenCalledWith(
                expect.stringContaining("Invalid or expired session"),
                expect.any(Object)
            )
        })
    })

    // ============================================================================
    // Helper Function Tests
    // ============================================================================

    describe("getAuthenticatedUser()", () => {
        it("should return user ID when session is valid", async () => {
            /**
             * Validates: Requirement 10.1
             * The helper SHALL return user ID for authenticated users
             */
            const mockSession: Session = {
                id: "session-123",
                user_id: "user-123",
                session_id: "session_token_abc123",
                created_at: new Date(Date.now() - 60 * 60 * 1000),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
            }

            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })
            request.cookies.set("session", "session_token_abc123")

            vi.mocked(dbModule.db.queryOne).mockResolvedValueOnce(mockSession)

            const userId = await getAuthenticatedUser(request)

            expect(userId).toBe("user-123")
        })

        it("should return null when no session cookie", async () => {
            /**
             * Validates: Requirement 10.1
             * The helper SHALL return null when no session is found
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })

            const userId = await getAuthenticatedUser(request)

            expect(userId).toBeNull()
        })

        it("should return null when session is invalid", async () => {
            /**
             * Validates: Requirement 10.1
             * The helper SHALL return null when session is invalid
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })
            request.cookies.set("session", "invalid_token")

            vi.mocked(dbModule.db.queryOne).mockResolvedValueOnce(null)

            const userId = await getAuthenticatedUser(request)

            expect(userId).toBeNull()
        })

        it("should handle errors gracefully", async () => {
            /**
             * Validates: Requirement 10.1
             * The helper SHALL handle errors gracefully
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })
            request.cookies.set("session", "session_token_abc123")

            vi.mocked(dbModule.db.queryOne).mockRejectedValueOnce(
                new Error("Database error")
            )

            const userId = await getAuthenticatedUser(request)

            expect(userId).toBeNull()
        })
    })

    describe("isAuthenticated()", () => {
        it("should return true when session is valid", async () => {
            /**
             * Validates: Requirement 10.1
             * The helper SHALL return true for authenticated users
             */
            const mockSession: Session = {
                id: "session-123",
                user_id: "user-123",
                session_id: "session_token_abc123",
                created_at: new Date(Date.now() - 60 * 60 * 1000),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
            }

            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })
            request.cookies.set("session", "session_token_abc123")

            vi.mocked(dbModule.db.queryOne).mockResolvedValueOnce(mockSession)

            const authenticated = await isAuthenticated(request)

            expect(authenticated).toBe(true)
        })

        it("should return false when no session cookie", async () => {
            /**
             * Validates: Requirement 10.1
             * The helper SHALL return false when no session is found
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })

            const authenticated = await isAuthenticated(request)

            expect(authenticated).toBe(false)
        })

        it("should return false when session is invalid", async () => {
            /**
             * Validates: Requirement 10.1
             * The helper SHALL return false when session is invalid
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })
            request.cookies.set("session", "invalid_token")

            vi.mocked(dbModule.db.queryOne).mockResolvedValueOnce(null)

            const authenticated = await isAuthenticated(request)

            expect(authenticated).toBe(false)
        })

        it("should return false when session is expired", async () => {
            /**
             * Validates: Requirement 10.1
             * The helper SHALL return false when session is expired
             */
            const mockSession: Session = {
                id: "session-123",
                user_id: "user-123",
                session_id: "session_token_abc123",
                created_at: new Date(Date.now() - 48 * 60 * 60 * 1000),
                expires_at: new Date(Date.now() - 60 * 1000), // Expired
            }

            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })
            request.cookies.set("session", "session_token_abc123")

            vi.mocked(dbModule.db.queryOne).mockResolvedValueOnce(mockSession)

            const authenticated = await isAuthenticated(request)

            expect(authenticated).toBe(false)
        })

        it("should handle errors gracefully", async () => {
            /**
             * Validates: Requirement 10.1
             * The helper SHALL handle errors gracefully
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })
            request.cookies.set("session", "session_token_abc123")

            vi.mocked(dbModule.db.queryOne).mockRejectedValueOnce(
                new Error("Database error")
            )

            const authenticated = await isAuthenticated(request)

            expect(authenticated).toBe(false)
        })
    })

    // ============================================================================
    // Edge Cases and Error Handling
    // ============================================================================

    describe("Edge Cases and Error Handling", () => {
        it("should handle empty session cookie value", async () => {
            /**
             * Validates: Requirement 10.1
             * The middleware SHALL handle empty session cookie values gracefully
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })
            request.cookies.set("session", "")

            const result = await authMiddleware(request)

            expect(result).not.toBeNull()
            expect(result?.status).toBe(302)
        })

        it("should handle session with exact expiration time", async () => {
            /**
             * Validates: Requirement 10.3
             * The middleware SHALL handle sessions with exact expiration time
             */
            const now = new Date()
            const mockSession: Session = {
                id: "session-123",
                user_id: "user-123",
                session_id: "session_token_abc123",
                created_at: new Date(now.getTime() - 60 * 60 * 1000),
                expires_at: now, // Exactly now (should be expired)
            }

            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })
            request.cookies.set("session", "session_token_abc123")

            vi.mocked(dbModule.db.queryOne).mockResolvedValueOnce(mockSession)

            const result = await authMiddleware(request)

            expect(result).not.toBeNull()
            expect(result?.status).toBe(302)
        })

        it("should handle session with 1 millisecond remaining", async () => {
            /**
             * Validates: Requirement 10.3
             * The middleware SHALL handle sessions with minimal time remaining
             */
            const now = new Date()
            const mockSession: Session = {
                id: "session-123",
                user_id: "user-123",
                session_id: "session_token_abc123",
                created_at: new Date(now.getTime() - 60 * 60 * 1000),
                expires_at: new Date(now.getTime() + 100), // 100ms remaining (to account for async delays)
            }

            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })
            request.cookies.set("session", "session_token_abc123")

            vi.mocked(dbModule.db.queryOne).mockResolvedValueOnce(mockSession)

            const result = await authMiddleware(request)

            expect(result).toBeNull() // Should be valid
        })
    })

    // ============================================================================
    // Integration Tests
    // ============================================================================

    describe("Integration Tests", () => {
        it("should handle complete valid session flow", async () => {
            /**
             * Validates: Requirements 10.1, 10.2, 10.3, 10.4
             * The middleware SHALL handle complete valid session flow
             */
            const mockSession: Session = {
                id: "session-123",
                user_id: "user-123",
                session_id: "session_token_abc123",
                created_at: new Date(Date.now() - 60 * 60 * 1000),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
            }

            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })
            request.cookies.set("session", "session_token_abc123")

            vi.mocked(dbModule.db.queryOne).mockResolvedValueOnce(mockSession)

            // Test middleware
            const middlewareResult = await authMiddleware(request)
            expect(middlewareResult).toBeNull()

            // Test helper functions
            vi.mocked(dbModule.db.queryOne).mockResolvedValueOnce(mockSession)
            const userId = await getAuthenticatedUser(request)
            expect(userId).toBe("user-123")

            vi.mocked(dbModule.db.queryOne).mockResolvedValueOnce(mockSession)
            const authenticated = await isAuthenticated(request)
            expect(authenticated).toBe(true)
        })

        it("should handle complete invalid session flow", async () => {
            /**
             * Validates: Requirements 10.1, 10.2, 10.3, 10.4
             * The middleware SHALL handle complete invalid session flow
             */
            const request = new NextRequest("http://localhost:3000/dashboard", {
                method: "GET",
            })
            request.cookies.set("session", "invalid_token")

            vi.mocked(dbModule.db.queryOne).mockResolvedValueOnce(null)

            // Test middleware
            const middlewareResult = await authMiddleware(request)
            expect(middlewareResult).not.toBeNull()
            expect(middlewareResult?.status).toBe(302)

            // Test helper functions
            vi.mocked(dbModule.db.queryOne).mockResolvedValueOnce(null)
            const userId = await getAuthenticatedUser(request)
            expect(userId).toBeNull()

            vi.mocked(dbModule.db.queryOne).mockResolvedValueOnce(null)
            const authenticated = await isAuthenticated(request)
            expect(authenticated).toBe(false)
        })
    })
})
