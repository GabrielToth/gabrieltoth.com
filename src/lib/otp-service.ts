/**
 * OTP Service
 *
 * Manages sending one-time passwords (OTP) via SMS using Twilio Verify,
 * with fallback to email via Resend. Includes cooldown handling to prevent
 * spam and a simple in-memory store for verification codes when Redis
 * is unavailable.
 *
 * Environment:
 *   - TWILIO_ACCOUNT_SID  (Account SID starting with "AC")
 *   - TWILIO_AUTH_TOKEN
 *   - TWILIO_VERIFY_SERVICE_SID  (Service SID starting with "VA")
 *   - RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_FROM_NAME
 */

import { sendVerificationCode, checkVerificationCode } from "@/lib/twilio"
import { sendVerificationEmail } from "@/lib/auth/email-service"
import { checkRateLimitWithDegradation } from "@/lib/auth/rate-limiter"
import { logger } from "@/lib/logger"

const OTP_CODE_LENGTH = 6
const OTP_TTL_SECONDS = 300

interface StoredCode {
    code: string
    expiresAt: number
}

type CodeStore = Map<string, StoredCode>

// In-memory fallback store (cleared on server restart)
const codeStore: CodeStore = new Map()

/**
 * Generates a simple 6-digit random code.
 */
function generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

function normalizePhone(phone: string): string {
    return phone.replace(/\D/g, "")
}

/**
 * Sends an OTP via SMS (Twilio Verify) or email (fallback).
 * Returns success status and the channel used.
 */
export async function sendOtp(opts: {
    phone?: string
    email: string
    locale?: string
    ipAddress: string
}): Promise<{
    success: boolean
    channel: "sms" | "email"
    error?: string
    sid?: string
}> {
    const { phone, email, locale = "en", ipAddress } = opts

    // Rate limit by IP
    const rateLimit = await checkRateLimitWithDegradation(ipAddress)
    if (!rateLimit.allowed) {
        logger.warn("OTP request rate limited by IP", {
            context: "OtpService",
            data: { ipAddress },
        })
        return { success: false, channel: "email", error: "Too many requests" }
    }

    // If no phone provided, fall back to email immediately
    if (!phone) {
        const result = await sendVerificationEmail(
            email,
            `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/auth/verify-otp?email=${encodeURIComponent(email)}`
        )
        return {
            success: result,
            channel: "email",
            error: result ? undefined : "Failed to send email",
        }
    }

    const normalizedPhone = normalizePhone(phone)

    // Try Twilio Verify SMS
    const smsResult = await sendVerificationCode(phone)

    if (smsResult.success) {
        logger.info("SMS verification code sent", {
            context: "OtpService",
            data: { phone: normalizedPhone },
        })
        return { success: true, channel: "sms", sid: smsResult.sid }
    }

    // Fallback to email
    logger.warn("Twilio SMS failed, falling back to email", {
        context: "OtpService",
        data: { phone: normalizedPhone, error: smsResult.error },
    })

    const emailResult = await sendVerificationEmail(
        email,
        `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/auth/verify-otp?email=${encodeURIComponent(email)}`
    )

    return {
        success: emailResult,
        channel: "email",
        error: emailResult
            ? undefined
            : smsResult.error || "Failed to send email",
    }
}

/**
 * Generates and stores a custom OTP for testing/development.
 * Use only in non-production environments.
 */
export function generateTestOtp(
    phone: string,
    _email: string
): { code: string; success: boolean } {
    const code = generateOtpCode()
    const key = `otp_${normalizePhone(phone)}`

    // Store in memory
    codeStore.set(key, {
        code,
        expiresAt: Date.now() + OTP_TTL_SECONDS * 1000,
    })

    logger.info("Test OTP generated", {
        context: "OtpService",
        data: { phone: normalizePhone(phone), code: "***" },
    })

    return { code, success: true }
}

/**
 * Validates an OTP. First checks in-memory store (for test/dev),
 * then delegates to Twilio Verify if configured.
 */
export async function verifyOtp(opts: {
    phone?: string
    code: string
    ipAddress: string
}): Promise<{ valid: boolean; error?: string }> {
    const { phone, code, ipAddress } = opts

    const trimmedCode = code.trim()

    // Basic validation
    if (!trimmedCode || trimmedCode.length !== OTP_CODE_LENGTH) {
        return { valid: false, error: "Invalid code format" }
    }

    const normalizedPhone = phone ? normalizePhone(phone) : ""

    // Rate limit verification attempts
    const rateLimit = await checkRateLimitWithDegradation(ipAddress, true)
    if (!rateLimit.allowed) {
        logger.warn("OTP verification rate limited", {
            context: "OtpService",
            data: { phone: normalizedPhone },
        })
        return { valid: false, error: "Too many attempts" }
    }

    if (!phone) {
        return { valid: false, error: "Phone number required for verification" }
    }

    // Check in-memory store first (dev/test fallback)
    const key = `otp_${normalizedPhone}`
    const stored = codeStore.get(key)

    if (stored) {
        if (Date.now() > stored.expiresAt) {
            codeStore.delete(key)
            return { valid: false, error: "OTP expired" }
        }
        if (stored.code === trimmedCode) {
            codeStore.delete(key)
            return { valid: true }
        }
        return { valid: false, error: "Invalid code" }
    }

    // Delegate to Twilio Verify if configured
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        const result = await checkVerificationCode(phone, trimmedCode)
        return { valid: result.success, error: result.error }
    }

    return { valid: false, error: "Verification not configured" }
}
