/**
 * Tests for Security Headers Middleware
 * Validates: Requirements 20.1-20.4
 */

import { NextFunction, Request, Response } from "express"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    getSecurityHeaders,
    httpsRedirectMiddleware,
    securityHeadersMiddleware,
} from "./security-headers"

describe("Security Headers Middleware", () => {
    describe("getSecurityHeaders", () => {
        it("should return all security headers", () => {
            const headers = getSecurityHeaders()

            expect(headers).toHaveProperty("Strict-Transport-Security")
            expect(headers).toHaveProperty("Content-Security-Policy")
            expect(headers).toHaveProperty("X-Frame-Options")
            expect(headers).toHaveProperty("X-Content-Type-Options")
        })

        it("should have HSTS header with correct value", () => {
            const headers = getSecurityHeaders()

            expect(headers["Strict-Transport-Security"]).toContain(
                "max-age=31536000"
            )
            expect(headers["Strict-Transport-Security"]).toContain(
                "includeSubDomains"
            )
            expect(headers["Strict-Transport-Security"]).toContain("preload")
        })

        it("should have CSP header", () => {
            const headers = getSecurityHeaders()

            expect(headers["Content-Security-Policy"]).toBeDefined()
            expect(headers["Content-Security-Policy"]).toContain(
                "default-src 'self'"
            )
        })

        it("should have X-Frame-Options set to DENY", () => {
            const headers = getSecurityHeaders()

            expect(headers["X-Frame-Options"]).toBe("DENY")
        })

        it("should have X-Content-Type-Options set to nosniff", () => {
            const headers = getSecurityHeaders()

            expect(headers["X-Content-Type-Options"]).toBe("nosniff")
        })
    })

    describe("securityHeadersMiddleware", () => {
        let req: Partial<Request>
        let res: Partial<Response>
        let next: NextFunction

        beforeEach(() => {
            req = {
                method: "GET",
                path: "/api/test",
                headers: {},
            }

            res = {
                setHeader: vi.fn(),
            }

            next = vi.fn()
        })

        it("should add all security headers to response", () => {
            securityHeadersMiddleware(req as Request, res as Response, next)

            expect(res.setHeader).toHaveBeenCalledWith(
                "Strict-Transport-Security",
                expect.stringContaining("max-age=31536000")
            )
            expect(res.setHeader).toHaveBeenCalledWith(
                "Content-Security-Policy",
                expect.any(String)
            )
            expect(res.setHeader).toHaveBeenCalledWith(
                "X-Frame-Options",
                "DENY"
            )
            expect(res.setHeader).toHaveBeenCalledWith(
                "X-Content-Type-Options",
                "nosniff"
            )
        })

        it("should call next middleware", () => {
            securityHeadersMiddleware(req as Request, res as Response, next)

            expect(next).toHaveBeenCalled()
        })

        it("should add HSTS header with preload", () => {
            securityHeadersMiddleware(req as Request, res as Response, next)

            const hstsCall = (res.setHeader as any).mock.calls.find(
                (call: any[]) => call[0] === "Strict-Transport-Security"
            )

            expect(hstsCall[1]).toContain("preload")
        })

        it("should add X-XSS-Protection header", () => {
            securityHeadersMiddleware(req as Request, res as Response, next)

            expect(res.setHeader).toHaveBeenCalledWith(
                "X-XSS-Protection",
                "1; mode=block"
            )
        })

        it("should add Referrer-Policy header", () => {
            securityHeadersMiddleware(req as Request, res as Response, next)

            expect(res.setHeader).toHaveBeenCalledWith(
                "Referrer-Policy",
                "strict-origin-when-cross-origin"
            )
        })

        it("should add Permissions-Policy header", () => {
            securityHeadersMiddleware(req as Request, res as Response, next)

            expect(res.setHeader).toHaveBeenCalledWith(
                "Permissions-Policy",
                expect.stringContaining("geolocation=()")
            )
        })
    })

    describe("httpsRedirectMiddleware", () => {
        let req: Partial<Request>
        let res: Partial<Response>
        let next: NextFunction

        beforeEach(() => {
            req = {
                method: "GET",
                path: "/api/test",
                protocol: "http",
                headers: {},
                originalUrl: "/api/test",
            }

            res = {
                redirect: vi.fn(),
            }

            next = vi.fn()

            // Set NODE_ENV to production for testing
            process.env.NODE_ENV = "production"
        })

        it("should redirect HTTP to HTTPS in production", () => {
            req.headers = {}
            req.protocol = "http"

            httpsRedirectMiddleware(req as Request, res as Response, next)

            expect(res.redirect).toHaveBeenCalledWith(
                301,
                expect.stringContaining("https://")
            )
        })

        it("should not redirect if already HTTPS", () => {
            req.protocol = "https"

            httpsRedirectMiddleware(req as Request, res as Response, next)

            expect(res.redirect).not.toHaveBeenCalled()
            expect(next).toHaveBeenCalled()
        })

        it("should check x-forwarded-proto header for proxied requests", () => {
            req.protocol = "http"
            req.headers = { "x-forwarded-proto": "https" }

            httpsRedirectMiddleware(req as Request, res as Response, next)

            expect(res.redirect).not.toHaveBeenCalled()
            expect(next).toHaveBeenCalled()
        })

        it("should not redirect in development environment", () => {
            process.env.NODE_ENV = "development"
            req.protocol = "http"

            httpsRedirectMiddleware(req as Request, res as Response, next)

            expect(res.redirect).not.toHaveBeenCalled()
            expect(next).toHaveBeenCalled()
        })

        it("should preserve original URL in redirect", () => {
            req.protocol = "http"
            req.headers = { host: "example.com" }
            req.originalUrl = "/api/test?param=value"

            httpsRedirectMiddleware(req as Request, res as Response, next)

            expect(res.redirect).toHaveBeenCalledWith(
                301,
                expect.stringContaining("/api/test?param=value")
            )
        })

        it("should use host header for redirect URL", () => {
            req.protocol = "http"
            req.headers = { host: "example.com" }

            httpsRedirectMiddleware(req as Request, res as Response, next)

            expect(res.redirect).toHaveBeenCalledWith(
                301,
                expect.stringContaining("https://example.com")
            )
        })
    })
})
