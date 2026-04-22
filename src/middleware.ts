import { NextRequest, NextResponse } from "next/server"

// Simple in-memory rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function getRateLimitKey(ip: string, endpoint: string): string {
    return `${ip}:${endpoint}`
}

function checkRateLimit(
    ip: string,
    endpoint: string,
    maxRequests: number,
    windowMs: number
): boolean {
    const key = getRateLimitKey(ip, endpoint)
    const now = Date.now()
    const record = rateLimitStore.get(key)

    if (!record || now > record.resetTime) {
        rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
        return true
    }

    if (record.count < maxRequests) {
        record.count++
        return true
    }

    return false
}

export async function middleware(request: NextRequest) {
    // Check account completion status and redirect if necessary
    const completionResponse = await checkAccountCompletion(request)
    if (completionResponse) {
        return completionResponse
    }

    // Enforce HTTPS in production
    if (
        process.env.NODE_ENV === "production" &&
        request.headers.get("x-forwarded-proto") !== "https"
    ) {
        const url = request.nextUrl.clone()
        url.protocol = "https"
        return NextResponse.redirect(url)
    }

    const response = NextResponse.next()

    // Add security headers
    response.headers.set(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains; preload"
    )
    response.headers.set(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    )
    response.headers.set("X-Content-Type-Options", "nosniff")
    response.headers.set("X-Frame-Options", "DENY")
    response.headers.set("X-XSS-Protection", "1; mode=block")
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.set(
        "Permissions-Policy",
        "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
    )

    // Rate limiting for auth endpoints
    const ip = request.ip || "unknown"
    const pathname = request.nextUrl.pathname

    if (pathname === "/api/auth/register") {
        // 5 requests per hour per IP
        if (!checkRateLimit(ip, "register", 5, 3600000)) {
            return NextResponse.json(
                {
                    error: "Too many registration attempts. Please try again later.",
                },
                { status: 429 }
            )
        }
    }

    if (pathname === "/api/auth/check-email") {
        // 10 requests per minute per IP
        if (!checkRateLimit(ip, "check-email", 10, 60000)) {
            return NextResponse.json(
                { error: "Too many email checks. Please try again later." },
                { status: 429 }
            )
        }
    }

    return response
}

export const config = {
    matcher: [
        "/api/auth/:path*",
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
}
