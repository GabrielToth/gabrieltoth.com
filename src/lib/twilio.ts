/**
 * Twilio Verify Service
 *
 * Wraps the Twilio Verify API (SMS channel) for sending one-time passcodes
 * and checking them. Uses Account SID + Auth Token for Basic auth.
 *
 * Required env:
 *   - TWILIO_ACCOUNT_SID  (format "AC...")
 *   - TWILIO_AUTH_TOKEN
 *   - TWILIO_VERIFY_SERVICE_SID  (format "VA...")
 */

import { logger } from "@/lib/logger"

const VERIFY_BASE_URL = "https://verify.twilio.com/v2/Services"
const REQUEST_TIMEOUT_MS = 15_000

export interface SendOtpResult {
    success: boolean
    sid?: string
    error?: string
    status?: string
}

export interface VerifyOtpResult {
    success: boolean
    status?: string
    error?: string
}

function getCredentials():
    | { accountSid: string; authToken: string; serviceSid: string }
    | { error: string } {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID

    if (!accountSid || !authToken || !serviceSid) {
        return {
            error: "Twilio is not configured (missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_VERIFY_SERVICE_SID).",
        }
    }
    return { accountSid, authToken, serviceSid }
}

function basicAuth(accountSid: string, authToken: string): string {
    const credentials = `${accountSid}:${authToken}`
    return `Basic ${Buffer.from(credentials).toString("base64")}`
}

function normalizeToE164(phone: string): string {
    const digits = phone.replace(/[^\d+]/g, "")
    if (digits.startsWith("+")) {
        return digits
    }
    return `+${digits}`
}

/**
 * Sends a one-time passcode via SMS using Twilio Verify.
 */
export async function sendVerificationCode(
    phone: string
): Promise<SendOtpResult> {
    const creds = getCredentials()
    if ("error" in creds) {
        return { success: false, error: creds.error }
    }

    const to = normalizeToE164(phone)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
        const response = await fetch(
            `${VERIFY_BASE_URL}/${creds.serviceSid}/Verifications`,
            {
                method: "POST",
                headers: {
                    Authorization: basicAuth(creds.accountSid, creds.authToken),
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    To: to,
                    Channel: "sms",
                }).toString(),
                signal: controller.signal,
            }
        )

        const data = (await response.json().catch(() => ({}))) as {
            sid?: string
            status?: string
            message?: string
        }

        if (!response.ok) {
            logger.warn("Twilio rejected verification send", {
                context: "TwilioVerify",
                data: { status: response.status, error: data.message },
            })
            return {
                success: false,
                error: data.message || `HTTP ${response.status}`,
            }
        }

        logger.info("Verification code sent", {
            context: "TwilioVerify",
            data: { sid: data.sid, status: data.status },
        })
        return { success: true, sid: data.sid, status: data.status }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error"
        logger.error("Twilio verification send failed", {
            context: "TwilioVerify",
            data: { error: message },
        })
        return { success: false, error: message }
    } finally {
        clearTimeout(timeout)
    }
}

/**
 * Checks a one-time passcode submitted by the user.
 */
export async function checkVerificationCode(
    phone: string,
    code: string
): Promise<VerifyOtpResult> {
    const creds = getCredentials()
    if ("error" in creds) {
        return { success: false, error: creds.error }
    }

    if (!code || code.trim().length === 0) {
        return { success: false, error: "Code is required" }
    }

    const to = normalizeToE164(phone)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
        const response = await fetch(
            `${VERIFY_BASE_URL}/${creds.serviceSid}/VerificationCheck`,
            {
                method: "POST",
                headers: {
                    Authorization: basicAuth(creds.accountSid, creds.authToken),
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    To: to,
                    Code: code.trim(),
                }).toString(),
                signal: controller.signal,
            }
        )

        const data = (await response.json().catch(() => ({}))) as {
            status?: string
            valid?: boolean
            message?: string
        }

        if (!response.ok) {
            logger.warn("Twilio rejected verification check", {
                context: "TwilioVerify",
                data: { status: response.status, error: data.message },
            })
            return {
                success: false,
                error: data.message || `HTTP ${response.status}`,
            }
        }

        const approved = data.status === "approved"
        if (!approved) {
            logger.warn("Verification code check failed", {
                context: "TwilioVerify",
                data: { status: data.status },
            })
            return {
                success: false,
                status: data.status,
                error: "Invalid or expired code",
            }
        }

        logger.info("Verification code approved", {
            context: "TwilioVerify",
            data: { status: data.status },
        })
        return { success: true, status: data.status }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error"
        logger.error("Twilio verification check failed", {
            context: "TwilioVerify",
            data: { error: message },
        })
        return { success: false, error: message }
    } finally {
        clearTimeout(timeout)
    }
}
