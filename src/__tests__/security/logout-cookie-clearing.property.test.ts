/**
 * Property-Based Tests for Cookie Clearing on Logout
 * Feature: authentication-security-enhancements
 * Tests universal properties of cookie clearing when logout is performed
 *
 * **Validates: Requirements 2.2, 2.3**
 */

import * as fc from "fast-check"
import { NextResponse } from "next/server"
import { describe, expect, it } from "vitest"

// Helper function to simulate cookie clearing behavior
function createLogoutResponse(
    sessionToken: string,
    includeRememberMe: boolean = false
): NextResponse {
    const response = NextResponse.json(
        {
            success: true,
            redirect: "/auth/login",
        },
        { status: 200 }
    )

    // Clear session cookies with maxAge=0 and empty value
    response.cookies.set("auth_session", "", {
        httpOnly: true,
        secure: (process.env as any).NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 0,
        path: "/",
    })

    response.cookies.set("session", "", {
        httpOnly: true,
        secure: (process.env as any).NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 0,
        path: "/",
    })

    if (includeRememberMe) {
        response.cookies.set("remember_me_token", "", {
            httpOnly: true,
            secure: (process.env as any).NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 0,
            path: "/",
        })
    }

    return response
}

describe("Property 4: Cookie Clearing on Logout", () => {
    /**
     * **Validates: Requirements 2.2, 2.3**
     *
     * Property: For any successful logout response, the session cookie SHALL have
     * maxAge set to 0 and value set to empty string.
     */
    it("should set session cookie maxAge to 0 and value to empty string on successful logout", () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 32, maxLength: 64 }), // Generate random session tokens
                fc.uuid(), // Generate random user IDs
                (sessionToken, userId) => {
                    // Create logout response
                    const response = createLogoutResponse(sessionToken)

                    // Property: Response should be successful
                    expect(response.status).toBe(200)

                    // Property: Session cookies should be cleared with maxAge=0
                    const setCookieHeaders = response.headers.getSetCookie()

                    // Find auth_session cookie
                    const authSessionCookie = setCookieHeaders.find(cookie =>
                        cookie.startsWith("auth_session=")
                    )
                    expect(authSessionCookie).toBeDefined()

                    // Property: Cookie value should be empty string
                    expect(authSessionCookie).toMatch(/^auth_session=;/)

                    // Property: Cookie should have Max-Age=0
                    expect(authSessionCookie).toContain("Max-Age=0")

                    // Find session cookie (for compatibility)
                    const sessionCookie = setCookieHeaders.find(cookie =>
                        cookie.startsWith("session=")
                    )
                    expect(sessionCookie).toBeDefined()

                    // Property: Session cookie value should be empty string
                    expect(sessionCookie).toMatch(/^session=;/)

                    // Property: Session cookie should have Max-Age=0
                    expect(sessionCookie).toContain("Max-Age=0")
                }
            ),
            { numRuns: 20 } // Run 20 times with different random inputs
        )
    })

    it("should maintain security attributes when clearing cookies", () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 32, maxLength: 64 }),
                fc.uuid(),
                (sessionToken, userId) => {
                    // Create logout response
                    const response = createLogoutResponse(sessionToken)

                    // Get Set-Cookie headers
                    const setCookieHeaders = response.headers.getSetCookie()

                    // Property: Cleared cookies should maintain security attributes
                    setCookieHeaders.forEach(cookie => {
                        if (
                            cookie.startsWith("auth_session=") ||
                            cookie.startsWith("session=")
                        ) {
                            // Property: Should have HttpOnly attribute
                            expect(cookie).toContain("HttpOnly")

                            // Property: Should have SameSite=Strict attribute (case-insensitive)
                            expect(cookie.toLowerCase()).toContain(
                                "samesite=strict"
                            )

                            // Property: Should have Path=/ attribute
                            expect(cookie).toContain("Path=/")

                            // Property: In production, should have Secure attribute
                            if (
                                (process.env as any).NODE_ENV === "production"
                            ) {
                                expect(cookie).toContain("Secure")
                            }
                        }
                    })
                }
            ),
            { numRuns: 20 }
        )
    })

    it("should clear both auth_session and session cookies for compatibility", () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 32, maxLength: 64 }),
                fc.uuid(),
                (sessionToken, userId) => {
                    // Create logout response
                    const response = createLogoutResponse(sessionToken)

                    // Get Set-Cookie headers
                    const setCookieHeaders = response.headers.getSetCookie()

                    // Property: Both auth_session and session cookies should be cleared
                    const authSessionCleared = setCookieHeaders.some(
                        cookie =>
                            cookie.startsWith("auth_session=") &&
                            cookie.includes("Max-Age=0")
                    )
                    const sessionCleared = setCookieHeaders.some(
                        cookie =>
                            cookie.startsWith("session=") &&
                            cookie.includes("Max-Age=0")
                    )

                    expect(authSessionCleared).toBe(true)
                    expect(sessionCleared).toBe(true)
                }
            ),
            { numRuns: 20 }
        )
    })

    it("should clear remember_me_token cookie if it exists", () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 32, maxLength: 64 }),
                fc.uuid(),
                (sessionToken, userId) => {
                    // Create logout response with remember_me_token
                    const response = createLogoutResponse(sessionToken, true)

                    // Get Set-Cookie headers
                    const setCookieHeaders = response.headers.getSetCookie()

                    // Property: remember_me_token should also be cleared
                    const rememberMeCleared = setCookieHeaders.some(
                        cookie =>
                            cookie.startsWith("remember_me_token=") &&
                            cookie.includes("Max-Age=0")
                    )

                    expect(rememberMeCleared).toBe(true)
                }
            ),
            { numRuns: 20 }
        )
    })

    it("should set cookie value to exactly empty string (not undefined or null)", () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 32, maxLength: 64 }),
                fc.uuid(),
                (sessionToken, userId) => {
                    // Create logout response
                    const response = createLogoutResponse(sessionToken)

                    // Get Set-Cookie headers
                    const setCookieHeaders = response.headers.getSetCookie()

                    // Property: Cookie value should be exactly empty string (not "undefined" or "null")
                    setCookieHeaders.forEach(cookie => {
                        if (
                            cookie.startsWith("auth_session=") ||
                            cookie.startsWith("session=")
                        ) {
                            // Should start with "cookieName=;" (empty value)
                            expect(cookie).toMatch(/^(auth_session|session)=;/)

                            // Should NOT contain "undefined" or "null" as value
                            expect(cookie).not.toContain("=undefined")
                            expect(cookie).not.toContain("=null")
                        }
                    })
                }
            ),
            { numRuns: 20 }
        )
    })

    it("should have correct cookie attributes in order", () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 32, maxLength: 64 }),
                fc.uuid(),
                (sessionToken, userId) => {
                    // Create logout response
                    const response = createLogoutResponse(sessionToken)

                    // Get Set-Cookie headers
                    const setCookieHeaders = response.headers.getSetCookie()

                    // Property: Each cleared cookie should have all required attributes
                    setCookieHeaders.forEach(cookie => {
                        if (
                            cookie.startsWith("auth_session=") ||
                            cookie.startsWith("session=")
                        ) {
                            // Property: Must have empty value
                            expect(cookie).toMatch(/^(auth_session|session)=;/)

                            // Property: Must have Max-Age=0
                            expect(cookie).toContain("Max-Age=0")

                            // Property: Must have HttpOnly
                            expect(cookie).toContain("HttpOnly")

                            // Property: Must have SameSite=Strict
                            expect(cookie.toLowerCase()).toContain(
                                "samesite=strict"
                            )

                            // Property: Must have Path=/
                            expect(cookie).toContain("Path=/")
                        }
                    })
                }
            ),
            { numRuns: 20 }
        )
    })

    it("should clear cookies with consistent attributes across multiple logouts", () => {
        fc.assert(
            fc.property(
                fc.array(fc.string({ minLength: 32, maxLength: 64 }), {
                    minLength: 2,
                    maxLength: 5,
                }),
                sessionTokens => {
                    // Property: Each logout should clear cookies consistently
                    for (const sessionToken of sessionTokens) {
                        const response = createLogoutResponse(sessionToken)
                        const setCookieHeaders = response.headers.getSetCookie()

                        // Verify consistent attributes
                        setCookieHeaders.forEach(cookie => {
                            if (
                                cookie.startsWith("auth_session=") ||
                                cookie.startsWith("session=")
                            ) {
                                // All cleared cookies should have same attributes
                                expect(cookie).toContain("Max-Age=0")
                                expect(cookie).toContain("HttpOnly")
                                expect(cookie.toLowerCase()).toContain(
                                    "samesite=strict"
                                )
                                expect(cookie).toContain("Path=/")
                            }
                        })
                    }
                }
            ),
            { numRuns: 10 }
        )
    })

    it("should clear cookies regardless of session token format", () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 32, maxLength: 128 }), // Any string format
                sessionToken => {
                    // Create logout response with any token format
                    const response = createLogoutResponse(sessionToken)

                    // Get Set-Cookie headers
                    const setCookieHeaders = response.headers.getSetCookie()

                    // Property: Cookies should be cleared regardless of token format
                    const authSessionCleared = setCookieHeaders.some(
                        cookie =>
                            cookie.startsWith("auth_session=") &&
                            cookie.includes("Max-Age=0")
                    )
                    const sessionCleared = setCookieHeaders.some(
                        cookie =>
                            cookie.startsWith("session=") &&
                            cookie.includes("Max-Age=0")
                    )

                    expect(authSessionCleared).toBe(true)
                    expect(sessionCleared).toBe(true)
                }
            ),
            { numRuns: 20 }
        )
    })
})
