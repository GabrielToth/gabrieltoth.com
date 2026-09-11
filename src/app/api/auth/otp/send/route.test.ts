/**
 * Tests for POST /api/auth/otp/send
 *
 * Covers:
 * - Successful SMS OTP send (channel "sms")
 * - Successful email fallback (channel "email")
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
const mockSendOtp = vi.fn()
vi.mock("@/lib/otp-service", () => ({
    sendOtp: (...args: unknown[]) => mockSendOtp(...args),
}))

function makeRequest(body: unknown): NextRequest {
    return new NextRequest("http://localhost/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    })
}

describe("POST /api/auth/otp/send", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockRateCheck.mockResolvedValue({
            allowed: true,
            remainingAttempts: 5,
            degradedMode: false,
        })
    })

    it("sends SMS OTP when phone is provided", async () => {
        mockSendOtp.mockResolvedValueOnce({
            success: true,
            channel: "sms",
            sid: "VE-1",
        })

        const req = makeRequest({
            phone: "+5511993313606",
            email: "user@example.com",
            locale: "en",
        })
        const res = await POST(req)
        const data = await res.json()

        expect(res.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.channel).toBe("sms")
        expect(mockSendOtp).toHaveBeenCalledWith({
            phone: "+5511993313606",
            email: "user@example.com",
            locale: "en",
            ipAddress: "127.0.0.1",
        })
    })

    it("falls back to email channel", async () => {
        mockSendOtp.mockResolvedValueOnce({
            success: true,
            channel: "email",
        })

        const req = makeRequest({
            phone: "+5511993313606",
            email: "user@example.com",
        })
        const res = await POST(req)
        const data = await res.json()

        expect(res.status).toBe(200)
        expect(data.channel).toBe("email")
    })

    it("returns 429 when rate limited", async () => {
        mockRateCheck.mockResolvedValue({
            allowed: false,
            remainingAttempts: 0,
            degradedMode: false,
        })

        const req = makeRequest({
            phone: "+5511993313606",
            email: "user@example.com",
        })
        const res = await POST(req)
        const data = await res.json()

        expect(res.status).toBe(429)
        expect(data.success).toBe(false)
        expect(mockSendOtp).not.toHaveBeenCalled()
    })

    it("returns 400 for invalid body (bad email)", async () => {
        const req = makeRequest({
            phone: "+5511993313606",
            email: "not-an-email",
        })
        const res = await POST(req)
        const data = await res.json()

        expect(res.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toBe("Invalid request data")
    })

    it("returns 400 when email is missing", async () => {
        const req = makeRequest({
            phone: "+5511993313606",
        })
        const res = await POST(req)
        const data = await res.json()

        expect(res.status).toBe(400)
        expect(data.error).toBe("Invalid request data")
    })

    it("returns 500 when sendOtp fails", async () => {
        mockSendOtp.mockResolvedValueOnce({
            success: false,
            error: "Twilio error",
            channel: "email",
        })

        const req = makeRequest({
            phone: "+5511993313606",
            email: "user@example.com",
        })
        const res = await POST(req)
        const data = await res.json()

        expect(res.status).toBe(500)
        expect(data.success).toBe(false)
        expect(data.error).toBe("Twilio error")
    })

    it("returns 500 on unexpected exception", async () => {
        mockSendOtp.mockRejectedValueOnce(new Error("Network failure"))

        const req = makeRequest({
            phone: "+5511993313606",
            email: "user@example.com",
        })
        const res = await POST(req)
        const data = await res.json()

        expect(res.status).toBe(500)
        expect(data.error).toBe("Internal server error")
    })
})