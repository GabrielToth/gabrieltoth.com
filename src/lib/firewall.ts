import { NextRequest } from "next/server"

export interface FirewallCheck {
    ok: boolean
    reason?: string
}

export function getClientIp(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for")
    const real = req.headers.get("x-real-ip")
    if (forwarded) return forwarded.split(",")[0].trim()
    if (real) return real
    return "127.0.0.1"
}

export function basicFirewall(
    req: NextRequest,
    allowedHosts: string[]
): FirewallCheck {
    const origin = req.headers.get("origin") || ""
    const referer = req.headers.get("referer") || ""
    const userAgent = req.headers.get("user-agent") || ""
    const contentLength = Number(req.headers.get("content-length") || 0)

    // Block empty UA
    if (!userAgent.trim()) {
        return { ok: false, reason: "EMPTY_UA" }
    }

    // Origin/Referer basic validation in production (allow local Playwright E2E)
    if (process.env.NODE_ENV === "production") {
        const isLocalE2E =
            origin.startsWith("http://localhost:") ||
            referer.startsWith("http://localhost:")
        if (isLocalE2E) {
            return { ok: true }
        }
        const allowed = allowedHosts.some(
            h => origin.startsWith(h) || referer.startsWith(h)
        )
        if (!allowed) return { ok: false, reason: "INVALID_ORIGIN" }
    }

    // Payload limit (2 MB)
    if (contentLength > 2 * 1024 * 1024) {
        return { ok: false, reason: "PAYLOAD_TOO_LARGE" }
    }

    return { ok: true }
}
