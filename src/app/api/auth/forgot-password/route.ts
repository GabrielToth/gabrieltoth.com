import { checkRateLimitWithDegradation } from "@/lib/auth/rate-limiter"
import { generateRandomHex } from "@/lib/crypto-utils"
import { getAdminClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

const supabase = getAdminClient()

export async function POST(request: NextRequest) {
    try {
        const clientIp =
            request.headers.get("x-forwarded-for")?.split(",")[0] ||
            request.headers.get("x-real-ip") ||
            "unknown"

        const rateLimitCheck = await checkRateLimitWithDegradation(clientIp)
        if (!rateLimitCheck.allowed) {
            return NextResponse.json(
                {
                    error: "Too many requests. Please try again later.",
                },
                { status: 429 }
            )
        }

        const body = await request.json()
        const { email } = body

        if (!email || typeof email !== "string") {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            )
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: "Invalid email format" },
                { status: 400 }
            )
        }

        const { data: user } = await supabase
            .from("users")
            .select("id, email")
            .eq("email", email)
            .single()

        if (!user) {
            return NextResponse.json({
                success: true,
                message:
                    "If an account exists with this email, a reset link has been sent.",
            })
        }

        const token = generateRandomHex(32)
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

        await supabase.from("password_reset_tokens").insert({
            token,
            user_id: user.id,
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString(),
        })

        return NextResponse.json({
            success: true,
            message:
                "If an account exists with this email, a reset link has been sent.",
        })
    } catch (_error) {
        return NextResponse.json(
            { error: "An unexpected error occurred" },
            { status: 500 }
        )
    }
}
