/**
 * HTTPS Enforcement Middleware Tests
 * Covers: httpsEnforcementMiddleware, withHttpsEnforcement, isHttpsRequest,
 *         getHttpsEnforcementConfiguration
 *
 * Validates: Requirement 22.6 - Configure HTTPS enforcement (production)
 */

import { getConfig } from "@/config/environment"
import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    getHttpsEnforcementConfiguration,
    httpsEnforcementMiddleware,
    isHttpsRequest,
    withHttpsEnforcement,
} from "./https-enforcement"

// Mock config to control environment in tests
vi.mock("@/config/environment", () => ({
    getConfig: vi.fn(),
}))

describe("HTTPS Enforcement Middleware", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ============================================================================
    // httpsEnforcementMiddleware() Tests
    // ============================================================================

    describe("httpsEnforcementMiddleware()", () => {
        it("should pass through when HTTPS is not enforced (development)", () => {
            vi.mocked(getConfig).mockReturnValue({
                security: { httpsEnforced: false },
            } as any)

            const request = new NextRequest("http://localhost:3000/dashboard")
            const response = httpsEnforcementMiddleware(request)

            expect(response.status).toBe(200)
            expect(response.headers.get("location")).toBeNull()
        })

        it("should redirect HTTP to HTTPS when enforcement is enabled", () => {
            vi.mocked(getConfig).mockReturnValue({
                security: { httpsEnforced: true },
            } as any)

            const request = new NextRequest("http://localhost:3000/dashboard")
            const response = httpsEnforcementMiddleware(request)

            expect(response.status).toBe(301)
            const location = response.headers.get("location")
            expect(location).not.toBeNull()
            expect(location).toContain("https://localhost:3000/dashboard")
        })

        it("should add HSTS header for HTTPS requests", () => {
            vi.mocked(getConfig).mockReturnValue({
                security: { httpsEnforced: true },
            } as any)

            const request = new NextRequest(
                "https://localhost:3000/dashboard",
                {
                    headers: { "x-forwarded-proto": "https" },
                }
            )
            const response = httpsEnforcementMiddleware(request)

            expect(response.status).toBe(200)
            expect(response.headers.get("Strict-Transport-Security")).toContain(
                "max-age=31536000"
            )
            expect(response.headers.get("Strict-Transport-Security")).toContain(
                "includeSubDomains"
            )
        })

        it("should default to HTTP when x-forwarded-proto header is missing", () => {
            vi.mocked(getConfig).mockReturnValue({
                security: { httpsEnforced: true },
            } as any)

            const request = new NextRequest("http://localhost:3000/dashboard")
            const response = httpsEnforcementMiddleware(request)

            // Should redirect since no x-forwarded-proto means default is "http"
            expect(response.status).toBe(301)
        })
    })

    // ============================================================================
    // withHttpsEnforcement() Tests
    // ============================================================================

    describe("withHttpsEnforcement()", () => {
        it("should pass through handler when HTTPS is not enforced", async () => {
            vi.mocked(getConfig).mockReturnValue({
                security: { httpsEnforced: false },
            } as any)

            const handler = vi
                .fn()
                .mockResolvedValue(NextResponse.json({ message: "ok" }))
            const wrapped = withHttpsEnforcement(handler)

            const request = new NextRequest("http://localhost:3000/api/test")
            const response = await wrapped(request)

            expect(handler).toHaveBeenCalledWith(request)
            expect(response.status).toBe(200)
        })

        it("should return 403 for HTTP requests when HTTPS is enforced", async () => {
            vi.mocked(getConfig).mockReturnValue({
                security: { httpsEnforced: true },
            } as any)

            const handler = vi.fn()
            const wrapped = withHttpsEnforcement(handler)

            const request = new NextRequest("http://localhost:3000/api/test")
            const response = await wrapped(request)

            expect(handler).not.toHaveBeenCalled()
            expect(response.status).toBe(403)
            const body = await response.json()
            expect(body.error).toBe("HTTPS required")
            expect(body.message).toContain("secure connection")
        })

        it("should add HSTS header for HTTPS requests when enforced", async () => {
            vi.mocked(getConfig).mockReturnValue({
                security: { httpsEnforced: true },
            } as any)

            const handler = vi
                .fn()
                .mockResolvedValue(NextResponse.json({ message: "ok" }))
            const wrapped = withHttpsEnforcement(handler)

            const request = new NextRequest("https://localhost:3000/api/test", {
                headers: { "x-forwarded-proto": "https" },
            })
            const response = await wrapped(request)

            expect(handler).toHaveBeenCalledWith(request)
            expect(response.headers.get("Strict-Transport-Security")).toContain(
                "max-age=31536000"
            )
        })

        it("should convert plain Response to NextResponse", async () => {
            vi.mocked(getConfig).mockReturnValue({
                security: { httpsEnforced: false },
            } as any)

            const handler = vi
                .fn()
                .mockResolvedValue(new Response("plain", { status: 200 }))
            const wrapped = withHttpsEnforcement(handler)

            const request = new NextRequest("http://localhost:3000/api/test")
            const response = await wrapped(request)

            expect(response instanceof NextResponse).toBe(true)
        })
    })

    // ============================================================================
    // isHttpsRequest() Tests
    // ============================================================================

    describe("isHttpsRequest()", () => {
        it("should return true when x-forwarded-proto is https", () => {
            const request = new NextRequest("http://localhost:3000/dashboard", {
                headers: { "x-forwarded-proto": "https" },
            })
            expect(isHttpsRequest(request)).toBe(true)
        })

        it("should return false when x-forwarded-proto is http", () => {
            const request = new NextRequest("http://localhost:3000/dashboard", {
                headers: { "x-forwarded-proto": "http" },
            })
            expect(isHttpsRequest(request)).toBe(false)
        })

        it("should return false when x-forwarded-proto header is missing", () => {
            const request = new NextRequest("http://localhost:3000/dashboard")
            expect(isHttpsRequest(request)).toBe(false)
        })
    })

    // ============================================================================
    // getHttpsEnforcementConfiguration() Tests
    // ============================================================================

    describe("getHttpsEnforcementConfiguration()", () => {
        it("should return the enforcement configuration from the config", () => {
            const enforcementConfig = getHttpsEnforcementConfiguration()

            expect(enforcementConfig).toHaveProperty("enforced")
            expect(enforcementConfig).toHaveProperty("hstsMaxAge")
            expect(enforcementConfig).toHaveProperty("hstsIncludeSubDomains")
            expect(enforcementConfig).toHaveProperty("hstsPreload")
            expect(enforcementConfig.hstsMaxAge).toBe(31536000)
            expect(enforcementConfig.hstsIncludeSubDomains).toBe(true)
            expect(enforcementConfig.hstsPreload).toBe(true)
        })
    })
})
