import { buildClientKey, rateLimitByKey } from "@/lib/rate-limit"
import { validateEmail } from "@/lib/validation"
import { getAdminClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

const supabase = getAdminClient()

export async function GET(request: NextRequest) {
    const startTime = Date.now()

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
                {
                    available: false,
                    error: "Too many requests. Please try again later.",
                },
                { status: 429 }
            )
        }

        const searchParams = request.nextUrl.searchParams
        const email = searchParams.get("email")

        if (!email) {
            return NextResponse.json(
                {
                    available: false,
                    error: "Email parameter is required",
                },
                { status: 400 }
            )
        }

        // Validate email format
        const emailValidation = validateEmail(email)
        if (!emailValidation.isValid) {
            return NextResponse.json(
                {
                    available: false,
                    error: "Invalid email format",
                },
                { status: 400 }
            )
        }

        // Check if email exists — query canonical `users` table.
        // OAuth users store their Gmail in both `email` and `oauth_email`,
        // so we must check both to prevent duplicate email/password registration.
        const normalizedEmail = email.toLowerCase()

        const { data: existingByEmail, error: emailError } = await supabase
            .from("users")
            .select("id")
            .eq("email", normalizedEmail)
            .single()

        if (emailError && emailError.code !== "PGRST116") {
            console.error("Database error:", emailError)
            return NextResponse.json(
                {
                    success: false,
                    available: false,
                    error: "Failed to check email availability",
                },
                { status: 500 }
            )
        }

        // Not found by `email` — also check OAuth email column
        let userFound = existingByEmail
        if (!userFound) {
            const { data: existingByOAuth, error: oauthError } = await supabase
                .from("users")
                .select("id")
                .eq("oauth_email", normalizedEmail)
                .single()

            if (oauthError && oauthError.code !== "PGRST116") {
                console.error("Database error:", oauthError)
                return NextResponse.json(
                    {
                        success: false,
                        available: false,
                        error: "Failed to check email availability",
                    },
                    { status: 500 }
                )
            }

            userFound = existingByOAuth
        }

        const responseTime = Date.now() - startTime

        const available = !userFound

        return NextResponse.json(
            {
                success: true,
                email: normalizedEmail,
                available,
                // Nested `data` matches the legacy EmailInput consumer contract.
                data: {
                    email: normalizedEmail,
                    available,
                },
            },
            {
                status: 200,
                headers: {
                    "X-Response-Time": `${responseTime}ms`,
                },
            }
        )
    } catch (error) {
        console.error("Check email error:", error)
        const responseTime = Date.now() - startTime
        return NextResponse.json(
            {
                available: false,
                error: "An unexpected error occurred",
            },
            {
                status: 500,
                headers: {
                    "X-Response-Time": `${responseTime}ms`,
                },
            }
        )
    }
}
