/**
 * CSRF Protection Middleware
 * Implements CSRF token generation, validation, and injection
 */

import crypto from "crypto"
import { generateCsrfToken } from "@/lib/auth/password-hashing"
import { logger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"

const csrfTokenStore = new Map<string, { token: string; expiresAt: number }>()

// Clean up expired tokens only in non-Edge environments
if (typeof setInterval !== "undefined") {
    setInterval(
        () => {
            const now = Date.now()
            for (const [key, value] of csrfTokenStore.entries()) {
                if (value.expiresAt < now) {
                    csrfTokenStore.delete(key)
                }
            }
        },
        5 * 60 * 1000
    )
}

export function generateCsrfTokenForSession(sessionToken: string): string {
    const csrfToken = generateCsrfToken()
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000

    csrfTokenStore.set(sessionToken, {
        token: csrfToken,
        expiresAt,
    })

    return csrfToken
}

export function validateCsrfToken(
    sessionToken: string,
    csrfToken: string
): boolean {
    if (!csrfToken || typeof csrfToken !== "string") {
        logger.warn("CSRF token is null, undefined, or not a string", {
            context: "Security",
        })
        return false
    }

    const stored = csrfTokenStore.get(sessionToken)

    if (!stored) {
        logger.warn("CSRF token not found for session", {
            context: "Security",
        })
        return false
    }

    if (stored.expiresAt < Date.now()) {
        csrfTokenStore.delete(sessionToken)
        logger.warn("CSRF token expired", {
            context: "Security",
        })
        return false
    }

    const storedBuf = Buffer.from(stored.token)
    const givenBuf = Buffer.from(csrfToken)

    if (storedBuf.length !== givenBuf.length) {
        logger.warn("CSRF token mismatch", {
            context: "Security",
        })
        return false
    }

    if (!crypto.timingSafeEqual(storedBuf, givenBuf)) {
        logger.warn("CSRF token mismatch", {
            context: "Security",
        })
        return false
    }

    return true
}

export function invalidateCsrfToken(sessionToken: string): void {
    csrfTokenStore.delete(sessionToken)
}

export async function validateCsrfMiddleware(
    request: NextRequest
): Promise<NextResponse | null> {
    const method = request.method
    if (!["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
        return null
    }

    const sessionToken = request.cookies.get("auth_session")?.value
    let csrfToken: string | null = null

    csrfToken = request.headers.get("x-csrf-token")

    if (!csrfToken) {
        try {
            const body = await request.json()
            csrfToken = body.csrfToken
        } catch {
            try {
                const formData = await request.formData()
                csrfToken = formData.get("csrfToken") as string
            } catch {
                // No CSRF token found
            }
        }
    }

    if (
        !csrfToken ||
        !sessionToken ||
        !validateCsrfToken(sessionToken, csrfToken)
    ) {
        logger.warn("CSRF validation failed", {
            context: "Security",
            data: {
                method,
                hasToken: !!csrfToken,
                hasSession: !!sessionToken,
            },
        })

        return NextResponse.json(
            {
                success: false,
                error: "Invalid CSRF token",
            },
            { status: 403 }
        )
    }

    return null
}

export function getCsrfToken(sessionToken: string): string | null {
    const stored = csrfTokenStore.get(sessionToken)

    if (!stored) {
        return null
    }

    if (stored.expiresAt < Date.now()) {
        csrfTokenStore.delete(sessionToken)
        return null
    }

    return stored.token
}

export function injectCsrfToken(csrfToken: string): { csrfToken: string } {
    return { csrfToken }
}
