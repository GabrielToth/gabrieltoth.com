import { logEmailVerification } from "@/lib/auth/audit-logging"
import {
    createErrorResponse,
    createSuccessResponse,
} from "@/lib/auth/error-handling"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
    request: NextRequest,
    { params }: { params: { token: string } }
) {
    try {
        const { token } = params

        if (!token) {
            return NextResponse.json(
                createErrorResponse(
                    "MISSING_TOKEN",
                    "Verification token is required"
                ),
                { status: 400 }
            )
        }

        // Find token in database
        const { data: tokenRecord, error: tokenError } = await supabase
            .from("email_verification_tokens")
            .select("user_id, expires_at")
            .eq("token", token)
            .single()

        if (tokenError || !tokenRecord) {
            return NextResponse.json(
                createErrorResponse(
                    "INVALID_TOKEN",
                    "Verification token not found or invalid"
                ),
                { status: 404 }
            )
        }

        // Check if token has expired
        const expiresAt = new Date(tokenRecord.expires_at)
        if (expiresAt < new Date()) {
            return NextResponse.json(
                createErrorResponse(
                    "TOKEN_EXPIRED",
                    "Verification token has expired"
                ),
                { status: 410 }
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
                createErrorResponse(
                    "VERIFICATION_FAILED",
                    "Failed to verify email"
                ),
                { status: 500 }
            )
        }

        // Delete used token
        await supabase
            .from("email_verification_tokens")
            .delete()
            .eq("token", token)

        // Log email verification event
        await logEmailVerification(email, "", tokenRecord.user_id)

        return NextResponse.json(
            createSuccessResponse({
                message: "Email verified successfully",
                userId: tokenRecord.user_id,
            }),
            { status: 200 }
        )
    } catch (error) {
        console.error("Verify email error:", error)
        return NextResponse.json(
            createErrorResponse(
                "INTERNAL_ERROR",
                "An unexpected error occurred"
            ),
            { status: 500 }
        )
    }
}
