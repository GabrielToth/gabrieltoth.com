// Request Context Middleware Tests
// Feature: distributed-infrastructure-logging

import fc from "fast-check"
import { NextRequest } from "next/server"
import { describe, expect, it } from "vitest"
import { contextMiddleware, getRequestContext } from "./context"

describe("Request Context Middleware", () => {
    // Feature: distributed-infrastructure-logging, Property 6: Request context propagation
    // **Validates: Requirements 12.2**
    describe("Property 6: Request context propagation", () => {
        it("should propagate requestId from header to response", () => {
            fc.assert(
                fc.property(fc.uuid(), requestId => {
                    const request = new NextRequest(
                        "http://localhost:3000/api/test",
                        {
                            headers: {
                                "x-request-id": requestId,
                            },
                        }
                    )

                    const response = contextMiddleware(request)

                    // Response should have the same requestId
                    expect(response.headers.get("X-Request-ID")).toBe(requestId)
                }),
                { numRuns: 20 }
            )
        })

        it("should generate requestId when not provided", () => {
            fc.assert(
                fc.property(fc.webPath(), path => {
                    const request = new NextRequest(
                        `http://localhost:3000${path}`
                    )

                    const response = contextMiddleware(request)

                    // Response should have a generated requestId
                    const requestId = response.headers.get("X-Request-ID")
                    expect(requestId).toBeDefined()
                    expect(requestId).toMatch(
                        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
                    )
                }),
                { numRuns: 20 }
            )
        })
    })

    // Feature: distributed-infrastructure-logging, Property 7: User context propagation
    // **Validates: Requirements 12.3**
    describe("Property 7: User context propagation", () => {
        it("should extract userId from headers when available", () => {
            fc.assert(
                fc.property(
                    fc.record({
                        userId: fc.uuid(),
                        requestId: fc.uuid(),
                    }),
                    ({ userId, requestId }) => {
                        const headers = new Headers({
                            "x-request-id": requestId,
                            "x-user-id": userId,
                        })

                        const context = getRequestContext(headers)

                        expect(context.requestId).toBe(requestId)
                        expect(context.userId).toBe(userId)
                    }
                ),
                { numRuns: 20 }
            )
        })

        it("should handle missing userId gracefully", () => {
            fc.assert(
                fc.property(fc.uuid(), requestId => {
                    const headers = new Headers({
                        "x-request-id": requestId,
                    })

                    const context = getRequestContext(headers)

                    expect(context.requestId).toBe(requestId)
                    expect(context.userId).toBeUndefined()
                }),
                { numRuns: 20 }
            )
        })
    })

    // Unit tests for edge cases
    describe("Unit Tests: Context Middleware Edge Cases", () => {
        it("should generate requestId when not provided in header", () => {
            const request = new NextRequest("http://localhost:3000/api/test")
            const response = contextMiddleware(request)

            const requestId = response.headers.get("X-Request-ID")
            expect(requestId).toBeDefined()
            expect(requestId).toMatch(/^[0-9a-f-]+$/i)
        })

        it("should extract requestId from header", () => {
            const testRequestId = "12345678-1234-1234-1234-123456789012"
            const request = new NextRequest("http://localhost:3000/api/test", {
                headers: {
                    "x-request-id": testRequestId,
                },
            })

            const response = contextMiddleware(request)
            expect(response.headers.get("X-Request-ID")).toBe(testRequestId)
        })

        it("should extract userId from header when present", () => {
            const testUserId = "user-123"
            const headers = new Headers({
                "x-user-id": testUserId,
            })

            const context = getRequestContext(headers)
            expect(context.userId).toBe(testUserId)
        })

        it("should return undefined userId when not present", () => {
            const headers = new Headers()
            const context = getRequestContext(headers)

            expect(context.userId).toBeUndefined()
        })

        it("should handle empty headers", () => {
            const headers = new Headers()
            const context = getRequestContext(headers)

            expect(context.requestId).toBeUndefined()
            expect(context.userId).toBeUndefined()
        })

        it("should work with different HTTP methods", () => {
            const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"]

            methods.forEach(method => {
                const request = new NextRequest(
                    "http://localhost:3000/api/test",
                    {
                        method,
                    }
                )

                const response = contextMiddleware(request)
                expect(response.headers.get("X-Request-ID")).toBeDefined()
            })
        })

        it("should work with different paths", () => {
            const paths = ["/api/test", "/api/users/123", "/health", "/"]

            paths.forEach(path => {
                const request = new NextRequest(`http://localhost:3000${path}`)
                const response = contextMiddleware(request)

                expect(response.headers.get("X-Request-ID")).toBeDefined()
            })
        })
    })
})
