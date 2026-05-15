/**
 * Property-Based Test: Cookie Clearing on Logout
 * Tests that session cookies are properly cleared on logout
 *
 * **Validates: Requirements 2.2, 2.3**
 *
 * Property 4: Cookie Clearing on Logout
 * For any successful logout response, the session cookie SHALL have maxAge set to 0
 * and value set to empty string.
 *
 * This test uses property-based testing to verify that:
 * 1. Session cookies are cleared with maxAge=0
 * 2. Session cookie values are set to empty string
 * 3. Security attributes are maintained (httpOnly, secure, sameSite, path)
 * 4. All authentication cookies are cleared (auth_session, session, remember_me_token)
 */

import { it } from "@fast-check/vitest"
import * as fc from "fast-check"
import { NextRequest } from "next/server"
import { beforeEach, describe, expect, vi } from "vitest"

// Mock dependencies BEFORE importing the module under test
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

// Import after mocks
import { POST } from "@/app/api/auth/logout/route"
import { removeSession, validateSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { validateCsrfToken } from "@/lib/middleware/csrf-protection"

describe("Property 4: Cookie Clearing on Logout", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    /**
     * Property Test: Session Cookie Clearing
     *
     * For any valid session token and CSRF token, when a logout request is made,
     * the response SHALL clear the session cookie with maxAge=0 and empty value.
     *
     * Validates: Requirements 2.2, 2.3
     */
    it.prop(
        [
            fc.uuid(),
            fc.uuid(),
            fc.emailAddress(),
            fc.string({ minLength: 32, maxLength: 64 }),
        ],
        async (
            userId: string,
            sessionId: string,
            userEmail: string,
            csrfToken: string
        ) => {
            /**
             * Arrange: Set up valid session and CSRF token
             */
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

            /**
             * Act: Make logout request
             */
            const request = new NextRequest(
                "http://localhost:3000/api/auth/logout",
                {
                    method: "POST",
                    headers: {
                        cookie: `session=${sessionId}`,
                        "X-CSRF-Token": csrfToken,
                    },
                }
            )

            const response = await POST(request)

            /**
             * Assert: Verify cookie clearing
             */
            // Response should be successful
            expect(response.status).toBe(200)
            const data = await response.json()
            expect(data.success).toBe(true)

            // Get all Set-Cookie headers
            const setCookieHeaders = response.headers.getSetCookie()

            // Find session cookie headers
            const sessionCookieHeaders = setCookieHeaders.filter(
                (header: string) =>
                    header.includes("session=") ||
                    header.includes("auth_session=")
            )

            // Verify at least one session cookie is cleared
            expect(sessionCookieHeaders.length).toBeGreaterThan(0)

            // Verify each session cookie is cleared properly
            sessionCookieHeaders.forEach((header: string) => {
                // Cookie value should be empty (after the = sign, before the first semicolon)
                const cookieValueMatch = header.match(/^[^=]+=([^;]*)/)
                if (cookieValueMatch) {
                    const cookieValue = cookieValueMatch[1]
                    expect(cookieValue).toBe("")
                }

                // maxAge should be 0
                expect(header).toContain("Max-Age=0")

                // Security attributes should be maintained
                expect(header).toContain("HttpOnly")
                expect(header).toContain("SameSite=strict")
                expect(header).toContain("Path=/")
            })
        }
    )

    /**
     * Property Test: All Authentication Cookies Cleared
     *
     * For any successful logout, all authentication cookies (auth_session, session,
     * remember_me_token) SHALL be cleared with maxAge=0 and empty value.
     *
     * Validates: Requirements 2.2, 2.3
     */
    it.prop(
        [
            fc.uuid(),
            fc.uuid(),
            fc.emailAddress(),
            fc.string({ minLength: 32, maxLength: 64 }),
        ],
        async (
            userId: string,
            sessionId: string,
            userEmail: string,
            csrfToken: string
        ) => {
            /**
             * Arrange: Set up valid session
             */
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

            /**
             * Act: Make logout request
             */
            const request = new NextRequest(
                "http://localhost:3000/api/auth/logout",
                {
                    method: "POST",
                    headers: {
                        cookie: `session=${sessionId}`,
                        "X-CSRF-Token": csrfToken,
                    },
                }
            )

            const response = await POST(request)

            /**
             * Assert: Verify all auth cookies are cleared
             */
            expect(response.status).toBe(200)

            const setCookieHeaders = response.headers.getSetCookie()

            // Check for auth_session cookie
            const authSessionCookie = setCookieHeaders.find((header: string) =>
                header.includes("auth_session=")
            )
            if (authSessionCookie) {
                expect(authSessionCookie).toContain("Max-Age=0")
                expect(authSessionCookie).toContain("HttpOnly")
            }

            // Check for session cookie
            const sessionCookie = setCookieHeaders.find((header: string) =>
                header.includes("session=")
            )
            if (sessionCookie) {
                expect(sessionCookie).toContain("Max-Age=0")
                expect(sessionCookie).toContain("HttpOnly")
            }

            // Check for remember_me_token cookie
            const rememberMeCookie = setCookieHeaders.find((header: string) =>
                header.includes("remember_me_token=")
            )
            if (rememberMeCookie) {
                expect(rememberMeCookie).toContain("Max-Age=0")
                expect(rememberMeCookie).toContain("HttpOnly")
            }
        }
    )

    /**
     * Property Test: Cookie Security Attributes Maintained
     *
     * For any cleared session cookie, the security attributes (httpOnly, secure,
     * sameSite, path) SHALL be maintained as they were on the original cookie.
     *
     * Validates: Requirements 2.2, 2.3, 9.1, 9.3, 9.4, 9.5
     */
    it.prop(
        [
            fc.uuid(),
            fc.uuid(),
            fc.emailAddress(),
            fc.string({ minLength: 32, maxLength: 64 }),
        ],
        async (
            userId: string,
            sessionId: string,
            userEmail: string,
            csrfToken: string
        ) => {
            /**
             * Arrange: Set up valid session
             */
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

            /**
             * Act: Make logout request
             */
            const request = new NextRequest(
                "http://localhost:3000/api/auth/logout",
                {
                    method: "POST",
                    headers: {
                        cookie: `session=${sessionId}`,
                        "X-CSRF-Token": csrfToken,
                    },
                }
            )

            const response = await POST(request)

            /**
             * Assert: Verify security attributes are maintained
             */
            expect(response.status).toBe(200)

            const setCookieHeaders = response.headers.getSetCookie()

            // Verify all cleared cookies have security attributes
            setCookieHeaders.forEach((header: string) => {
                if (
                    header.includes("session=") ||
                    header.includes("auth_session=") ||
                    header.includes("remember_me_token=")
                ) {
                    // httpOnly must be present
                    expect(header).toContain("HttpOnly")

                    // sameSite must be strict
                    expect(header).toContain("SameSite=strict")

                    // path must be /
                    expect(header).toContain("Path=/")

                    // maxAge must be 0
                    expect(header).toContain("Max-Age=0")
                }
            })
        }
    )

    /**
     * Property Test: Cookie Value is Empty String
     *
     * For any cleared session cookie, the cookie value SHALL be an empty string.
     *
     * Validates: Requirements 2.3
     */
    it.prop(
        [
            fc.uuid(),
            fc.uuid(),
            fc.emailAddress(),
            fc.string({ minLength: 32, maxLength: 64 }),
        ],
        async (
            userId: string,
            sessionId: string,
            userEmail: string,
            csrfToken: string
        ) => {
            /**
             * Arrange: Set up valid session
             */
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

            /**
             * Act: Make logout request
             */
            const request = new NextRequest(
                "http://localhost:3000/api/auth/logout",
                {
                    method: "POST",
                    headers: {
                        cookie: `session=${sessionId}`,
                        "X-CSRF-Token": csrfToken,
                    },
                }
            )

            const response = await POST(request)

            /**
             * Assert: Verify cookie values are empty
             */
            expect(response.status).toBe(200)

            const setCookieHeaders = response.headers.getSetCookie()

            // Check each authentication cookie
            const authCookies = setCookieHeaders.filter(
                (header: string) =>
                    header.includes("session=") ||
                    header.includes("auth_session=") ||
                    header.includes("remember_me_token=")
            )

            authCookies.forEach((header: string) => {
                // Extract cookie value (between = and first ;)
                const match = header.match(/^[^=]+=([^;]*)/)
                if (match) {
                    const value = match[1]
                    // Value should be empty string
                    expect(value).toBe("")
                }
            })
        }
    )

    /**
     * Property Test: MaxAge is Zero
     *
     * For any cleared session cookie, the maxAge attribute SHALL be set to 0.
     *
     * Validates: Requirements 2.2
     */
    it.prop(
        [
            fc.uuid(),
            fc.uuid(),
            fc.emailAddress(),
            fc.string({ minLength: 32, maxLength: 64 }),
        ],
        async (
            userId: string,
            sessionId: string,
            userEmail: string,
            csrfToken: string
        ) => {
            /**
             * Arrange: Set up valid session
             */
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

            /**
             * Act: Make logout request
             */
            const request = new NextRequest(
                "http://localhost:3000/api/auth/logout",
                {
                    method: "POST",
                    headers: {
                        cookie: `session=${sessionId}`,
                        "X-CSRF-Token": csrfToken,
                    },
                }
            )

            const response = await POST(request)

            /**
             * Assert: Verify maxAge is 0
             */
            expect(response.status).toBe(200)

            const setCookieHeaders = response.headers.getSetCookie()

            // Check each authentication cookie
            const authCookies = setCookieHeaders.filter(
                (header: string) =>
                    header.includes("session=") ||
                    header.includes("auth_session=") ||
                    header.includes("remember_me_token=")
            )

            authCookies.forEach((header: string) => {
                // maxAge must be exactly 0
                expect(header).toContain("Max-Age=0")

                // Verify it's not any other number
                const maxAgeMatch = header.match(/Max-Age=(\d+)/)
                if (maxAgeMatch) {
                    expect(parseInt(maxAgeMatch[1])).toBe(0)
                }
            })
        }
    )

    /**
     * Property Test: Successful Logout Response
     *
     * For any valid session and CSRF token, the logout response SHALL be successful
     * (status 200) with success=true and include redirect instruction.
     *
     * Validates: Requirements 2.2, 2.3, 3.1
     */
    it.prop(
        [
            fc.uuid(),
            fc.uuid(),
            fc.emailAddress(),
            fc.string({ minLength: 32, maxLength: 64 }),
        ],
        async (
            userId: string,
            sessionId: string,
            userEmail: string,
            csrfToken: string
        ) => {
            /**
             * Arrange: Set up valid session
             */
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

            /**
             * Act: Make logout request
             */
            const request = new NextRequest(
                "http://localhost:3000/api/auth/logout",
                {
                    method: "POST",
                    headers: {
                        cookie: `session=${sessionId}`,
                        "X-CSRF-Token": csrfToken,
                    },
                }
            )

            const response = await POST(request)

            /**
             * Assert: Verify successful response
             */
            expect(response.status).toBe(200)

            const data = await response.json()
            expect(data.success).toBe(true)
            expect(data.redirect).toBe("/auth/login")
        }
    )
})
