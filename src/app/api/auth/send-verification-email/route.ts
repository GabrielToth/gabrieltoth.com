import { logEmailVerification } from "@/lib/auth/audit-logging"
import { sendVerificationEmail } from "@/lib/auth/email-service"
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

const VERIFICATION_TOKEN_EXPIRY = parseInt(
    process.env.VERIFICATION_TOKEN_EXPIRY || "86400000"
) // 24 hours in ms

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, userId, locale = "en" } = body

        if (!email || !userId) {
            return NextResponse.json(
                createErrorResponse(
                    "MISSING_FIELDS",
                    "Email and userId are required"
                ),
                { status: 400 }
            )
        }

        // Verify user exists and email matches
        const { data: user, error: userError } = await supabase
            .from("users")
            .select("id, email")
            .eq("id", userId)
            .single()

        if (userError || !user || user.email !== email.toLowerCase()) {
            return NextResponse.json(
                createErrorResponse(
                    "USER_NOT_FOUND",
                    "User not found or email mismatch"
                ),
                { status: 404 }
            )
        }

        // Generate verification token
        const token = generateRandomHex(32)
        const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY)

        // Store token in database
        const { error: tokenError } = await supabase
            .from("email_verification_tokens")
            .insert({
                token,
                user_id: userId,
                expires_at: expiresAt.toISOString(),
            })

        if (tokenError) {
            console.error("Token creation error:", tokenError)
            return NextResponse.json(
                createErrorResponse(
                    "TOKEN_CREATION_FAILED",
                    "Failed to create verification token"
                ),
                { status: 500 }
            )
        }

        // Send verification email
        const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/auth/verify-email?token=${token}`
        const emailSent = await sendVerificationEmail(
            email,
            verificationLink,
            locale
        )

        if (!emailSent) {
            console.error("Failed to send verification email to:", email)
            return NextResponse.json(
                createErrorResponse(
                    "EMAIL_SEND_FAILED",
                    "Failed to send verification email"
                ),
                { status: 500 }
            )
        }

        // Log email verification event
        await logEmailVerification(email, "", userId)

        return NextResponse.json(
            createSuccessResponse({
                message: "Verification email sent successfully",
                expiresAt: expiresAt.toISOString(),
            }),
            { status: 200 }
        )
    } catch (error) {
        console.error("Send verification email error:", error)
        return NextResponse.json(
            createErrorResponse(
                "INTERNAL_ERROR",
                "An unexpected error occurred"
            ),
            { status: 500 }
        )
    }
}

function generateRandomHex(length: number): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(length)))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("")
}
