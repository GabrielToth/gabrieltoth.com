/**
 * CORS Middleware Tests
 * Covers: corsMiddleware, validateCorsOrigin, withCors, getCorsConfiguration
 *
 * Validates: Requirement 22.7 - Configure CORS settings
 */

import { getConfig } from "@/config/environment"
import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    corsMiddleware,
    getCorsConfiguration,
    validateCorsOrigin,
    withCors,
} from "./cors"

// Mock config to control environment in tests
vi.mock("@/config/environment", () => ({
    getConfig: vi.fn(),
}))

function createRequest({
    url = "http://localhost:3000/api/test",
    method = "GET",
    origin = null as string | null,
    headers = {} as Record<string, string>,
} = {}) {
    const req = new NextRequest(url, { method, headers })
    if (origin) {
        req.headers.set("origin", origin)
    }
    return req
}

describe("CORS Middleware", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ============================================================================
    // validateCorsOrigin() Tests
    // ============================================================================

    describe("validateCorsOrigin()", () => {
        it("should return true when origin is null", () => {
            const config = getConfig()
            const result = validateCorsOrigin(null, config)
            expect(result).toBe(true)
        })

        it("should return true when origin is in allowed origins (production)", () => {
            vi.mocked(getConfig).mockReturnValue({
                isDevelopment: false,
                isProduction: true,
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
                security: {
                    httpsEnforced: true,
                    secureCookies: true,
                    corsOrigins: [
                        "https://gabrieltoth.com",
                        "https://www.gabrieltoth.com",
                    ],
                    corsCredentials: true,
                    corsMaxAge: 86400,
                    rateLimitEnabled: true,
                    rateLimitWindow: 3600000,
                    rateLimitMaxAttempts: 5,
                },
                session: {} as any,
                logging: {} as any,
            })
            const config = getConfig()

            const result = validateCorsOrigin(
                "https://gabrieltoth.com",
                config
            )

            expect(result).toBe(true)
        })

        it("should return false when origin is not allowed (production)", () => {
            vi.mocked(getConfig).mockReturnValue({
                isDevelopment: false,
                isProduction: true,
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
                security: {
                    httpsEnforced: true,
                    secureCookies: true,
                    corsOrigins: [
                        "https://gabrieltoth.com",
                        "https://www.gabrieltoth.com",
                    ],
                    corsCredentials: true,
                    corsMaxAge: 86400,
                    rateLimitEnabled: true,
                    rateLimitWindow: 3600000,
                    rateLimitMaxAttempts: 5,
                },
                session: {} as any,
                logging: {} as any,
            })
            const config = getConfig()

            const result = validateCorsOrigin("https://evil.com", config)

            expect(result).toBe(false)
        })

        it("should return true for any origin in development mode", () => {
            vi.mocked(getConfig).mockReturnValue({
                isDevelopment: true,
                isProduction: false,
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
                security: {
                    httpsEnforced: false,
                    secureCookies: false,
                    corsOrigins: [
                        "http://localhost:3000",
                        "http://localhost:3001",
                    ],
                    corsCredentials: true,
                    corsMaxAge: 86400,
                    rateLimitEnabled: true,
                    rateLimitWindow: 3600000,
                    rateLimitMaxAttempts: 5,
                },
                session: {} as any,
                logging: {} as any,
            })
            const config = getConfig()

            const result = validateCorsOrigin(
                "http://localhost:8080",
                config
            )

            expect(result).toBe(true)
        })
    })

    // ============================================================================
    // corsMiddleware() Tests
    // ============================================================================

    describe("corsMiddleware()", () => {
        it("should return 200 for preflight requests with CORS headers", () => {
            vi.mocked(getConfig).mockReturnValue({
                isDevelopment: true,
                isProduction: false,
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
                security: {
                    httpsEnforced: false,
                    secureCookies: false,
                    corsOrigins: [
                        "http://localhost:3000",
                        "http://localhost:3001",
                    ],
                    corsCredentials: true,
                    corsMaxAge: 86400,
                    rateLimitEnabled: true,
                    rateLimitWindow: 3600000,
                    rateLimitMaxAttempts: 5,
                },
                session: {} as any,
                logging: {} as any,
            })

            const request = createRequest({
                method: "OPTIONS",
                origin: "http://localhost:3000",
            })
            const response = corsMiddleware(request)

            expect(response.status).toBe(200)
            expect(
                response.headers.get("Access-Control-Allow-Origin")
            ).toBeTruthy()
            expect(
                response.headers.get("Access-Control-Allow-Methods")
            ).toBeTruthy()
            expect(
                response.headers.get("Access-Control-Allow-Headers")
            ).toBeTruthy()
        })

        it("should add CORS headers to regular requests", () => {
            vi.mocked(getConfig).mockReturnValue({
                isDevelopment: true,
                isProduction: false,
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
                security: {
                    httpsEnforced: false,
                    secureCookies: false,
                    corsOrigins: [
                        "http://localhost:3000",
                        "http://localhost:3001",
                    ],
                    corsCredentials: true,
                    corsMaxAge: 86400,
                    rateLimitEnabled: true,
                    rateLimitWindow: 3600000,
                    rateLimitMaxAttempts: 5,
                },
                session: {} as any,
                logging: {} as any,
            })

            const request = createRequest({
                method: "GET",
                origin: "http://localhost:3000",
            })
            const response = corsMiddleware(request)

            expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
                "http://localhost:3000"
            )
            expect(
                response.headers.get("Access-Control-Allow-Credentials")
            ).toBe("true")
        })

        it("should not add CORS headers for disallowed origins in production", () => {
            vi.mocked(getConfig).mockReturnValue({
                isDevelopment: false,
                isProduction: true,
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
                security: {
                    httpsEnforced: true,
                    secureCookies: true,
                    corsOrigins: [
                        "https://gabrieltoth.com",
                        "https://www.gabrieltoth.com",
                    ],
                    corsCredentials: true,
                    corsMaxAge: 86400,
                    rateLimitEnabled: true,
                    rateLimitWindow: 3600000,
                    rateLimitMaxAttempts: 5,
                },
                session: {} as any,
                logging: {} as any,
            })

            const request = createRequest({
                method: "GET",
                origin: "https://evil.com",
            })
            const response = corsMiddleware(request)

            expect(
                response.headers.get("Access-Control-Allow-Origin")
            ).toBeNull()
        })
    })

    // ============================================================================
    // withCors() Tests
    // ============================================================================

    describe("withCors()", () => {
        it("should wrap a handler and add CORS headers to response", async () => {
            vi.mocked(getConfig).mockReturnValue({
                isDevelopment: true,
                isProduction: false,
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
                security: {
                    httpsEnforced: false,
                    secureCookies: false,
                    corsOrigins: [
                        "http://localhost:3000",
                        "http://localhost:3001",
                    ],
                    corsCredentials: true,
                    corsMaxAge: 86400,
                    rateLimitEnabled: true,
                    rateLimitWindow: 3600000,
                    rateLimitMaxAttempts: 5,
                },
                session: {} as any,
                logging: {} as any,
            })

            const handler = vi.fn().mockResolvedValue(
                NextResponse.json({ message: "ok" })
            )
            const wrapped = withCors(handler)

            const request = createRequest({
                method: "GET",
                origin: "http://localhost:3000",
            })
            const response = await wrapped(request)

            expect(handler).toHaveBeenCalledWith(request)
            expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
                "http://localhost:3000"
            )
        })

        it("should handle preflight requests in withCors wrapper", async () => {
            vi.mocked(getConfig).mockReturnValue({
                isDevelopment: true,
                isProduction: false,
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
                security: {
                    httpsEnforced: false,
                    secureCookies: false,
                    corsOrigins: [
                        "http://localhost:3000",
                        "http://localhost:3001",
                    ],
                    corsCredentials: true,
                    corsMaxAge: 86400,
                    rateLimitEnabled: true,
                    rateLimitWindow: 3600000,
                    rateLimitMaxAttempts: 5,
                },
                session: {} as any,
                logging: {} as any,
            })

            const handler = vi.fn()
            const wrapped = withCors(handler)

            const request = createRequest({
                method: "OPTIONS",
                origin: "http://localhost:3000",
            })
            const response = await wrapped(request)

            expect(handler).not.toHaveBeenCalled()
            expect(response.status).toBe(200)
            expect(
                response.headers.get("Access-Control-Allow-Origin")
            ).toBe("http://localhost:3000")
        })

        it("should return 403 when origin is not allowed in production", async () => {
            vi.mocked(getConfig).mockReturnValue({
                isDevelopment: false,
                isProduction: true,
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
                security: {
                    httpsEnforced: true,
                    secureCookies: true,
                    corsOrigins: [
                        "https://gabrieltoth.com",
                        "https://www.gabrieltoth.com",
                    ],
                    corsCredentials: true,
                    corsMaxAge: 86400,
                    rateLimitEnabled: true,
                    rateLimitWindow: 3600000,
                    rateLimitMaxAttempts: 5,
                },
                session: {} as any,
                logging: {} as any,
            })

            const handler = vi.fn().mockResolvedValue(
                NextResponse.json({ message: "ok" })
            )
            const wrapped = withCors(handler)

            const request = createRequest({
                method: "GET",
                origin: "https://evil.com",
            })
            const response = await wrapped(request)

            expect(handler).not.toHaveBeenCalled()
            expect(response.status).toBe(403)
            const body = await response.json()
            expect(body.error).toBe("CORS policy violation")
        })

        it("should handle plain Response from handler and convert to NextResponse", async () => {
            vi.mocked(getConfig).mockReturnValue({
                isDevelopment: true,
                isProduction: false,
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
                security: {
                    httpsEnforced: false,
                    secureCookies: false,
                    corsOrigins: [
                        "http://localhost:3000",
                        "http://localhost:3001",
                    ],
                    corsCredentials: true,
                    corsMaxAge: 86400,
                    rateLimitEnabled: true,
                    rateLimitWindow: 3600000,
                    rateLimitMaxAttempts: 5,
                },
                session: {} as any,
                logging: {} as any,
            })

            const handler = vi
                .fn()
                .mockResolvedValue(new Response("plain", { status: 200 }))
            const wrapped = withCors(handler)

            const request = createRequest({
                method: "GET",
                origin: "http://localhost:3000",
            })
            const response = await wrapped(request)

            expect(handler).toHaveBeenCalledWith(request)
            expect(response instanceof NextResponse).toBe(true)
            expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
                "http://localhost:3000"
            )
        })
    })

    // ============================================================================
    // getCorsConfiguration() Tests
    // ============================================================================

    describe("getCorsConfiguration()", () => {
        it("should return the full CORS configuration object", () => {
            const config = getCorsConfiguration()

            expect(config).toHaveProperty("allowedOrigins")
            expect(config).toHaveProperty("allowedMethods")
            expect(config).toHaveProperty("allowedHeaders")
            expect(config).toHaveProperty("credentials")
            expect(config).toHaveProperty("maxAge")
            expect(Array.isArray(config.allowedOrigins)).toBe(true)
            expect(Array.isArray(config.allowedMethods)).toBe(true)
            expect(config.allowedMethods).toContain("GET")
            expect(config.allowedMethods).toContain("OPTIONS")
        })
    })
})
