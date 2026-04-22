import {
    createErrorResponse,
    createSuccessResponse,
} from "@/lib/auth/error-handling"
import { buildClientKey, rateLimitByKey } from "@/lib/rate-limit"
import { validateEmail } from "@/lib/validation"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
    try {
        // Get client IP for rate limiting
        const clientIp =
            request.headers.get("x-forwarded-for")?.split(",")[0] ||
            request.headers.get("x-real-ip") ||
            "unknown"

        // Apply rate limiting (10 requests per minute per IP)
        const rateLimitKey = buildClientKey({
            ip: clientIp,
            path: "/api/auth/check-email",
            userAgent: request.headers.get("user-agent"),
        })

        const rateLimit = await rateLimitByKey(rateLimitKey)
        if (!rateLimit.success) {
            return NextResponse.json(
                createErrorResponse(
                    "RATE_LIMIT_EXCEEDED",
                    "Too many requests. Please try again later."
                ),
                { status: 429 }
            )
        }

        const searchParams = request.nextUrl.searchParams
        const email = searchParams.get("email")

        if (!email) {
            return NextResponse.json(
                createErrorResponse(
                    "MISSING_EMAIL",
                    "Email parameter is required"
                ),
                { status: 400 }
            )
        }

        // Validate email format
        const emailValidation = validateEmail(email)
        if (!emailValidation.isValid) {
            return NextResponse.json(
                createErrorResponse("INVALID_EMAIL", "Invalid email format"),
                { status: 400 }
            )
        }

        // Check if email exists
        const startTime = Date.now()
        const { data: existingUser, error } = await supabase
            .from("users")
            .select("id")
            .eq("email", email.toLowerCase())
            .single()

        const responseTime = Date.now() - startTime

        if (error && error.code !== "PGRST116") {
            console.error("Database error:", error)
            return NextResponse.json(
                createErrorResponse(
                    "DATABASE_ERROR",
                    "Failed to check email availability"
                ),
                { status: 500 }
            )
        }

        const available = !existingUser

        return NextResponse.json(
            createSuccessResponse({
                email: email.toLowerCase(),
                available,
                responseTime,
            }),
            { status: 200 }
        )
    } catch (error) {
        console.error("Check email error:", error)
        return NextResponse.json(
            createErrorResponse(
                "INTERNAL_ERROR",
                "An unexpected error occurred"
            ),
            { status: 500 }
        )
    }
}
