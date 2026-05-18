/**
 * Property-Based Test: Logout Redirect Instruction
 *
 * **Validates: Requirements 3.1**
 *
 * Property 7: Logout Redirect Instruction
 * For any successful logout response, the response body SHALL include a redirect
 * instruction to /auth/login.
 *
 * This test uses property-based testing to verify that:
 * 1. Successful logout responses always include a redirect field
 * 2. The redirect field always points to /auth/login
 * 3. The redirect instruction is present regardless of user ID or session details
 * 4. The response structure is consistent across all successful logouts
 * 5. The redirect instruction is properly formatted and accessible
 */

import { POST } from "@/app/api/auth/logout/route"
import { logAuditEvent } from "@/lib/auth/audit-logging"
import { removeSession, validateSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { validateCsrfToken } from "@/lib/middleware/csrf-protection"
import { fc, test } from "@fast-check/vitest"
import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock dependencies
vi.mock("@/lib/auth/audit-logging", () => ({
    logAuditEvent: vi.fn(),
}))

vi.mock("@/lib/auth/session", () => ({
    removeSession: vi.fn(),
    validateSession: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
    db: {
        queryOne: vi.fn(),
    },
}))

vi.mock("@/lib/logger", () => ({
    logger: {
        error: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
    },
}))

vi.mock("@/lib/middleware/security-headers", () => ({
    getClientIp: vi.fn(() => "192.168.1.1"),
    getSecurityHeaders: vi.fn(() => ({})),
}))

vi.mock("@/lib/middleware/csrf-protection", () => ({
    validateCsrfToken: vi.fn(),
}))

describe("Property 7: Logout Redirect Instruction", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test.prop([
        fc.uuid(),
        fc.uuid(),
        fc.emailAddress(),
        fc.integer({ min: 60 * 60 * 1000, max: 30 * 24 * 60 * 60 * 1000 }),
    ])(
        "should include redirect to /auth/login in successful logout response",
        async (sessionId: string, userId: string, userEmail: string, futureTimeMs: number) => {
            const futureDate = new Date(Date.now() + futureTimeMs)

            /**
             * **Validates: Requirements 3.1**
             *
             * For any successful logout response, the response body SHALL include
             * a redirect instruction to /auth/login.
             *
             * This property tests that:
             * 1. A successful logout response contains a redirect field
             * 2. The redirect field value is exactly "/auth/login"
             * 3. The response status is 200 (success)
             * 4. The success flag is true
             */

            // Setup mocks for successful logout
            ;(validateCsrfToken as any).mockReturnValueOnce(true)
            ;(validateSession as any).mockResolvedValueOnce({
                id: sessionId,
                user_id: userId,
                session_id: sessionId,
                created_at: new Date(),
                expires_at: futureDate,
            })
            ;(db.queryOne as any).mockResolvedValueOnce({
                google_email: userEmail,
                email: userEmail,
            })
            ;(removeSession as any).mockResolvedValueOnce(true)
            ;(logAuditEvent as any).mockResolvedValueOnce(undefined)

            // Create request with valid session and CSRF token
            const request = new NextRequest(
                "http://localhost:3000/api/auth/logout",
                {
                    method: "POST",
                    headers: {
                        cookie: `session=${sessionId}`,
                        "X-CSRF-Token": "valid-csrf-token",
                    },
                }
            )

            // Execute logout
            const response = await POST(request)
            const data = await response.json()

            // Assert redirect instruction is present
            expect(data).toHaveProperty("redirect")
            expect(data.redirect).toBe("/auth/login")
            expect(response.status).toBe(200)
            expect(data.success).toBe(true)
        }
    )

    test.prop([
        fc.uuid(),
        fc.uuid(),
        fc.emailAddress(),
        fc.integer({ min: 60 * 60 * 1000, max: 30 * 24 * 60 * 60 * 1000 }),
        fc.integer({ min: 1, max: 100 }),
    ])(
        "should consistently include redirect instruction across multiple logout attempts",
        async (sessionId: string, userId: string, userEmail: string, futureTimeMs: number, attemptCount: number) => {
            const futureDate = new Date(Date.now() + futureTimeMs)

            /**
             * **Validates: Requirements 3.1**
             *
             * For any successful logout response, the response body SHALL include
             * a redirect instruction to /auth/login consistently across multiple attempts.
             *
             * This property tests that:
             * 1. Multiple successful logouts all include the redirect instruction
             * 2. The redirect instruction is always "/auth/login"
             * 3. The response structure is consistent
             */

            const redirects: string[] = []

            for (let i = 0; i < Math.min(attemptCount, 5); i++) {
                // Reset mocks for each attempt
                ;(validateCsrfToken as any).mockReturnValueOnce(true)
                ;(validateSession as any).mockResolvedValueOnce({
                    id: sessionId,
                    user_id: userId,
                    session_id: sessionId,
                    created_at: new Date(),
                    expires_at: futureDate,
                })
                ;(db.queryOne as any).mockResolvedValueOnce({
                    google_email: userEmail,
                    email: userEmail,
                })
                ;(removeSession as any).mockResolvedValueOnce(true)
                ;(logAuditEvent as any).mockResolvedValueOnce(undefined)

                const request = new NextRequest(
                    "http://localhost:3000/api/auth/logout",
                    {
                        method: "POST",
                        headers: {
                            cookie: `session=${sessionId}`,
                            "X-CSRF-Token": "valid-csrf-token",
                        },
                    }
                )

                const response = await POST(request)
                const data = await response.json()

                redirects.push(data.redirect)
            }

            // Assert all redirects are consistent
            redirects.forEach(redirect => {
                expect(redirect).toBe("/auth/login")
            })

            // Assert all redirects are identical
            const allIdentical = redirects.every(r => r === "/auth/login")
            expect(allIdentical).toBe(true)
        }
    )

    test.prop([
        fc.uuid(),
        fc.uuid(),
        fc.emailAddress(),
        fc.integer({ min: 60 * 60 * 1000, max: 30 * 24 * 60 * 60 * 1000 }),
    ])(
        "should include redirect instruction regardless of user details",
        async (sessionId: string, userId: string, userEmail: string, futureTimeMs: number) => {
            const futureDate = new Date(Date.now() + futureTimeMs)

            /**
             * **Validates: Requirements 3.1**
             *
             * For any successful logout response, the response body SHALL include
             * a redirect instruction to /auth/login regardless of user details.
             *
             * This property tests that:
             * 1. The redirect instruction is independent of user ID
             * 2. The redirect instruction is independent of user email
             * 3. The redirect instruction is independent of session details
             * 4. All users are redirected to the same location
             */

            // Setup mocks
            ;(validateCsrfToken as any).mockReturnValueOnce(true)
            ;(validateSession as any).mockResolvedValueOnce({
                id: sessionId,
                user_id: userId,
                session_id: sessionId,
                created_at: new Date(),
                expires_at: futureDate,
            })
            ;(db.queryOne as any).mockResolvedValueOnce({
                google_email: userEmail,
                email: userEmail,
            })
            ;(removeSession as any).mockResolvedValueOnce(true)
            ;(logAuditEvent as any).mockResolvedValueOnce(undefined)

            const request = new NextRequest(
                "http://localhost:3000/api/auth/logout",
                {
                    method: "POST",
                    headers: {
                        cookie: `session=${sessionId}`,
                        "X-CSRF-Token": "valid-csrf-token",
                    },
                }
            )

            const response = await POST(request)
            const data = await response.json()

            // Assert redirect is always the same regardless of user details
            expect(data.redirect).toBe("/auth/login")
            expect(data.redirect).not.toContain(userId)
            expect(data.redirect).not.toContain(userEmail)
            expect(data.redirect).not.toContain(sessionId)
        }
    )

    test.prop([
        fc.uuid(),
        fc.uuid(),
        fc.emailAddress(),
        fc.integer({ min: 60 * 60 * 1000, max: 30 * 24 * 60 * 60 * 1000 }),
    ])(
        "should have properly formatted redirect instruction",
        async (sessionId: string, userId: string, userEmail: string, futureTimeMs: number) => {
            const futureDate = new Date(Date.now() + futureTimeMs)

            /**
             * **Validates: Requirements 3.1**
             *
             * For any successful logout response, the redirect instruction
             * SHALL be properly formatted and accessible.
             *
             * This property tests that:
             * 1. The redirect field is a string
             * 2. The redirect starts with "/"
             * 3. The redirect contains only valid URL characters
             * 4. The redirect is not empty or null
             */

            // Setup mocks
            ;(validateCsrfToken as any).mockReturnValueOnce(true)
            ;(validateSession as any).mockResolvedValueOnce({
                id: sessionId,
                user_id: userId,
                session_id: sessionId,
                created_at: new Date(),
                expires_at: futureDate,
            })
            ;(db.queryOne as any).mockResolvedValueOnce({
                google_email: userEmail,
                email: userEmail,
            })
            ;(removeSession as any).mockResolvedValueOnce(true)
            ;(logAuditEvent as any).mockResolvedValueOnce(undefined)

            const request = new NextRequest(
                "http://localhost:3000/api/auth/logout",
                {
                    method: "POST",
                    headers: {
                        cookie: `session=${sessionId}`,
                        "X-CSRF-Token": "valid-csrf-token",
                    },
                }
            )

            const response = await POST(request)
            const data = await response.json()

            // Assert redirect is properly formatted
            expect(typeof data.redirect).toBe("string")
            expect(data.redirect).not.toBe("")
            expect(data.redirect).not.toBeNull()
            expect(data.redirect).toMatch(/^\/[a-zA-Z0-9/_-]*$/)
            expect(data.redirect[0]).toBe("/")
        }
    )

    test.prop([
        fc.uuid(),
        fc.uuid(),
        fc.emailAddress(),
        fc.integer({ min: 60 * 60 * 1000, max: 30 * 24 * 60 * 60 * 1000 }),
    ])(
        "should include redirect in response body with success flag",
        async (sessionId: string, userId: string, userEmail: string, futureTimeMs: number) => {
            const futureDate = new Date(Date.now() + futureTimeMs)

            /**
             * **Validates: Requirements 3.1**
             *
             * For any successful logout response, the response body SHALL include
             * both a redirect instruction and a success flag.
             *
             * This property tests that:
             * 1. The response contains both redirect and success fields
             * 2. The success flag is true
             * 3. The response is valid JSON
             * 4. The response structure is consistent
             */

            // Setup mocks
            ;(validateCsrfToken as any).mockReturnValueOnce(true)
            ;(validateSession as any).mockResolvedValueOnce({
                id: sessionId,
                user_id: userId,
                session_id: sessionId,
                created_at: new Date(),
                expires_at: futureDate,
            })
            ;(db.queryOne as any).mockResolvedValueOnce({
                google_email: userEmail,
                email: userEmail,
            })
            ;(removeSession as any).mockResolvedValueOnce(true)
            ;(logAuditEvent as any).mockResolvedValueOnce(undefined)

            const request = new NextRequest(
                "http://localhost:3000/api/auth/logout",
                {
                    method: "POST",
                    headers: {
                        cookie: `session=${sessionId}`,
                        "X-CSRF-Token": "valid-csrf-token",
                    },
                }
            )

            const response = await POST(request)
            const data = await response.json()

            // Assert response structure
            expect(data).toHaveProperty("success")
            expect(data).toHaveProperty("redirect")
            expect(data.success).toBe(true)
            expect(data.redirect).toBe("/auth/login")

            // Assert response is valid JSON
            expect(typeof data).toBe("object")
            expect(data).not.toBeNull()
        }
    )

    describe("Unit Tests for Logout Redirect Instruction", () => {
        it("should return redirect to /auth/login on successful logout", async () => {
            /**
             * **Validates: Requirements 3.1**
             *
             * When a logout request is successful, the response SHALL include
             * a redirect instruction to /auth/login.
             */
            const sessionId = "session-123"
            const userId = "user-123"
            const userEmail = "user@example.com"

            // Setup mocks
            ;(validateCsrfToken as any).mockReturnValueOnce(true)
            ;(validateSession as any).mockResolvedValueOnce({
                id: sessionId,
                user_id: userId,
                session_id: sessionId,
                created_at: new Date(),
                expires_at: new Date(Date.now() + 86400000),
            })
            ;(db.queryOne as any).mockResolvedValueOnce({
                google_email: userEmail,
                email: userEmail,
            })
            ;(removeSession as any).mockResolvedValueOnce(true)
            ;(logAuditEvent as any).mockResolvedValueOnce(undefined)

            const request = new NextRequest(
                "http://localhost:3000/api/auth/logout",
                {
                    method: "POST",
                    headers: {
                        cookie: `session=${sessionId}`,
                        "X-CSRF-Token": "valid-csrf-token",
                    },
                }
            )

            const response = await POST(request)
            const data = await response.json()

            expect(data.redirect).toBe("/auth/login")
            expect(response.status).toBe(200)
        })

        it("should include redirect field in response body", async () => {
            /**
             * **Validates: Requirements 3.1**
             *
             * When a logout request is successful, the response body SHALL
             * contain a redirect field.
             */
            const sessionId = "session-456"
            const userId = "user-456"
            const userEmail = "user456@example.com"

            // Setup mocks
            ;(validateCsrfToken as any).mockReturnValueOnce(true)
            ;(validateSession as any).mockResolvedValueOnce({
                id: sessionId,
                user_id: userId,
                session_id: sessionId,
                created_at: new Date(),
                expires_at: new Date(Date.now() + 86400000),
            })
            ;(db.queryOne as any).mockResolvedValueOnce({
                google_email: userEmail,
                email: userEmail,
            })
            ;(removeSession as any).mockResolvedValueOnce(true)
            ;(logAuditEvent as any).mockResolvedValueOnce(undefined)

            const request = new NextRequest(
                "http://localhost:3000/api/auth/logout",
                {
                    method: "POST",
                    headers: {
                        cookie: `session=${sessionId}`,
                        "X-CSRF-Token": "valid-csrf-token",
                    },
                }
            )

            const response = await POST(request)
            const data = await response.json()

            expect(data).toHaveProperty("redirect")
            expect(typeof data.redirect).toBe("string")
        })

        it("should have redirect value exactly equal to /auth/login", async () => {
            /**
             * **Validates: Requirements 3.1**
             *
             * When a logout request is successful, the redirect field value
             * SHALL be exactly "/auth/login".
             */
            const sessionId = "session-789"
            const userId = "user-789"
            const userEmail = "user789@example.com"

            // Setup mocks
            ;(validateCsrfToken as any).mockReturnValueOnce(true)
            ;(validateSession as any).mockResolvedValueOnce({
                id: sessionId,
                user_id: userId,
                session_id: sessionId,
                created_at: new Date(),
                expires_at: new Date(Date.now() + 86400000),
            })
            ;(db.queryOne as any).mockResolvedValueOnce({
                google_email: userEmail,
                email: userEmail,
            })
            ;(removeSession as any).mockResolvedValueOnce(true)
            ;(logAuditEvent as any).mockResolvedValueOnce(undefined)

            const request = new NextRequest(
                "http://localhost:3000/api/auth/logout",
                {
                    method: "POST",
                    headers: {
                        cookie: `session=${sessionId}`,
                        "X-CSRF-Token": "valid-csrf-token",
                    },
                }
            )

            const response = await POST(request)
            const data = await response.json()

            expect(data.redirect).toEqual("/auth/login")
            expect(data.redirect).not.toEqual("/auth/login/")
            expect(data.redirect).not.toEqual("/auth/login?redirect=")
        })

        it("should include redirect even when audit logging fails", async () => {
            /**
             * **Validates: Requirements 3.1**
             *
             * When a logout request is successful but audit logging fails,
             * the response SHALL still include the redirect instruction.
             */
            const sessionId = "session-audit-fail"
            const userId = "user-audit-fail"
            const userEmail = "user-audit-fail@example.com"

            // Setup mocks with audit logging failure
            ;(validateCsrfToken as any).mockReturnValueOnce(true)
            ;(validateSession as any).mockResolvedValueOnce({
                id: sessionId,
                user_id: userId,
                session_id: sessionId,
                created_at: new Date(),
                expires_at: new Date(Date.now() + 86400000),
            })
            ;(db.queryOne as any).mockResolvedValueOnce({
                google_email: userEmail,
                email: userEmail,
            })
            ;(removeSession as any).mockResolvedValueOnce(true)
            ;(logAuditEvent as any).mockRejectedValueOnce(
                new Error("Audit log failed")
            )

            const request = new NextRequest(
                "http://localhost:3000/api/auth/logout",
                {
                    method: "POST",
                    headers: {
                        cookie: `session=${sessionId}`,
                        "X-CSRF-Token": "valid-csrf-token",
                    },
                }
            )

            const response = await POST(request)
            const data = await response.json()

            // Should still include redirect even if audit logging fails
            expect(data.redirect).toBe("/auth/login")
            expect(response.status).toBe(200)
        })

        it("should include redirect even when session removal fails", async () => {
            /**
             * **Validates: Requirements 3.1**
             *
             * When a logout request is successful but session removal fails,
             * the response SHALL still include the redirect instruction.
             */
            const sessionId = "session-removal-fail"
            const userId = "user-removal-fail"
            const userEmail = "user-removal-fail@example.com"

            // Setup mocks with session removal failure
            ;(validateCsrfToken as any).mockReturnValueOnce(true)
            ;(validateSession as any).mockResolvedValueOnce({
                id: sessionId,
                user_id: userId,
                session_id: sessionId,
                created_at: new Date(),
                expires_at: new Date(Date.now() + 86400000),
            })
            ;(db.queryOne as any).mockResolvedValueOnce({
                google_email: userEmail,
                email: userEmail,
            })
            ;(removeSession as any).mockRejectedValueOnce(
                new Error("Session removal failed")
            )
            ;(logAuditEvent as any).mockResolvedValueOnce(undefined)

            const request = new NextRequest(
                "http://localhost:3000/api/auth/logout",
                {
                    method: "POST",
                    headers: {
                        cookie: `session=${sessionId}`,
                        "X-CSRF-Token": "valid-csrf-token",
                    },
                }
            )

            const response = await POST(request)
            const data = await response.json()

            // Should still include redirect even if session removal fails
            expect(data.redirect).toBe("/auth/login")
            expect(response.status).toBe(200)
        })
    })
})
