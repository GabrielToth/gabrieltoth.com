/**
 * Property-Based Tests for Logout Rate Limit Window Reset
 * Feature: authentication-security-enhancements
 * Tests universal properties of rate limit window reset behavior
 *
 * **Validates: Requirements 1.4**
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
const { proxy, resetRateLimitStoreForTests } = await import("../../../proxy")

describe("Property 2: Rate Limit Window Reset", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.useRealTimers()
        resetRateLimitStoreForTests()
    })

    /**
     * **Validates: Requirements 1.4**
     *
     * Property: For any user identifier, when the 60-second rate limit window expires,
     * the request count SHALL reset to zero and new requests SHALL be allowed.
     */
    it("should reset request count after 60-second window expires", async () => {
        vi.useFakeTimers()
        try {
            await fc.assert(
                fc.asyncProperty(
                    fc.ipV4(), // Generate random IP addresses
                    fc.string({ minLength: 10, maxLength: 64 }), // Generate random session tokens
                    async (ip, sessionToken) => {
                        // Helper function to create a logout request
                        const createLogoutRequest = () => {
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

                            return request
                        }

                        // Step 1: Make 5 requests to reach the rate limit
                        for (let i = 0; i < 5; i++) {
                            const request = createLogoutRequest()
                            const response = await proxy(request)

                            // Property: First 5 requests should NOT be rate limited
                            expect(response.status).not.toBe(429)
                        }

                        // Step 2: Verify 6th request is rate limited
                        const sixthRequest = createLogoutRequest()
                        const sixthResponse = await proxy(sixthRequest)

                        // Property: 6th request MUST be rejected with 429
                        expect(sixthResponse.status).toBe(429)

                        // Step 3: Wait for the 60-second window to expire
                        // Add a small buffer to ensure the window has definitely expired
                        await vi.advanceTimersByTimeAsync(60100)

                        // Step 4: Make a new request after window expiration
                        const afterResetRequest = createLogoutRequest()
                        const afterResetResponse =
                            await proxy(afterResetRequest)

                        // Property: After window expires, request count MUST reset
                        // and new requests MUST be allowed (not rate limited)
                        expect(afterResetResponse.status).not.toBe(429)

                        // Step 5: Verify we can make 5 more requests (full reset)
                        for (let i = 0; i < 4; i++) {
                            const request = createLogoutRequest()
                            const response = await proxy(request)

                            // Property: After reset, we should be able to make 5 requests again
                            expect(response.status).not.toBe(429)
                        }

                        // Step 6: Verify 6th request in new window is rate limited
                        const newWindowSixthRequest = createLogoutRequest()
                        const newWindowSixthResponse = await proxy(
                            newWindowSixthRequest
                        )

                        // Property: 6th request in new window MUST be rejected with 429
                        expect(newWindowSixthResponse.status).toBe(429)
                    }
                ),
                { numRuns: 3 }
            )
        } finally {
            vi.useRealTimers()
        }
    }, 60000)

    it("should reset count independently for different user identifiers", async () => {
        vi.useFakeTimers()
        try {
            await fc.assert(
                fc.asyncProperty(fc.ipV4(), fc.ipV4(), async (ip1, ip2) => {
                    // Skip if IPs are the same
                    fc.pre(ip1 !== ip2)

                    // Helper function to create a logout request for a specific IP
                    const createLogoutRequest = (ip: string) => {
                        return new NextRequest(
                            "http://localhost:3000/api/auth/logout",
                            {
                                method: "POST",
                                headers: {
                                    "x-forwarded-for": ip,
                                },
                            }
                        )
                    }

                    // Step 1: Rate limit IP1
                    for (let i = 0; i < 5; i++) {
                        const request = createLogoutRequest(ip1)
                        await proxy(request)
                    }

                    // Verify IP1 is rate limited
                    const ip1RateLimitedRequest = createLogoutRequest(ip1)
                    const ip1RateLimitedResponse = await proxy(
                        ip1RateLimitedRequest
                    )
                    expect(ip1RateLimitedResponse.status).toBe(429)

                    // Step 2: Verify IP2 is NOT rate limited (independent tracking)
                    const ip2FirstRequest = createLogoutRequest(ip2)
                    const ip2FirstResponse = await proxy(ip2FirstRequest)
                    expect(ip2FirstResponse.status).not.toBe(429)

                    // Step 3: Wait for IP1's window to expire
                    await vi.advanceTimersByTimeAsync(60100)

                    // Step 4: Verify IP1 can make requests again after reset
                    const ip1AfterResetRequest = createLogoutRequest(ip1)
                    const ip1AfterResetResponse =
                        await proxy(ip1AfterResetRequest)

                    // Property: IP1's rate limit MUST reset independently
                    expect(ip1AfterResetResponse.status).not.toBe(429)

                    // Step 5: Verify IP2 is still independent (hasn't been rate limited)
                    const ip2SecondRequest = createLogoutRequest(ip2)
                    const ip2SecondResponse = await proxy(ip2SecondRequest)
                    expect(ip2SecondResponse.status).not.toBe(429)
                }),
                { numRuns: 2 }
            )
        } finally {
            vi.useRealTimers()
        }
    }, 60000)

    it("should reset count to exactly zero (not accumulate)", async () => {
        vi.useFakeTimers()
        try {
            await fc.assert(
                fc.asyncProperty(fc.ipV4(), async ip => {
                    // Helper function to create a logout request
                    const createLogoutRequest = () => {
                        return new NextRequest(
                            "http://localhost:3000/api/auth/logout",
                            {
                                method: "POST",
                                headers: {
                                    "x-forwarded-for": ip,
                                },
                            }
                        )
                    }

                    // Step 1: Make 3 requests (not reaching limit)
                    for (let i = 0; i < 3; i++) {
                        const request = createLogoutRequest()
                        const response = await proxy(request)
                        expect(response.status).not.toBe(429)
                    }

                    // Step 2: Wait for window to expire
                    await vi.advanceTimersByTimeAsync(60100)

                    // Step 3: After reset, we should be able to make 5 requests again
                    // (not 2 remaining from previous window)
                    for (let i = 0; i < 5; i++) {
                        const request = createLogoutRequest()
                        const response = await proxy(request)

                        // Property: Count MUST reset to zero, not accumulate
                        expect(response.status).not.toBe(429)
                    }

                    // Step 4: 6th request should be rate limited
                    const sixthRequest = createLogoutRequest()
                    const sixthResponse = await proxy(sixthRequest)
                    expect(sixthResponse.status).toBe(429)
                }),
                { numRuns: 2 }
            )
        } finally {
            vi.useRealTimers()
        }
    }, 60000)

    it("should handle multiple window resets correctly", async () => {
        vi.useFakeTimers()
        try {
            await fc.assert(
                fc.asyncProperty(fc.ipV4(), async ip => {
                    // Helper function to create a logout request
                    const createLogoutRequest = () => {
                        return new NextRequest(
                            "http://localhost:3000/api/auth/logout",
                            {
                                method: "POST",
                                headers: {
                                    "x-forwarded-for": ip,
                                },
                            }
                        )
                    }

                    // Cycle 1: Rate limit and reset
                    for (let i = 0; i < 5; i++) {
                        await proxy(createLogoutRequest())
                    }
                    const cycle1RateLimited = await proxy(createLogoutRequest())
                    expect(cycle1RateLimited.status).toBe(429)

                    await vi.advanceTimersByTimeAsync(60100)

                    // Cycle 2: After first reset
                    for (let i = 0; i < 5; i++) {
                        const response = await proxy(createLogoutRequest())
                        expect(response.status).not.toBe(429)
                    }
                    const cycle2RateLimited = await proxy(createLogoutRequest())
                    expect(cycle2RateLimited.status).toBe(429)

                    await vi.advanceTimersByTimeAsync(60100)

                    // Cycle 3: After second reset
                    const cycle3FirstRequest = await proxy(
                        createLogoutRequest()
                    )

                    // Property: Multiple resets MUST work consistently
                    expect(cycle3FirstRequest.status).not.toBe(429)
                }),
                { numRuns: 1 }
            )
        } finally {
            vi.useRealTimers()
        }
    }, 60000)
})
