import { logEmailVerification } from "@/lib/auth/audit-logging"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await context.params

        if (!token) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Verification token is required",
                },
                { status: 400 }
            )
        }

        // Find token in database
        const { data: tokenRecord, error: tokenError } = await supabase
            .from("email_verification_tokens")
            .select("user_id, email, expires_at, verified_at")
            .eq("token", token)
            .single()

        if (tokenError || !tokenRecord) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid or expired verification token",
                },
                { status: 400 }
            )
        }

        // Check if token has already been used
        if (tokenRecord.verified_at) {
            return NextResponse.json(
                {
                    success: false,
                    error: "This verification token has already been used",
                },
                { status: 400 }
            )
        }

        // Check if token has expired
        const expiresAt = new Date(tokenRecord.expires_at)
        if (expiresAt < new Date()) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Verification token has expired",
                },
                { status: 400 }
            )
        }

        // Mark email as verified
        const { error: updateError } = await supabase
            .from("users")
            .update({ email_verified: true })
            .eq("id", tokenRecord.user_id)

        if (updateError) {
            console.error("Email verification error:", updateError)
            return NextResponse.json(
                {
                    success: false,
                    error: "Failed to verify email",
                },
                { status: 500 }
            )
        }

        // Mark token as used
        await supabase
            .from("email_verification_tokens")
            .update({ verified_at: new Date().toISOString() })
            .eq("token", token)

        // Log email verification event
        await logEmailVerification(tokenRecord.email, "", tokenRecord.user_id)

        return NextResponse.json(
            {
                success: true,
                message: "Email verified successfully",
                email: tokenRecord.email,
            },
            { status: 200 }
        )
    } catch (error) {
        console.error("Verify email error:", error)
        return NextResponse.json(
            {
                success: false,
                error: "An unexpected error occurred",
            },
            { status: 500 }
        )
    }
}
