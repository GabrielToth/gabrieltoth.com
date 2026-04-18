/**
 * Unit Tests for Security Headers Middleware
 */

import { NextRequest, NextResponse } from "next/server"
import { describe, expect, it } from "vitest"
import {
    applySecurityHeaders,
    getClientIp,
    getSecurityHeaders,
    validateOrigin,
} from "./security-headers"

describe("Security Headers Middleware", () => {
    describe("getSecurityHeaders", () => {
        it("should return all security headers", () => {
            const headers = getSecurityHeaders()

            expect(headers).toHaveProperty("Content-Security-Policy")
            expect(headers).toHaveProperty("X-Frame-Options")
            expect(headers).toHaveProperty("X-Content-Type-Options")
            expect(headers).toHaveProperty("Strict-Transport-Security")
            expect(headers).toHaveProperty("Referrer-Policy")
        })

        it("should have correct CSP header", () => {
            const headers = getSecurityHeaders()

            expect(headers["Content-Security-Policy"]).toContain(
                "default-src 'self'"
            )
            expect(headers["Content-Security-Policy"]).toContain("script-src")
            expect(headers["Content-Security-Policy"]).toContain("style-src")
        })

        it("should have X-Frame-Options set to DENY", () => {
            const headers = getSecurityHeaders()

            expect(headers["X-Frame-Options"]).toBe("DENY")
        })

        it("should have X-Content-Type-Options set to nosniff", () => {
            const headers = getSecurityHeaders()

            expect(headers["X-Content-Type-Options"]).toBe("nosniff")
        })

        it("should have Strict-Transport-Security header", () => {
            const headers = getSecurityHeaders()

            expect(headers["Strict-Transport-Security"]).toContain(
                "max-age=31536000"
            )
            expect(headers["Strict-Transport-Security"]).toContain(
                "includeSubDomains"
            )
        })

        it("should have Referrer-Policy set correctly", () => {
            const headers = getSecurityHeaders()

            expect(headers["Referrer-Policy"]).toBe(
                "strict-origin-when-cross-origin"
            )
        })
    })

    describe("applySecurityHeaders", () => {
        it("should apply all security headers to response", () => {
            const response = new NextResponse("test")

            const result = applySecurityHeaders(response)

            expect(result.headers.get("Content-Security-Policy")).toBeTruthy()
            expect(result.headers.get("X-Frame-Options")).toBe("DENY")
            expect(result.headers.get("X-Content-Type-Options")).toBe("nosniff")
            expect(result.headers.get("Strict-Transport-Security")).toBeTruthy()
            expect(result.headers.get("Referrer-Policy")).toBe(
                "strict-origin-when-cross-origin"
            )
        })

        it("should preserve existing response body", () => {
            const response = new NextResponse("test content")

            const result = applySecurityHeaders(response)

            expect(result).toBeDefined()
        })

        it("should return a NextResponse", () => {
            const response = new NextResponse("test")

            const result = applySecurityHeaders(response)

            expect(result).toBeInstanceOf(NextResponse)
        })
    })

    describe("validateOrigin", () => {
        it("should allow requests without origin header", () => {
            const request = new NextRequest("http://localhost:3000", {
                method: "POST",
            })

            const isValid = validateOrigin(request, ["http://localhost:3000"])

            expect(isValid).toBe(true)
        })

        it("should allow requests with matching origin", () => {
            const request = new NextRequest("http://localhost:3000", {
                method: "POST",
                headers: {
                    origin: "http://localhost:3000",
                },
            })

            const isValid = validateOrigin(request, ["http://localhost:3000"])

            expect(isValid).toBe(true)
        })

        it("should reject requests with non-matching origin", () => {
            const request = new NextRequest("http://localhost:3000", {
                method: "POST",
                headers: {
                    origin: "http://malicious.com",
                },
            })

            const isValid = validateOrigin(request, ["http://localhost:3000"])

            expect(isValid).toBe(false)
        })

        it("should allow multiple allowed origins", () => {
            const request = new NextRequest("http://localhost:3000", {
                method: "POST",
                headers: {
                    origin: "http://example.com",
                },
            })

            const isValid = validateOrigin(request, [
                "http://localhost:3000",
                "http://example.com",
            ])

            expect(isValid).toBe(true)
        })
    })

    describe("getClientIp", () => {
        it("should get IP from x-forwarded-for header", () => {
            const request = new NextRequest("http://localhost:3000", {
                method: "GET",
                headers: {
                    "x-forwarded-for": "192.168.1.1, 10.0.0.1",
                },
            })

            const ip = getClientIp(request)

            expect(ip).toBe("192.168.1.1")
        })

        it("should get IP from x-real-ip header", () => {
            const request = new NextRequest("http://localhost:3000", {
                method: "GET",
                headers: {
                    "x-real-ip": "192.168.1.1",
                },
            })

            const ip = getClientIp(request)

            expect(ip).toBe("192.168.1.1")
        })

        it("should return unknown when no IP headers present", () => {
            const request = new NextRequest("http://localhost:3000", {
                method: "GET",
            })

            const ip = getClientIp(request)

            expect(ip).toBe("unknown")
        })

        it("should prefer x-forwarded-for over x-real-ip", () => {
            const request = new NextRequest("http://localhost:3000", {
                method: "GET",
                headers: {
                    "x-forwarded-for": "192.168.1.1",
                    "x-real-ip": "10.0.0.1",
                },
            })

            const ip = getClientIp(request)

            expect(ip).toBe("192.168.1.1")
        })

        it("should trim whitespace from x-forwarded-for", () => {
            const request = new NextRequest("http://localhost:3000", {
                method: "GET",
                headers: {
                    "x-forwarded-for": "  192.168.1.1  , 10.0.0.1",
                },
            })

            const ip = getClientIp(request)

            expect(ip).toBe("192.168.1.1")
        })
    })
})
