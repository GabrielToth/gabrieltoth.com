/**
 * GET /api/user/invoices/[id]/download
 * Download invoice PDF (not available - Stripe integration not yet implemented)
 */

import { buildClientKey, rateLimitByKey } from "@/lib/rate-limit"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    const clientIp =
        request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"
    const rateLimit = await rateLimitByKey(
        buildClientKey({
            ip: clientIp,
            path: "/api/user/invoices/download",
            userAgent: request.headers.get("user-agent"),
        })
    )
    if (!rateLimit.success)
        return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            { status: 429 }
        )

    return NextResponse.json(
        { error: "Invoices not available" },
        { status: 404 }
    )
}
