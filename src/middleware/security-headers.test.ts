/**
 * Security Headers Middleware Tests (src/middleware/)
 * Covers: applySecurityHeaders, securityHeadersMiddleware, getSecurityHeadersObject,
 *         withSecurityHeaders, getCspNonce, validateOrigin, getClientIp,
 *         getSecureCookieOptions, getSessionCookieOptions,
 *         getRememberMeCookieOptions, getCsrfCookieOptions
 *
 * Validates: Requirements 12.1-12.8 - Security headers implementation
 */

import { getConfig } from "@/config/environment"
import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    applySecurityHeaders,
    getClientIp,
    getCsrfCookieOptions,
    getCspNonce,
    getRememberMeCookieOptions,
    getSecureCookieOptions,
    getSecurityHeadersObject,
    getSessionCookieOptions,
    securityHeadersMiddleware,
    validateOrigin,
    withSecurityHeaders,
} from "./security-headers"

// Mock config to control environment in tests
vi.mock("@/config/environment", () => ({
    getConfig: vi.fn(),
}))

describe("Security Headers Middleware (src/middleware/)", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ============================================================================
    // applySecurityHeaders() Tests
    // ============================================================================

    describe("applySecurityHeaders()", () => {
        it("should apply all security headers to the response", () => {
            vi.mocked(getConfig).mockReturnValue({
                isProduction: false,
                isDevelopment: true,
                isTest: false,
                isCloud: false,
                isLocal: true,
                environment: "development",
                deploymentType: "local",
                appUrl: "http://localhost:3000",
                apiUrl: "http://localhost:3000",
                debugMode: true,
                database: {} as any,
                cache: {} as any,
                security: {} as any,
                session: {} as any,
                logging: {} as any,
            })

            const response = new NextResponse("test")
            const result = applySecurityHeaders(response)

            expect(result.headers.get("X-Frame-Options")).toBe("DENY")
            expect(result.headers.get("X-Content-Type-Options")).toBe("nosniff")
            expect(result.headers.get("Content-Security-Policy")).toBeTruthy()
            expect(result.headers.get("Referrer-Policy")).toBe(
                "strict-origin-when-cross-origin"
            )
            expect(result.headers.get("X-XSS-Protection")).toBeTruthy()
            expect(
                result.headers.get("X-Permitted-Cross-Domain-Policies")
            ).toBe("none")
        })

        it("should NOT include HSTS header in non-production", () => {
            vi.mocked(getConfig).mockReturnValue({
                isProduction: false,
                isDevelopment: true,
                isTest: false,
                isCloud: false,
                isLocal: true,
                environment: "development",
                deploymentType: "local",
                appUrl: "http://localhost:3000",
                apiUrl: "http://localhost:3000",
                debugMode: true,
                database: {} as any,
                cache: {} as any,
                security: {} as any,
                session: {} as any,
                logging: {} as any,
            })

            const response = new NextResponse("test")
            const result = applySecurityHeaders(response)

            expect(result.headers.get("Strict-Transport-Security")).toBeNull()
        })

        it("should include HSTS header in production", () => {
            vi.mocked(getConfig).mockReturnValue({
                isProduction: true,
                isDevelopment: false,
                isTest: false,
                isCloud: true,
                isLocal: false,
                environment: "production",
                deploymentType: "cloud",
                appUrl: "https://gabrieltoth.com",
                apiUrl: "https://api.gabrieltoth.com",
                debugMode: false,
                database: {} as any,
                cache: {} as any,
                security: {} as any,
                session: {} as any,
                logging: {} as any,
            })

            const response = new NextResponse("test")
            const result = applySecurityHeaders(response)

            expect(result.headers.get("Strict-Transport-Security")).toContain(
                "max-age=31536000"
            )
            expect(result.headers.get("Strict-Transport-Security")).toContain(
                "includeSubDomains"
            )
            expect(result.headers.get("Strict-Transport-Security")).toContain(
                "preload"
            )
        })
    })

    // ============================================================================
    // securityHeadersMiddleware() Tests
    // ============================================================================

    describe("securityHeadersMiddleware()", () => {
        it("should return a response with security headers applied", () => {
            vi.mocked(getConfig).mockReturnValue({
                isProduction: false,
                isDevelopment: true,
                isTest: false,
                isCloud: false,
                isLocal: true,
                environment: "development",
                deploymentType: "local",
                appUrl: "http://localhost:3000",
                apiUrl: "http://localhost:3000",
                debugMode: true,
                database: {} as any,
                cache: {} as any,
                security: {} as any,
                session: {} as any,
                logging: {} as any,
            })

            const request = new NextRequest("http://localhost:3000/dashboard")
            const response = securityHeadersMiddleware(request)

            expect(response.headers.get("X-Frame-Options")).toBe("DENY")
            expect(response.headers.get("Content-Security-Policy")).toBeTruthy()
        })
    })

    // ============================================================================
    // getSecurityHeadersObject() Tests
    // ============================================================================

    describe("getSecurityHeadersObject()", () => {
        it("should return all security headers as an object", () => {
            vi.mocked(getConfig).mockReturnValue({
                isProduction: false,
                isDevelopment: true,
                isTest: false,
                isCloud: false,
                isLocal: true,
                environment: "development",
                deploymentType: "local",
                appUrl: "http://localhost:3000",
                apiUrl: "http://localhost:3000",
                debugMode: true,
                database: {} as any,
                cache: {} as any,
                security: {} as any,
                session: {} as any,
                logging: {} as any,
            })

            const headers = getSecurityHeadersObject()

            expect(headers["X-Frame-Options"]).toBe("DENY")
            expect(headers["X-Content-Type-Options"]).toBe("nosniff")
            expect(headers["Content-Security-Policy"]).toBeTruthy()
            expect(headers["Referrer-Policy"]).toBe(
                "strict-origin-when-cross-origin"
            )
            expect(headers["X-XSS-Protection"]).toBe("1; mode=block")
            expect(headers["Permissions-Policy"]).toBeTruthy()
            // HSTS should not be present in non-production
            expect(headers["Strict-Transport-Security"]).toBeUndefined()
        })

        it("should include HSTS in production", () => {
            vi.mocked(getConfig).mockReturnValue({
                isProduction: true,
                isDevelopment: false,
                isTest: false,
                isCloud: true,
                isLocal: false,
                environment: "production",
                deploymentType: "cloud",
                appUrl: "https://gabrieltoth.com",
                apiUrl: "https://api.gabrieltoth.com",
                debugMode: false,
                database: {} as any,
                cache: {} as any,
                security: {} as any,
                session: {} as any,
                logging: {} as any,
            })

            const headers = getSecurityHeadersObject()

            expect(headers["Strict-Transport-Security"]).toContain(
                "max-age=31536000"
            )
        })
    })

    // ============================================================================
    // withSecurityHeaders() Tests
    // ============================================================================

    describe("withSecurityHeaders()", () => {
        it("should wrap a handler and add security headers to response", async () => {
            vi.mocked(getConfig).mockReturnValue({
                isProduction: false,
                isDevelopment: true,
                isTest: false,
                isCloud: false,
                isLocal: true,
                environment: "development",
                deploymentType: "local",
                appUrl: "http://localhost:3000",
                apiUrl: "http://localhost:3000",
                debugMode: true,
                database: {} as any,
                cache: {} as any,
                security: {} as any,
                session: {} as any,
                logging: {} as any,
            })

            const handler = vi
                .fn()
                .mockResolvedValue(NextResponse.json({ message: "ok" }))
            const wrapped = withSecurityHeaders(handler)

            const request = new NextRequest("http://localhost:3000/api/test")
            const response = await wrapped(request)

            expect(handler).toHaveBeenCalledWith(request)
            expect(response.headers.get("X-Frame-Options")).toBe("DENY")
            expect(response.headers.get("Content-Security-Policy")).toBeTruthy()
        })

        it("should handle plain Response from handler", async () => {
            vi.mocked(getConfig).mockReturnValue({
                isProduction: false,
                isDevelopment: true,
                isTest: false,
                isCloud: false,
                isLocal: true,
                environment: "development",
                deploymentType: "local",
                appUrl: "http://localhost:3000",
                apiUrl: "http://localhost:3000",
                debugMode: true,
                database: {} as any,
                cache: {} as any,
                security: {} as any,
                session: {} as any,
                logging: {} as any,
            })

            const handler = vi
                .fn()
                .mockResolvedValue(new Response("plain", { status: 200 }))
            const wrapped = withSecurityHeaders(handler)

            const request = new NextRequest("http://localhost:3000/api/test")
            const response = await wrapped(request)

            expect(response instanceof NextResponse).toBe(true)
            expect(response.headers.get("X-Frame-Options")).toBe("DENY")
        })
    })

    // ============================================================================
    // getCspNonce() Tests
    // ============================================================================

    describe("getCspNonce()", () => {
        it("should return a nonce string", () => {
            const nonce = getCspNonce()
            expect(typeof nonce).toBe("string")
            expect(nonce.length).toBeGreaterThan(0)
        })

        it("should return different values on each call", () => {
            const nonce1 = getCspNonce()
            const nonce2 = getCspNonce()
            expect(nonce1).not.toBe(nonce2)
        })
    })

    // ============================================================================
    // validateOrigin() Tests
    // ============================================================================

    describe("validateOrigin()", () => {
        it("should return true when request has no origin header", () => {
            const request = new NextRequest("http://localhost:3000/dashboard")
            const result = validateOrigin(request, ["http://localhost:3000"])
            expect(result).toBe(true)
        })

        it("should return true when origin is in allowed origins", () => {
            const request = new NextRequest("http://localhost:3000/dashboard", {
                headers: { origin: "http://localhost:3000" },
            })
            const result = validateOrigin(request, [
                "http://localhost:3000",
                "https://gabrieltoth.com",
            ])
            expect(result).toBe(true)
        })

        it("should return false when origin is not in allowed origins", () => {
            const request = new NextRequest("http://localhost:3000/dashboard", {
                headers: { origin: "https://evil.com" },
            })
            const result = validateOrigin(request, ["http://localhost:3000"])
            expect(result).toBe(false)
        })
    })

    // ============================================================================
    // getClientIp() Tests
    // ============================================================================

    describe("getClientIp()", () => {
        it("should return IP from X-Forwarded-For header", () => {
            const request = new NextRequest("http://localhost:3000/dashboard", {
                headers: {
                    "x-forwarded-for": "192.168.1.1, 10.0.0.1",
                },
            })
            const ip = getClientIp(request)
            expect(ip).toBe("192.168.1.1")
        })

        it("should return IP from X-Real-IP header when X-Forwarded-For is absent", () => {
            const request = new NextRequest("http://localhost:3000/dashboard", {
                headers: {
                    "x-real-ip": "10.0.0.1",
                },
            })
            const ip = getClientIp(request)
            expect(ip).toBe("10.0.0.1")
        })

        it("should return 'unknown' when no IP headers are present", () => {
            const request = new NextRequest("http://localhost:3000/dashboard")
            const ip = getClientIp(request)
            expect(ip).toBe("unknown")
        })

        it("should prefer X-Forwarded-For over X-Real-IP", () => {
            const request = new NextRequest("http://localhost:3000/dashboard", {
                headers: {
                    "x-forwarded-for": "203.0.113.1",
                    "x-real-ip": "10.0.0.1",
                },
            })
            const ip = getClientIp(request)
            expect(ip).toBe("203.0.113.1")
        })
    })

    // ============================================================================
    // getSecureCookieOptions() Tests
    // ============================================================================

    describe("getSecureCookieOptions()", () => {
        it("should return secure cookies in production", () => {
            const options = getSecureCookieOptions(true)
            expect(options.httpOnly).toBe(true)
            expect(options.secure).toBe(true)
            expect(options.sameSite).toBe("strict")
            expect(options.path).toBe("/")
        })

        it("should return non-secure cookies in development", () => {
            const options = getSecureCookieOptions(false)
            expect(options.httpOnly).toBe(true)
            expect(options.secure).toBe(false)
            expect(options.sameSite).toBe("strict")
            expect(options.path).toBe("/")
        })
    })

    // ============================================================================
    // getSessionCookieOptions() Tests
    // ============================================================================

    describe("getSessionCookieOptions()", () => {
        it("should extend secure cookie options with 1 hour maxAge", () => {
            const options = getSessionCookieOptions(false)
            expect(options.httpOnly).toBe(true)
            expect(options.maxAge).toBe(3600) // 1 hour
            expect(options.path).toBe("/")
        })

        it("should set secure flag based on environment", () => {
            const dev = getSessionCookieOptions(false)
            const prod = getSessionCookieOptions(true)
            expect(dev.secure).toBe(false)
            expect(prod.secure).toBe(true)
        })
    })

    // ============================================================================
    // getRememberMeCookieOptions() Tests
    // ============================================================================

    describe("getRememberMeCookieOptions()", () => {
        it("should extend secure cookie options with 30 day maxAge", () => {
            const options = getRememberMeCookieOptions(false)
            expect(options.httpOnly).toBe(true)
            expect(options.maxAge).toBe(2592000) // 30 days
            expect(options.path).toBe("/")
        })

        it("should set secure flag based on environment", () => {
            const dev = getRememberMeCookieOptions(false)
            const prod = getRememberMeCookieOptions(true)
            expect(dev.secure).toBe(false)
            expect(prod.secure).toBe(true)
        })
    })

    // ============================================================================
    // getCsrfCookieOptions() Tests
    // ============================================================================

    describe("getCsrfCookieOptions()", () => {
        it("should extend secure cookie options with 1 hour maxAge", () => {
            const options = getCsrfCookieOptions(false)
            expect(options.httpOnly).toBe(true)
            expect(options.maxAge).toBe(3600) // 1 hour
            expect(options.path).toBe("/")
        })

        it("should set secure flag based on environment", () => {
            const dev = getCsrfCookieOptions(false)
            const prod = getCsrfCookieOptions(true)
            expect(dev.secure).toBe(false)
            expect(prod.secure).toBe(true)
        })
    })
})
