/**
 * Property-Based Tests for Logout Rate Limiting
 * Feature: authentication-security-enhancements
 * Tests universal properties of rate limiting enforcement for logout endpoint
 *
 * **Validates: Requirements 1.2, 1.3**
 */

import fc from "fast-check"
import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock the validateSession function
vi.mock("@/lib/middleware/auth-middleware", () => ({
    validateSession: vi.fn(),
}))

// Mock the checkAccountCompletion function
vi.mock("@/lib/middleware/account-completion", () => ({
    checkAccountCompletion: vi.fn().mockResolvedValue(null),
}))

// Import proxy after mocks
const { proxy } = await import("../../../proxy")

describe("Property 1: Rate Limit Enforcement", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Clear the rate limit store between tests
        // This is done by waiting for the time window to expire or by reloading the module
    })

    /**
     * **Validates: Requirements 1.2, 1.3**
     *
     * Property: For any user identifier and 60-second time window, when the user makes
     * more than 5 logout requests, the 6th and subsequent requests SHALL be rejected
     * with HTTP status 429 until the window expires.
     */
    it("should reject 6th logout request within 60 seconds with 429 status", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.ipV4(), // Generate random IP addresses
                fc.string({ minLength: 10, maxLength: 64 }), // Generate random session tokens
                async (ip, sessionToken) => {
                    // Create 6 logout requests with the same IP
                    const requests: NextRequest[] = []
                    for (let i = 0; i < 6; i++) {
                        const request = new NextRequest(
                            "http://localhost:3000/api/auth/logout",
                            {
                                method: "POST",
                                headers: {
                                    "x-forwarded-for": ip,
                                },
                            }
                        )

                        // Set session cookie
                        Object.defineProperty(request, "cookies", {
                            value: {
                                get: (name: string) => {
                                    if (name === "session") {
                                        return { value: sessionToken }
                                    }
                                    return undefined
                                },
                            },
                            writable: false,
                        })

                        requests.push(request)
                    }

                    // Execute first 5 requests - should all pass rate limiting
                    for (let i = 0; i < 5; i++) {
                        const response = await proxy(requests[i])

                        // Property: First 5 requests should NOT be rate limited
                        // They should either pass through (200) or fail for other reasons (not 429)
                        expect(response.status).not.toBe(429)
                    }

                    // Execute 6th request - should be rate limited
                    const sixthResponse = await proxy(requests[5])

                    // Property: 6th request MUST be rejected with 429
                    expect(sixthResponse.status).toBe(429)

                    // Property: Response should contain rate limit error message
                    const data = await sixthResponse.json()
                    expect(data.error).toBe(
                        "Too many logout attempts. Please try again later."
                    )
                }
            ),
            { numRuns: 10 } // Reduced runs since rate limiting is stateful
        )
    }, 30000) // 30 second timeout

    it("should enforce rate limit per user identifier (IP-based)", async () => {
        await fc.assert(
            fc.asyncProperty(fc.ipV4(), fc.ipV4(), async (ip1, ip2) => {
                // Skip if IPs are the same
                fc.pre(ip1 !== ip2)

                // Make 5 requests from IP1
                for (let i = 0; i < 5; i++) {
                    const request = new NextRequest(
                        "http://localhost:3000/api/auth/logout",
                        {
                            method: "POST",
                            headers: {
                                "x-forwarded-for": ip1,
                            },
                        }
                    )

                    const response = await proxy(request)
                    expect(response.status).not.toBe(429)
                }

                // 6th request from IP1 should be rate limited
                const ip1SixthRequest = new NextRequest(
                    "http://localhost:3000/api/auth/logout",
                    {
                        method: "POST",
                        headers: {
                            "x-forwarded-for": ip1,
                        },
                    }
                )
                const ip1SixthResponse = await proxy(ip1SixthRequest)
                expect(ip1SixthResponse.status).toBe(429)

                // Property: First request from IP2 should NOT be rate limited
                // (different user identifier)
                const ip2FirstRequest = new NextRequest(
                    "http://localhost:3000/api/auth/logout",
                    {
                        method: "POST",
                        headers: {
                            "x-forwarded-for": ip2,
                        },
                    }
                )
                const ip2FirstResponse = await proxy(ip2FirstRequest)
                expect(ip2FirstResponse.status).not.toBe(429)
            }),
            { numRuns: 5 } // Very reduced runs due to stateful nature
        )
    }, 60000) // 60 second timeout

    it("should use correct rate limit parameters (5 requests per 60 seconds)", async () => {
        await fc.assert(
            fc.asyncProperty(fc.ipV4(), async ip => {
                // Property: Exactly 5 requests should be allowed
                const allowedRequests = 5

                // Make exactly 5 requests
                for (let i = 0; i < allowedRequests; i++) {
                    const request = new NextRequest(
                        "http://localhost:3000/api/auth/logout",
                        {
                            method: "POST",
                            headers: {
                                "x-forwarded-for": ip,
                            },
                        }
                    )

                    const response = await proxy(request)

                    // Property: All 5 requests should pass
                    expect(response.status).not.toBe(429)
                }

                // Property: The (allowedRequests + 1)th request should be rejected
                const exceededRequest = new NextRequest(
                    "http://localhost:3000/api/auth/logout",
                    {
                        method: "POST",
                        headers: {
                            "x-forwarded-for": ip,
                        },
                    }
                )

                const exceededResponse = await proxy(exceededRequest)
                expect(exceededResponse.status).toBe(429)
            }),
            { numRuns: 10 }
        )
    }, 30000)

    it("should include correct error message in rate limited response", async () => {
        await fc.assert(
            fc.asyncProperty(fc.ipV4(), async ip => {
                // Make 5 requests to reach the limit
                for (let i = 0; i < 5; i++) {
                    const request = new NextRequest(
                        "http://localhost:3000/api/auth/logout",
                        {
                            method: "POST",
                            headers: {
                                "x-forwarded-for": ip,
                            },
                        }
                    )
                    await proxy(request)
                }

                // 6th request should be rate limited
                const rateLimitedRequest = new NextRequest(
                    "http://localhost:3000/api/auth/logout",
                    {
                        method: "POST",
                        headers: {
                            "x-forwarded-for": ip,
                        },
                    }
                )

                const response = await proxy(rateLimitedRequest)

                // Property: Response must have 429 status
                expect(response.status).toBe(429)

                // Property: Response must contain specific error message
                const data = await response.json()
                expect(data).toHaveProperty("error")
                expect(data.error).toBe(
                    "Too many logout attempts. Please try again later."
                )
            }),
            { numRuns: 10 }
        )
    }, 30000)

    it("should track rate limit by composite key (identifier:endpoint)", async () => {
        await fc.assert(
            fc.asyncProperty(fc.ipV4(), async ip => {
                // Make 5 logout requests
                for (let i = 0; i < 5; i++) {
                    const logoutRequest = new NextRequest(
                        "http://localhost:3000/api/auth/logout",
                        {
                            method: "POST",
                            headers: {
                                "x-forwarded-for": ip,
                            },
                        }
                    )
                    await proxy(logoutRequest)
                }

                // 6th logout request should be rate limited
                const sixthLogoutRequest = new NextRequest(
                    "http://localhost:3000/api/auth/logout",
                    {
                        method: "POST",
                        headers: {
                            "x-forwarded-for": ip,
                        },
                    }
                )
                const logoutResponse = await proxy(sixthLogoutRequest)
                expect(logoutResponse.status).toBe(429)

                // Property: Other endpoints should NOT be affected by logout rate limit
                // (different composite key)
                const registerRequest = new NextRequest(
                    "http://localhost:3000/api/auth/register",
                    {
                        method: "POST",
                        headers: {
                            "x-forwarded-for": ip,
                        },
                    }
                )
                const registerResponse = await proxy(registerRequest)

                // Should not be rate limited (different endpoint)
                expect(registerResponse.status).not.toBe(429)
            }),
            { numRuns: 5 }
        )
    }, 30000)
})
