/**
 * POST /api/auth/otp/send
 *
 * Sends an OTP (One-Time Password) to a phone number via SMS (Twilio
 * Verify) with automatic email fallback (Resend).
 *
 * Body:
 * - phone?: string - Phone in any format (e.g. "+55 (11) 99331-3606")
 * - email: string - User's email (required for fallback and accounting)
 * - locale?: string - BCP-47 tag, for subject/link localization
 *
 * Returns:
 * - 200: { success: true, channel: "sms" | "email" }
 * - 400: Invalid input
 * - 429: Too many requests
 * - 500: Server error
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { sendOtp } from "@/lib/otp-service"
import { checkRateLimitWithDegradation } from "@/lib/auth/rate-limiter"
import { getClientIp } from "@/lib/firewall"
import { logger } from "@/lib/logger"

const otpSendSchema = z.object({
    phone: z.string().optional(),
    email: z.string().email(),
    locale: z.string().optional(),
})

export async function POST(request: NextRequest) {
    const ipAddress = getClientIp(request)

    // Rate limit by IP before processing
    const rateCheck = await checkRateLimitWithDegradation(ipAddress)
    if (!rateCheck.allowed) {
        logger.warn("OTP send rate limited", {
            context: "OtpSendApi",
            data: { ipAddress },
        })
        return NextResponse.json(
            {
                success: false,
                error: "Too many requests. Please try again later.",
            },
            { status: 429 }
        )
    }

    try {
        const body = await request.json()
        const parsed = otpSendSchema.safeParse(body)

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

        const { phone, email, locale } = parsed.data

        const result = await sendOtp({
            phone,
            email,
            locale: locale || "en",
            ipAddress,
        })

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error || "Failed to send OTP",
                    channel: result.channel,
                },
                { status: 500 }
            )
        }

        logger.info("OTP send result", {
            context: "OtpSendApi",
            data: { channel: result.channel, email },
        })

        return NextResponse.json(
            {
                success: true,
                channel: result.channel,
            },
            { status: 200 }
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("OTP send failed", {
            context: "OtpSendApi",
            data: { error: err.message },
        })
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        )
    }
}
