/**
 * Tests for POST /api/auth/otp/verify
 *
 * Covers:
 * - Successful verification (200)
 * - Invalid code (401)
 * - Rate limiting (429)
 * - Validation failure (400)
 * - Server error (500)
 */

import { describe, expect, it, vi, beforeEach } from "vitest"
import { POST } from "./route"
import { NextRequest } from "next/server"

// Mock logger
vi.mock("@/lib/logger", () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}))

// Mock rate limiter
const mockRateCheck = vi.fn()
vi.mock("@/lib/auth/rate-limiter", () => ({
    checkRateLimitWithDegradation: (...args: unknown[]) =>
        mockRateCheck(...args),
}))

// Mock firewall getClientIp
vi.mock("@/lib/firewall", () => ({
    getClientIp: () => "127.0.0.1",
}))

// Mock OTP service
const mockVerifyOtp = vi.fn()
vi.mock("@/lib/otp-service", () => ({
    verifyOtp: (...args: unknown[]) => mockVerifyOtp(...args),
}))

function makeRequest(body: unknown): NextRequest {
    return new NextRequest("http://localhost/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    })
}

describe("POST /api/auth/otp/verify", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockRateCheck.mockResolvedValue({
            allowed: true,
            remainingAttempts: 5,
            degradedMode: false,
        })
    })

    it("verifies correct OTP code", async () => {
        mockVerifyOtp.mockResolvedValueOnce({ valid: true })

        const req = makeRequest({
            phone: "+5511993313606",
            code: "123456",
        })
        const res = await POST(req)
        const data = await res.json()

        expect(res.status).toBe(200)
        expect(data.success).toBe(true)
        expect(mockVerifyOtp).toHaveBeenCalledWith({
            phone: "+5511993313606",
            code: "123456",
            ipAddress: "127.0.0.1",
        })
    })

    it("returns 401 on invalid code", async () => {
        mockVerifyOtp.mockResolvedValueOnce({
            valid: false,
            error: "Invalid code",
        })

        const req = makeRequest({
            phone: "+5511993313606",
            code: "654321",
        })
        const res = await POST(req)
        const data = await res.json()

        expect(res.status).toBe(401)
        expect(data.success).toBe(false)
        expect(data.error).toBe("Invalid code")
    })

    it("returns 429 when rate limited", async () => {
        mockRateCheck.mockResolvedValue({
            allowed: false,
            remainingAttempts: 0,
            degradedMode: true,
        })

        const req = makeRequest({
            phone: "+5511993313606",
            code: "123456",
        })
        const res = await POST(req)
        const data = await res.json()

        expect(res.status).toBe(429)
        expect(mockVerifyOtp).not.toHaveBeenCalled()
    })

    it("returns 400 when phone is missing", async () => {
        const req = makeRequest({ code: "123456" })
        const res = await POST(req)
        const data = await res.json()

        expect(res.status).toBe(400)
        expect(data.error).toBe("Invalid request data")
    })

    it("returns 400 when code is not 6 digits", async () => {
        const req = makeRequest({
            phone: "+5511993313606",
            code: "12345",
        })
        const res = await POST(req)
        const data = await res.json()

        expect(res.status).toBe(400)
        expect(data.error).toBe("Invalid request data")
        expect(
            data.details.some(
                (d: { path: string[] }) => d.path[0] === "code"
            )
        ).toBe(true)
    })

    it("returns 400 when code contains letters", async () => {
        const req = makeRequest({
            phone: "+5511993313606",
            code: "12345a",
        })
        const res = await POST(req)
        const data = await res.json()

        expect(res.status).toBe(400)
    })

    it("returns 500 on unexpected exception", async () => {
        mockVerifyOtp.mockRejectedValueOnce(new Error("DB crash"))

        const req = makeRequest({
            phone: "+5511993313606",
            code: "123456",
        })
        const res = await POST(req)
        const data = await res.json()

        expect(res.status).toBe(500)
        expect(data.error).toBe("Internal server error")
    })
})