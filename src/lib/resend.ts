/**
 * Resend Email Sender
 *
 * Thin wrapper around the Resend HTTP API (`https://api.resend.com/emails`).
 * Reads sender identity from `RESEND_FROM_EMAIL` / `RESEND_FROM_NAME` with a
 * sensible fallback, and normalizes errors so callers can degrade gracefully.
 */

import { logger } from "@/lib/logger"

export interface SendEmailOptions {
    to: string | string[]
    subject: string
    html: string
    from?: string
    replyTo?: string
}

export interface SendEmailResult {
    success: boolean
    id?: string
    error?: string
}

const RESEND_API_URL = "https://api.resend.com/emails"
const REQUEST_TIMEOUT_MS = 15_000

function buildFromHeader(override?: string): string {
    if (override) {
        return override
    }
    const email = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM
    const name = process.env.RESEND_FROM_NAME || "Gabriel Toth"
    if (email && name) {
        return `${name} <${email}>`
    }
    if (email) {
        return email
    }
    return "Gabriel Toth <contato@gabrieltoth.com>"
}

export async function sendEmail(
    options: SendEmailOptions
): Promise<SendEmailResult> {
    const apiKey = process.env.RESEND_API_KEY

    if (!apiKey) {
        const devFallback = process.env.NODE_ENV !== "production"
        if (devFallback) {
            logger.warn("Resend key missing — logging email in dev", {
                context: "Resend",
                data: {
                    to: options.to,
                    subject: options.subject,
                },
            })
            return { success: true, id: "dev_mock_id" }
        }
        return {
            success: false,
            error: "RESEND_API_KEY environment variable not configured.",
        }
    }

    const recipients = Array.isArray(options.to) ? options.to : [options.to]

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
        const response = await fetch(RESEND_API_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: buildFromHeader(options.from),
                to: recipients,
                subject: options.subject,
                html: options.html,
                ...(options.replyTo ? { reply_to: options.replyTo } : {}),
            }),
            signal: controller.signal,
        })

        if (!response.ok) {
            const errData = (await response.json().catch(() => ({}))) as {
                message?: string
                name?: string
            }
            const errorMessage =
                errData.message || errData.name || `HTTP ${response.status}`
            logger.error("Resend rejected email", {
                context: "Resend",
                data: {
                    status: response.status,
                    error: errorMessage,
                    to: recipients,
                },
            })
            return {
                success: false,
                error: errorMessage,
            }
        }

        const data = (await response.json()) as { id?: string }
        return { success: true, id: data.id }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error"
        const isAbort = err instanceof Error && err.name === "AbortError"
        logger.error("Resend request failed", {
            context: "Resend",
            data: { to: recipients, error: message, aborted: isAbort },
        })
        return {
            success: false,
            error: isAbort ? "Request timed out" : message,
        }
    } finally {
        clearTimeout(timeout)
    }
}
