/**
 * POST /api/auth/otp/verify
 *
 * Verifies an OTP code submitted by the user (against Twilio Verify or
 * the in-memory test store).
 *
 * Body:
 * - phone: string (required, E.164 or normalized)
 * - code: string  (required, 6-digit)
 *
 * Returns:
 * - 200: { success: true } when code is correct
 * - 400: Invalid request format
 * - 401: Code incorrect
 * - 429: Rate limited
 * - 500: Server error
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { verifyOtp } from "@/lib/otp-service"
import { checkRateLimitWithDegradation } from "@/lib/auth/rate-limiter"
import { getClientIp } from "@/lib/firewall"
import { logger } from "@/lib/logger"

const otpVerifySchema = z.object({
    phone: z.string().min(1, "Phone is required"),
    code: z
        .string()
        .length(6, "Code must be 6 digits")
        .regex(/^\d+$/, "Code must contain only digits"),
})

export async function POST(request: NextRequest) {
    const ipAddress = getClientIp(request)

    // Verification gets stricter rate limiting ("degraded mode" = harder threshold)
    const rateCheck = await checkRateLimitWithDegradation(ipAddress, true)
    if (!rateCheck.allowed) {
        logger.warn("OTP verify rate limited", {
            context: "OtpVerifyApi",
            data: { ipAddress },
        })
        return NextResponse.json(
            {
                success: false,
                error: "Too many attempts. Please try again later.",
            },
            { status: 429 }
        )
    }

    try {
        const body = await request.json()
        const parsed = otpVerifySchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid request data",
                    details: parsed.error.issues.map(i => ({
                        path: i.path,
                        message: i.message,
                    })),
                },
                { status: 400 }
            )
        }

        const { phone, code } = parsed.data

        const result = await verifyOtp({
            phone,
            code,
            ipAddress,
        })

        if (!result.valid) {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error || "Invalid code",
                },
                { status: 401 }
            )
        }

        logger.info("OTP verified successfully", {
            context: "OtpVerifyApi",
            data: { phone },
        })

        return NextResponse.json(
            {
                success: true,
            },
            { status: 200 }
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("OTP verify failed", {
            context: "OtpVerifyApi",
            data: { error: err.message },
        })
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        )
    }
}
