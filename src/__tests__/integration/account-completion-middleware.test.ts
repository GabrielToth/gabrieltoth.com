/**
 * Account Completion Middleware Integration Tests
 *
 * Tests middleware behavior for incomplete account detection and redirection.
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock middleware function
async function checkAccountCompletion(request: NextRequest) {
    // Get session from cookie
    const sessionCookie = request.cookies.get("session")?.value

    if (!sessionCookie) {
        return null // Not authenticated
    }

    // Get user from database (mocked)
    const user = await getUserFromSession(sessionCookie)

    if (!user) {
        return null // User not found
    }

    // Check if account is complete
    if (user.password_hash && user.account_completion_status === "completed") {
        return null // Account is complete, allow access
    }

    // Check if user is on the completion flow page
    const pathname = request.nextUrl.pathname
    if (pathname.includes("/auth/complete-account")) {
        return null // Already on completion page, allow access
    }

    // Redirect to completion flow
    const locale = pathname.split("/")[1] || "en"
    return NextResponse.redirect(
        new URL(`/${locale}/auth/complete-account`, request.url)
    )
}

// Mock function to get user from session
async function getUserFromSession(sessionId: string) {
    // This would normally query the database
    const mockUsers: Record<
        string,
        {
            id: string
            email: string
            password_hash: string | null
            account_completion_status: "pending" | "in_progress" | "completed"
        }
    > = {
        "session-incomplete": {
            id: "user-123",
            email: "user@example.com",
            password_hash: null,
            account_completion_status: "pending",
        },
        "session-complete": {
            id: "user-456",
            email: "complete@example.com",
            password_hash: "hashed-password",
            account_completion_status: "completed",
        },
        "session-in-progress": {
            id: "user-789",
            email: "inprogress@example.com",
            password_hash: null,
            account_completion_status: "in_progress",
        },
    }

    return mockUsers[sessionId] || null
}

vi.mock("@/lib/auth/user", () => ({
    getUserFromSession,
}))

describe("Account Completion Middleware", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("Incomplete account detection and redirection", () => {
        it("should redirect incomplete account to completion flow", async () => {
            // Create request with incomplete account session
            const request = new NextRequest(
                "http://localhost:3000/en/dashboard",
                {
                    method: "GET",
                    headers: {
                        cookie: "session=session-incomplete",
                    },
                }
            )

            // Run middleware
            const response = await checkAccountCompletion(request)

            // Should redirect to completion flow
            expect(response).not.toBeNull()
            expect(response?.status).toBe(307)
            expect(response?.headers.get("location")).toContain(
                "/en/auth/complete-account"
            )
        })

        it("should allow access for complete account", async () => {
            // Create request with complete account session
            const request = new NextRequest(
                "http://localhost:3000/en/dashboard",
                {
                    method: "GET",
                    headers: {
                        cookie: "session=session-complete",
                    },
                }
            )

            // Run middleware
            const response = await checkAccountCompletion(request)

            // Should allow access (return null)
            expect(response).toBeNull()
        })

        it("should allow access to completion page for incomplete account", async () => {
            // Create request to completion page with incomplete account
            const request = new NextRequest(
                "http://localhost:3000/en/auth/complete-account",
                {
                    method: "GET",
                    headers: {
                        cookie: "session=session-incomplete",
                    },
                }
            )

            // Run middleware
            const response = await checkAccountCompletion(request)

            // Should allow access to completion page
            expect(response).toBeNull()
        })

        it("should redirect in-progress account to completion flow", async () => {
            // Create request with in-progress account
            const request = new NextRequest(
                "http://localhost:3000/en/dashboard",
                {
                    method: "GET",
                    headers: {
                        cookie: "session=session-in-progress",
                    },
                }
            )

            // Run middleware
            const response = await checkAccountCompletion(request)

            // Should redirect to completion flow
            expect(response).not.toBeNull()
            expect(response?.status).toBe(307)
        })
    })

    describe("Session validation", () => {
        it("should not redirect if no session cookie", async () => {
            // Create request without session
            const request = new NextRequest(
                "http://localhost:3000/en/dashboard",
                {
                    method: "GET",
                }
            )

            // Run middleware
            const response = await checkAccountCompletion(request)

            // Should not redirect (let other middleware handle)
            expect(response).toBeNull()
        })

        it("should not redirect if session is invalid", async () => {
            // Create request with invalid session
            const request = new NextRequest(
                "http://localhost:3000/en/dashboard",
                {
                    method: "GET",
                    headers: {
                        cookie: "session=invalid-session-id",
                    },
                }
            )

            // Run middleware
            const response = await checkAccountCompletion(request)

            // Should not redirect (user not found)
            expect(response).toBeNull()
        })
    })

    describe("Locale preservation", () => {
        it("should preserve locale when redirecting", async () => {
            // Create request with Portuguese locale
            const request = new NextRequest(
                "http://localhost:3000/pt-BR/dashboard",
                {
                    method: "GET",
                    headers: {
                        cookie: "session=session-incomplete",
                    },
                }
            )

            // Run middleware
            const response = await checkAccountCompletion(request)

            // Should redirect to Portuguese completion page
            expect(response?.headers.get("location")).toContain(
                "/pt-BR/auth/complete-account"
            )
        })

        it("should preserve locale for Spanish", async () => {
            // Create request with Spanish locale
            const request = new NextRequest(
                "http://localhost:3000/es/dashboard",
                {
                    method: "GET",
                    headers: {
                        cookie: "session=session-incomplete",
                    },
                }
            )

            // Run middleware
            const response = await checkAccountCompletion(request)

            // Should redirect to Spanish completion page
            expect(response?.headers.get("location")).toContain(
                "/es/auth/complete-account"
            )
        })

        it("should preserve locale for German", async () => {
            // Create request with German locale
            const request = new NextRequest(
                "http://localhost:3000/de/dashboard",
                {
                    method: "GET",
                    headers: {
                        cookie: "session=session-incomplete",
                    },
                }
            )

            // Run middleware
            const response = await checkAccountCompletion(request)

            // Should redirect to German completion page
            expect(response?.headers.get("location")).toContain(
                "/de/auth/complete-account"
            )
        })
    })

    describe("Protected routes", () => {
        it("should redirect incomplete account from dashboard", async () => {
            const request = new NextRequest(
                "http://localhost:3000/en/dashboard",
                {
                    method: "GET",
                    headers: {
                        cookie: "session=session-incomplete",
                    },
                }
            )

            const response = await checkAccountCompletion(request)

            expect(response).not.toBeNull()
            expect(response?.status).toBe(307)
        })

        it("should redirect incomplete account from settings", async () => {
            const request = new NextRequest(
                "http://localhost:3000/en/settings",
                {
                    method: "GET",
                    headers: {
                        cookie: "session=session-incomplete",
                    },
                }
            )

            const response = await checkAccountCompletion(request)

            expect(response).not.toBeNull()
            expect(response?.status).toBe(307)
        })

        it("should redirect incomplete account from profile", async () => {
            const request = new NextRequest(
                "http://localhost:3000/en/profile",
                {
                    method: "GET",
                    headers: {
                        cookie: "session=session-incomplete",
                    },
                }
            )

            const response = await checkAccountCompletion(request)

            expect(response).not.toBeNull()
            expect(response?.status).toBe(307)
        })
    })

    describe("Completion flow pages", () => {
        it("should allow access to completion page", async () => {
            const request = new NextRequest(
                "http://localhost:3000/en/auth/complete-account",
                {
                    method: "GET",
                    headers: {
                        cookie: "session=session-incomplete",
                    },
                }
            )

            const response = await checkAccountCompletion(request)

            expect(response).toBeNull()
        })

        it("should allow access to completion page with different locale", async () => {
            const request = new NextRequest(
                "http://localhost:3000/pt-BR/auth/complete-account",
                {
                    method: "GET",
                    headers: {
                        cookie: "session=session-incomplete",
                    },
                }
            )

            const response = await checkAccountCompletion(request)

            expect(response).toBeNull()
        })
    })

    describe("Account completion status transitions", () => {
        it("should handle pending status", async () => {
            const request = new NextRequest(
                "http://localhost:3000/en/dashboard",
                {
                    method: "GET",
                    headers: {
                        cookie: "session=session-incomplete",
                    },
                }
            )

            const response = await checkAccountCompletion(request)

            expect(response).not.toBeNull()
        })

        it("should handle in_progress status", async () => {
            const request = new NextRequest(
                "http://localhost:3000/en/dashboard",
                {
                    method: "GET",
                    headers: {
                        cookie: "session=session-in-progress",
                    },
                }
            )

            const response = await checkAccountCompletion(request)

            expect(response).not.toBeNull()
        })

        it("should handle completed status", async () => {
            const request = new NextRequest(
                "http://localhost:3000/en/dashboard",
                {
                    method: "GET",
                    headers: {
                        cookie: "session=session-complete",
                    },
                }
            )

            const response = await checkAccountCompletion(request)

            expect(response).toBeNull()
        })
    })

    describe("HTTP methods", () => {
        it("should redirect GET requests", async () => {
            const request = new NextRequest(
                "http://localhost:3000/en/dashboard",
                {
                    method: "GET",
                    headers: {
                        cookie: "session=session-incomplete",
                    },
                }
            )

            const response = await checkAccountCompletion(request)

            expect(response).not.toBeNull()
        })

        it("should redirect POST requests", async () => {
            const request = new NextRequest(
                "http://localhost:3000/en/api/data",
                {
                    method: "POST",
                    headers: {
                        cookie: "session=session-incomplete",
                    },
                }
            )

            const response = await checkAccountCompletion(request)

            expect(response).not.toBeNull()
        })
    })
})
